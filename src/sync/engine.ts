import {
  ensureRemoteSeedIfEmpty,
  fetchRemoteOnce,
  pushCompraState,
  setFirebaseConnection,
  stateHash,
  type CompraRemoteState,
} from '../firebase/sync'
import { loadCache, saveCache, type CachedCompraState } from '../lib/localCache'

const LOCAL_DEBOUNCE_MS = 80
const CLOUD_DEBOUNCE_MS = 2500
const REMOTE_POLL_MS = 120_000

type StoreSlice = {
  products: CompraRemoteState['products']
  lists: CompraRemoteState['lists']
  activeListId: string | null
  syncing: boolean
  syncError: string | null
  online: boolean
  dirty: boolean
}

type StoreApi = {
  get: () => StoreSlice
  set: (partial: Partial<StoreSlice>) => void
  replaceFromRemote: (data: CompraRemoteState, opts?: { clearDirty?: boolean }) => void
  setHydrated: (value: boolean) => void
}

let api: StoreApi | null = null
let localTimer: ReturnType<typeof setTimeout> | null = null
let cloudTimer: ReturnType<typeof setTimeout> | null = null
let pushGeneration = 0
let lastPushedHash: string | null = null
let started = false
let flushing = false

function snapshotFromStore(): CompraRemoteState {
  const state = api!.get()
  return {
    products: state.products,
    lists: state.lists,
    activeListId: state.activeListId,
  }
}

function persistLocalNow(markDirty = true) {
  if (!api) return
  const state = api.get()
  const previous = loadCache()
  const dirty = markDirty || state.dirty

  if (markDirty) api.set({ dirty: true })

  const cache: CachedCompraState = {
    products: state.products,
    lists: state.lists,
    activeListId: state.activeListId,
    updatedAt: new Date().toISOString(),
    dirty,
    lastSyncedAt: dirty ? (previous?.lastSyncedAt ?? null) : (previous?.lastSyncedAt ?? new Date().toISOString()),
    lastPushedHash,
  }

  saveCache(cache)
}

export function bindSyncEngine(next: StoreApi) {
  api = next
}

export function hydrateFromCache(): boolean {
  if (!api) return false
  const cache = loadCache()
  if (!cache) return false

  lastPushedHash = cache.lastPushedHash
  api.replaceFromRemote(
    {
      products: cache.products,
      lists: cache.lists,
      activeListId: cache.activeListId,
    },
    { clearDirty: false },
  )
  api.set({
    dirty: cache.dirty,
    online: typeof navigator !== 'undefined' ? navigator.onLine : true,
  })
  api.setHydrated(true)
  return true
}

export function schedulePersistAndSync() {
  if (!api) return

  if (localTimer) clearTimeout(localTimer)
  localTimer = setTimeout(() => {
    persistLocalNow(true)
  }, LOCAL_DEBOUNCE_MS)

  if (cloudTimer) clearTimeout(cloudTimer)
  cloudTimer = setTimeout(() => {
    void flushToCloud()
  }, CLOUD_DEBOUNCE_MS)
}

export async function flushToCloud(force = false): Promise<void> {
  if (!api || flushing) return

  const state = api.get()
  if (!state.online && !force) {
    persistLocalNow(true)
    return
  }

  const payload = snapshotFromStore()
  const hash = stateHash(payload)

  // Nada mudou — não gasta escrita no Firebase.
  if (lastPushedHash === hash) {
    const syncedAt = new Date().toISOString()
    saveCache({
      products: payload.products,
      lists: payload.lists,
      activeListId: payload.activeListId,
      updatedAt: syncedAt,
      dirty: false,
      lastSyncedAt: syncedAt,
      lastPushedHash,
    })
    api.set({ syncing: false, syncError: null, dirty: false })
    return
  }

  if (!force && !state.dirty) return

  // Offline: só cache
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    api.set({ online: false, dirty: true, syncing: false })
    persistLocalNow(true)
    setFirebaseConnection(false)
    return
  }

  const generation = ++pushGeneration
  flushing = true
  api.set({ syncing: true, syncError: null, online: true })
  setFirebaseConnection(true)

  try {
    const pushedHash = await pushCompraState(payload)
    if (generation !== pushGeneration) return

    lastPushedHash = pushedHash
    const syncedAt = new Date().toISOString()
    saveCache({
      products: payload.products,
      lists: payload.lists,
      activeListId: payload.activeListId,
      updatedAt: syncedAt,
      dirty: false,
      lastSyncedAt: syncedAt,
      lastPushedHash,
    })
    api.set({ syncing: false, syncError: null, dirty: false })
  } catch (error) {
    if (generation !== pushGeneration) return
    persistLocalNow(true)
    api.set({
      syncing: false,
      dirty: true,
      syncError:
        error instanceof Error
          ? error.message
          : 'Falha ao sincronizar com o Firebase',
    })
  } finally {
    flushing = false
  }
}

async function pullRemoteIfNeeded() {
  if (!api) return
  const state = api.get()
  if (!state.online || state.dirty || state.syncing) return

  try {
    const remote = await fetchRemoteOnce()
    if (!remote || !api) return

    const current = snapshotFromStore()
    const remoteHash = stateHash(remote)
    const localHash = stateHash(current)

    if (remoteHash === localHash) {
      lastPushedHash = remoteHash
      return
    }

    // Se o remoto for diferente e não há edição local pendente, aplica remoto.
    if (!api.get().dirty) {
      lastPushedHash = remoteHash
      api.replaceFromRemote(remote, { clearDirty: true })
      saveCache({
        products: remote.products,
        lists: remote.lists,
        activeListId: remote.activeListId,
        updatedAt: remote.updatedAt ?? new Date().toISOString(),
        dirty: false,
        lastSyncedAt: new Date().toISOString(),
        lastPushedHash,
      })
    }
  } catch {
    // Pull silencioso — não assusta o usuário se o poll falhar.
  }
}

export async function startSyncLifecycle() {
  if (!api || started) return
  started = true

  const online = typeof navigator !== 'undefined' ? navigator.onLine : true
  api.set({ online })
  setFirebaseConnection(online)

  const hadCache = hydrateFromCache()

  if (!online) {
    if (!hadCache) {
      api.replaceFromRemote(
        { products: [], lists: [], activeListId: null },
        { clearDirty: true },
      )
      api.setHydrated(true)
    }
    return
  }

  try {
    if (hadCache && api.get().dirty) {
      await flushToCloud(true)
    } else if (hadCache) {
      // Uma leitura só para alinhar com outros dispositivos.
      await pullRemoteIfNeeded()
    } else {
      const remote = await ensureRemoteSeedIfEmpty()
      if (remote) {
        lastPushedHash = stateHash(remote)
        api.replaceFromRemote(remote, { clearDirty: true })
        saveCache({
          products: remote.products,
          lists: remote.lists,
          activeListId: remote.activeListId,
          updatedAt: remote.updatedAt ?? new Date().toISOString(),
          dirty: false,
          lastSyncedAt: new Date().toISOString(),
          lastPushedHash,
        })
      } else {
        api.replaceFromRemote(
          { products: [], lists: [], activeListId: null },
          { clearDirty: true },
        )
      }
    }
  } catch (error) {
    if (!hadCache) {
      api.set({
        syncError:
          error instanceof Error
            ? error.message
            : 'Não foi possível conectar ao Firebase',
      })
    }
    api.setHydrated(true)
  } finally {
    api.setHydrated(true)
  }

  const onOnline = () => {
    api?.set({ online: true })
    setFirebaseConnection(true)
    if (api?.get().dirty) void flushToCloud(true)
    else void pullRemoteIfNeeded()
  }
  const onOffline = () => {
    api?.set({ online: false, syncing: false })
    setFirebaseConnection(false)
    persistLocalNow(Boolean(api?.get().dirty))
  }

  window.addEventListener('online', onOnline)
  window.addEventListener('offline', onOffline)

  const onVisibility = () => {
    if (document.visibilityState === 'hidden') {
      persistLocalNow(api?.get().dirty ?? false)
      if (api?.get().dirty && navigator.onLine) {
        void flushToCloud(true)
      }
      setFirebaseConnection(false)
      return
    }
    if (navigator.onLine) {
      setFirebaseConnection(true)
      void pullRemoteIfNeeded()
    }
  }
  document.addEventListener('visibilitychange', onVisibility)

  setInterval(() => {
    if (document.visibilityState !== 'visible') return
    if (!navigator.onLine) return
    void pullRemoteIfNeeded()
  }, REMOTE_POLL_MS)

  window.addEventListener('beforeunload', () => {
    persistLocalNow(api?.get().dirty ?? false)
  })
}

export function retryCloudSync() {
  void flushToCloud(true)
}

import type { Product, ShoppingList } from '../types'

export interface CachedCompraState {
  products: Product[]
  lists: ShoppingList[]
  activeListId: string | null
  updatedAt: string
  dirty: boolean
  lastSyncedAt: string | null
  lastPushedHash: string | null
}

const STORAGE_KEY = 'compra.v1.cache'

export function loadCache(): CachedCompraState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<CachedCompraState>
    if (!parsed || typeof parsed !== 'object') return null

    return {
      products: Array.isArray(parsed.products) ? parsed.products : [],
      lists: (Array.isArray(parsed.lists) ? parsed.lists : []).map((list) => ({
        ...list,
        items: Array.isArray(list.items) ? list.items : [],
      })),
      activeListId: parsed.activeListId ?? null,
      updatedAt: parsed.updatedAt ?? new Date().toISOString(),
      dirty: Boolean(parsed.dirty),
      lastSyncedAt: parsed.lastSyncedAt ?? null,
      lastPushedHash: parsed.lastPushedHash ?? null,
    }
  } catch {
    return null
  }
}

export function saveCache(state: CachedCompraState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // Quota cheia ou modo privado — o app segue só em memória.
  }
}

export function clearCache(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore
  }
}

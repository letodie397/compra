import { useEffect } from 'react'
import { ensureRemoteSeed, subscribeCompra } from '../firebase/sync'
import { useAppStore } from '../store/useAppStore'

export function useFirebaseSync() {
  const replaceFromRemote = useAppStore((s) => s.replaceFromRemote)
  const setHydrated = useAppStore((s) => s.setHydrated)
  const setSyncError = useAppStore((s) => s.setSyncError)

  useEffect(() => {
    let unsub: (() => void) | undefined
    let cancelled = false

    async function start() {
      try {
        const initial = await ensureRemoteSeed()
        if (cancelled) return
        replaceFromRemote(initial)
        unsub = subscribeCompra(
          (state) => {
            replaceFromRemote(state)
          },
          (error) => {
            setSyncError(error.message)
            setHydrated(true)
          },
        )
      } catch (error) {
        setSyncError(
          error instanceof Error
            ? error.message
            : 'Não foi possível conectar ao Firebase',
        )
        setHydrated(true)
      }
    }

    void start()

    return () => {
      cancelled = true
      unsub?.()
    }
  }, [replaceFromRemote, setHydrated, setSyncError])
}

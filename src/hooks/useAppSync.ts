import { useEffect } from 'react'
import { startSyncLifecycle } from '../sync/engine'

/** Hidrata cache local e sincroniza o Firebase só quando necessário. */
export function useAppSync() {
  useEffect(() => {
    void startSyncLifecycle()
  }, [])
}

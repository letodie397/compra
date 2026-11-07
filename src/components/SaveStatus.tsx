import { APP_VERSION } from '../version'
import { useAppStore } from '../store/useAppStore'

export function SaveStatus() {
  const syncing = useAppStore((s) => s.syncing)
  const syncError = useAppStore((s) => s.syncError)
  const retrySync = useAppStore((s) => s.retrySync)

  const text = syncError ? 'Falha ao salvar' : syncing ? 'Salvando' : 'Salvo'
  const dot = syncError
    ? 'bg-warn'
    : syncing
      ? 'bg-leaf animate-pulse'
      : 'bg-leaf'

  return (
    <div className="flex flex-col items-end gap-0.5">
      <button
        type="button"
        onClick={() => {
          if (syncError) retrySync()
        }}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-muted"
        title={syncError ?? undefined}
      >
        <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
        {text}
        {syncError ? ' · tocar' : ''}
      </button>
      <span className="text-[10px] font-medium tracking-wide text-muted/70">
        v{APP_VERSION}
      </span>
    </div>
  )
}

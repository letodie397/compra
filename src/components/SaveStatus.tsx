import { APP_VERSION } from '../version'
import { useAppStore } from '../store/useAppStore'

export function SaveStatus() {
  const syncing = useAppStore((s) => s.syncing)
  const syncError = useAppStore((s) => s.syncError)
  const online = useAppStore((s) => s.online)
  const dirty = useAppStore((s) => s.dirty)
  const retrySync = useAppStore((s) => s.retrySync)

  let text = 'Salvo'
  let dot = 'bg-leaf'

  if (!online) {
    text = dirty ? 'Offline · pendente' : 'Offline'
    dot = 'bg-warn'
  } else if (syncError) {
    text = 'Falha ao salvar · tocar'
    dot = 'bg-warn'
  } else if (syncing) {
    text = 'Salvando'
    dot = 'bg-leaf animate-pulse'
  } else if (dirty) {
    text = 'Pendente'
    dot = 'bg-leaf animate-pulse'
  }

  return (
    <div className="flex flex-col items-end gap-0.5">
      <button
        type="button"
        onClick={() => {
          if (syncError || dirty) retrySync()
        }}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-muted"
        title={syncError ?? undefined}
      >
        <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
        {text}
      </button>
      <span className="text-[10px] font-medium tracking-wide text-muted/70">
        v{APP_VERSION}
      </span>
    </div>
  )
}

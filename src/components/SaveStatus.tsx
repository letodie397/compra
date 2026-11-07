import { useAppStore } from '../store/useAppStore'

export function SaveStatus() {
  const syncing = useAppStore((s) => s.syncing)
  const syncError = useAppStore((s) => s.syncError)

  const text = syncError ? 'Sem conexão' : syncing ? 'Salvando' : 'Salvo'
  const dot = syncError ? 'bg-warn' : syncing ? 'bg-leaf animate-pulse' : 'bg-leaf'

  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted">
      <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
      {text}
    </span>
  )
}

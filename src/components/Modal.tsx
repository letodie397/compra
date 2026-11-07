import { X } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'

interface ModalProps {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
  /** Sheet alto e fixo (pickers). Evita encolher e ficar atrás do teclado. */
  fixedHeight?: boolean
}

interface ViewportBox {
  top: number
  height: number
}

function readViewport(): ViewportBox {
  const vv = window.visualViewport
  if (!vv) {
    return { top: 0, height: window.innerHeight }
  }
  return { top: vv.offsetTop, height: vv.height }
}

export function Modal({
  open,
  title,
  onClose,
  children,
  fixedHeight = false,
}: ModalProps) {
  const [viewport, setViewport] = useState<ViewportBox>(() =>
    typeof window === 'undefined'
      ? { top: 0, height: 800 }
      : readViewport(),
  )

  useEffect(() => {
    if (!open) return

    const update = () => setViewport(readViewport())
    update()

    const vv = window.visualViewport
    vv?.addEventListener('resize', update)
    vv?.addEventListener('scroll', update)
    window.addEventListener('resize', update)

    return () => {
      vv?.removeEventListener('resize', update)
      vv?.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [open])

  if (!open) return null

  const sheetHeight = Math.round(viewport.height * (fixedHeight ? 0.92 : 0.88))

  return (
    <div
      className="fixed inset-x-0 z-[80] flex justify-center"
      style={{ top: viewport.top, height: viewport.height }}
    >
      <div
        className="absolute inset-0 bg-ink/45"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className={`relative z-10 mt-auto flex w-full flex-col overflow-hidden rounded-t-3xl bg-card shadow-2xl sm:mx-auto sm:mb-4 sm:max-w-md sm:rounded-3xl ${
          fixedHeight ? '' : 'max-h-[inherit]'
        }`}
        style={{
          height: fixedHeight ? sheetHeight : undefined,
          maxHeight: sheetHeight,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-line px-4 py-3">
          <h2 id="modal-title" className="text-lg font-semibold tracking-tight">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="grid h-9 w-9 place-items-center rounded-full bg-sand text-ink-soft"
          >
            <X size={16} />
          </button>
        </div>
        <div
          className={
            fixedHeight
              ? 'flex min-h-0 flex-1 flex-col overflow-hidden'
              : 'min-h-0 flex-1 overflow-y-auto px-4 py-4'
          }
        >
          {children}
        </div>
      </div>
    </div>
  )
}

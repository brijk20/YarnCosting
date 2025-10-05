import { useEffect } from "react"

const Modal = ({ title, onClose, children, widthClass = "max-w-lg" }) => {
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose?.()
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    const { style } = document.body
    const previousOverflow = style.overflow
    style.overflow = "hidden"

    return () => {
      document.removeEventListener("keydown", handleKeyDown)
      style.overflow = previousOverflow
    }
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 h-full w-full bg-slate-900/40 backdrop-blur-sm"
      />
      <div
        role="dialog"
        aria-modal="true"
        className={`relative z-10 w-full ${widthClass} rounded-2xl border border-slate-200 bg-white/95 p-6 shadow-xl backdrop-blur`}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          {title ? <h2 className="text-base font-semibold text-slate-800">{title}</h2> : <span />}
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-slate-100"
            aria-label="Close dialog"
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

export default Modal

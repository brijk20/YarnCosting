import cn from "../../utils/cn"

const toneStyles = {
  default: "border-slate-200 bg-white",
  muted: "border-slate-200 bg-slate-50",
  indigo: "border-indigo-100 bg-indigo-50",
  emerald: "border-emerald-100 bg-emerald-50",
}

const Card = ({ tone = "default", className, children, padding = "p-6" }) => (
  <div className={cn("rounded-2xl border shadow-sm", toneStyles[tone] ?? toneStyles.default, padding, className)}>
    {children}
  </div>
)

export const CardHeader = ({ eyebrow, title, subtitle, actions }) => (
  <header className="mb-5 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
    <div>
      {eyebrow ? <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{eyebrow}</p> : null}
      {title ? <h2 className="text-xl font-semibold text-slate-900 md:text-2xl">{title}</h2> : null}
      {subtitle ? <p className="mt-1 text-sm text-slate-500">{subtitle}</p> : null}
    </div>
    {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
  </header>
)

export const CardSection = ({ title, description, children, actions }) => (
  <section className="space-y-4">
    {(title || description || actions) && (
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          {title ? <h3 className="text-sm font-semibold text-slate-700">{title}</h3> : null}
          {description ? <p className="text-xs text-slate-500">{description}</p> : null}
        </div>
        {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
      </div>
    )}
    {children}
  </section>
)

export default Card

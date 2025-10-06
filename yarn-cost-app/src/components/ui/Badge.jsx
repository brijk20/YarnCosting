import cn from "../../utils/cn"

const toneStyles = {
  neutral: "border-slate-200 bg-slate-50 text-slate-700",
  indigo: "border-indigo-200 bg-indigo-50 text-indigo-700",
  emerald: "border-emerald-200 bg-emerald-50 text-emerald-700",
  amber: "border-amber-200 bg-amber-50 text-amber-700",
  rose: "border-rose-200 bg-rose-50 text-rose-700",
}

const Badge = ({ tone = "neutral", className, children }) => (
  <span className={cn("inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold", toneStyles[tone] ?? toneStyles.neutral, className)}>
    {children}
  </span>
)

export default Badge

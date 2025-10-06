import cn from "../../utils/cn"

const Metric = ({ label, value, delta, tone = "indigo", helper }) => {
  const palette = {
    indigo: "text-indigo-700",
    emerald: "text-emerald-700",
    amber: "text-amber-700",
    slate: "text-slate-700",
  }

  return (
    <div className="metric">
      <p className="metric-label">{label}</p>
      <p className={cn("metric-value", palette[tone] ?? palette.indigo)}>{value}</p>
      {delta ? (
        <p className="mt-1 text-xs font-medium text-slate-500">{delta}</p>
      ) : null}
      {helper ? <p className="mt-2 text-[11px] text-slate-400">{helper}</p> : null}
    </div>
  )
}

export default Metric

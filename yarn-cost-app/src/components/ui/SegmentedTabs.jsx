import cn from "../../utils/cn"

const SegmentedTabs = ({ tabs = [], active, onChange, className }) => (
  <div
    className={cn(
      "inline-flex items-center rounded-full border border-slate-200 bg-slate-100 p-1 text-xs font-semibold text-slate-600 shadow-inner",
      className,
    )}
  >
    {tabs.map((tab) => {
      const isActive = tab.value === active
      return (
        <button
          key={tab.value}
          type="button"
          onClick={() => onChange?.(tab.value)}
          className={cn(
            "flex items-center gap-2 rounded-full px-4 py-2 transition",
            isActive ? "bg-white text-indigo-600 shadow" : "hover:text-indigo-500",
          )}
        >
          {tab.icon ? <span className="inline-flex h-4 w-4 items-center justify-center">{tab.icon}</span> : null}
          <span>{tab.label}</span>
        </button>
      )
    })}
  </div>
)

export default SegmentedTabs

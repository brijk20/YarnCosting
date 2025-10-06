import ProductionWorkspace from "../components/production/ProductionWorkspace"

const ProductionPage = () => (
  <div className="space-y-8">
    <div className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm">
      <h1 className="text-2xl font-semibold text-slate-800">Production intelligence</h1>
      <p className="mt-2 text-sm text-slate-500">
        Map every loom, operator, and shift to build a live picture of metrage, efficiency, and accuracy. Tailored for
        airjet and waterjet lines across Gujarat industrial clusters.
      </p>
      <p className="mt-3 text-xs text-slate-500">
        Suggested routine: update machines monthly, maintain worker roster weekly, and log shift output daily right from
        the supervisor’s tablet or phone.
      </p>
    </div>

    <ProductionWorkspace />
  </div>
)

export default ProductionPage

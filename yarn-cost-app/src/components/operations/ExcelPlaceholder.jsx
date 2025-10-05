const ExcelPlaceholder = ({ sales, payments }) => (
  <div className="space-y-4 text-sm text-slate-600">
    <div>
      <h3 className="text-sm font-semibold text-slate-700">Excel integration roadmap</h3>
      <p className="text-xs text-slate-500">
        Upload, sync, and export business ledgers directly from the web app. The current release stores your entries
        safely in the browser; Supabase-backed sync is next on the roadmap.
      </p>
    </div>

    <div className="rounded-2xl border border-slate-200 bg-white/85 p-4">
      <p className="font-semibold text-slate-700">Coming soon</p>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-slate-500">
        <li>Secure Supabase storage for all operations data.</li>
        <li>Excel/CSV import that maps parties, invoices, and payments automatically.</li>
        <li>Template downloads for sales, payments, and inventory.</li>
        <li>One-click exports with filters applied.</li>
      </ul>
    </div>

    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 p-4 text-xs text-slate-500">
      <p>
        Current session holds <strong>{sales.length}</strong> sales and <strong>{payments.length}</strong> payments. Data
        stays cached locally and will sync to the cloud once Supabase persistence ships.
      </p>
    </div>
  </div>
)

export default ExcelPlaceholder

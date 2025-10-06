import { useMemo, useState } from "react"
import useOperationsStore, {
  calculateDueDate,
  calculateInterestDue,
  computeDashboardSnapshot,
  computeGstSummary,
  computeProfitAndLoss,
} from "../../store/operationsStore"
import Card, { CardHeader } from "../ui/Card"
import Button from "../ui/Button"
import Metric from "../ui/Metric"
import Badge from "../ui/Badge"
import SegmentedTabs from "../ui/SegmentedTabs"
import OperationsDashboard from "./OperationsDashboard"
import SalesEntry from "./SalesEntry"
import PaymentEntry from "./PaymentEntry"
import TransactionsView from "./TransactionsView"
import ReportsView from "./ReportsView"
import ExcelPlaceholder from "./ExcelPlaceholder"

const tabs = [
  { id: "overview", label: "Overview" },
  { id: "sales", label: "Invoices" },
  { id: "payments", label: "Collections" },
  { id: "ledger", label: "Ledger" },
  { id: "analytics", label: "Analytics" },
  { id: "exports", label: "Excel / CSV" },
]

const OperationsWorkspace = () => {
  const [activeTab, setActiveTab] = useState("overview")
  const sales = useOperationsStore((state) => state.sales)
  const payments = useOperationsStore((state) => state.payments)

  const summary = useMemo(() => computeDashboardSnapshot(sales), [sales])
  const gst = useMemo(() => computeGstSummary(sales), [sales])
  const pnl = useMemo(() => computeProfitAndLoss(sales), [sales])
  const parties = useMemo(() => Array.from(new Set(sales.map((sale) => sale.party))).sort(), [sales])
  const interestOnlyCount = useMemo(() => {
    const now = new Date()
    return sales.filter((sale) => sale.balance === 0 && calculateInterestDue(sale, now) > 0).length
  }, [sales])

  return (
    <section className="space-y-8">
      <Card>
        <CardHeader
          eyebrow="Receivables cockpit"
          title="Business operations"
          subtitle="Monitor invoices, interest, and compliance health at a glance."
          actions={[
            <Button key="sale" variant="primary" size="pill" onClick={() => setActiveTab("sales")}>New invoice</Button>,
            <Button key="payment" variant="secondary" size="pill" onClick={() => setActiveTab("payments")}>
              Record payment
            </Button>,
          ]}
        />
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Metric label="Principal outstanding" value={currency(summary.totalOutstanding)} tone="indigo" />
          <Metric label="Interest due" value={currency(summary.totalInterest)} tone="amber" helper="Interest applied LIFO" />
          <Metric label="GST liability" value={currency(gst.total)} tone="indigo" helper="Net of CGST/SGST/IGST" />
          <Metric label="Gross profit" value={currency(pnl.grossProfit)} tone="emerald" helper="Revenue − cost of sale" />
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <Card tone="muted" className="space-y-3">
            <p className="text-[11px] uppercase tracking-wide text-slate-500">Operations pulse</p>
            <div className="space-y-2 text-sm text-slate-600">
              <div className="flex items-center justify-between">
                <span>Overdue invoices</span>
                <Badge tone="rose">{summary.overdueCount}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Interest-only cases</span>
                <Badge tone="amber">{interestOnlyCount}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Active parties</span>
                <Badge tone="indigo">{parties.length}</Badge>
              </div>
            </div>
          </Card>
          <Card tone="muted" className="space-y-2">
            <p className="text-[11px] uppercase tracking-wide text-slate-500">Taxable turnover</p>
            <p className="text-lg font-semibold text-slate-800">{currency(gst.taxable)}</p>
            <p className="text-[11px] text-slate-500">Use for GSTR-1 summary. Drill down via Analytics tab.</p>
          </Card>
          <Card tone="muted" className="space-y-2">
            <p className="text-[11px] uppercase tracking-wide text-slate-500">Collections velocity</p>
            <p className="text-lg font-semibold text-slate-800">
              {payments.length ? `${Math.round((summary.totalOutstanding / Math.max(payments.length, 1)) || 0)} avg` : "Track"}
            </p>
            <p className="text-[11px] text-slate-500">Avg. balance per payment. Target under ₹45k for tighter cycles.</p>
          </Card>
        </div>
      </Card>

      <Card tone="default" padding="p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <SegmentedTabs
            tabs={tabs.map((tab) => ({ value: tab.id, label: tab.label }))}
            active={activeTab}
            onChange={setActiveTab}
          />
          <div className="flex flex-wrap gap-2 text-xs text-slate-500">
            <Badge tone="indigo">Receipts: {payments.length.toLocaleString("en-IN")}</Badge>
            <Badge tone="emerald">Invoices: {sales.length.toLocaleString("en-IN")}</Badge>
          </div>
        </div>

        <div className="mt-8 space-y-6">
          {activeTab === "overview" && <OperationsDashboard parties={parties} summary={summary} sales={sales} />}
          {activeTab === "sales" && <SalesEntry />}
          {activeTab === "payments" && <PaymentEntry />}
          {activeTab === "ledger" && (
            <TransactionsView sales={sales} calculateInterest={calculateInterestDue} calculateDueDate={calculateDueDate} />
          )}
          {activeTab === "analytics" && <ReportsView sales={sales} />}
          {activeTab === "exports" && <ExcelPlaceholder sales={sales} payments={payments} />}
        </div>
      </Card>
    </section>
  )
}

const currency = (value) => `₹${(value ?? 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`

export default OperationsWorkspace

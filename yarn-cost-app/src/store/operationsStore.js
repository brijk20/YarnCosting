import { create } from "zustand"
import { persist } from "zustand/middleware"

const MONTHLY_INTEREST_RATE = 0.015
const CREDIT_DAYS = 90

const calculateDueDate = (isoDate) => {
  const base = new Date(isoDate)
  if (Number.isNaN(base.getTime())) return isoDate
  base.setDate(base.getDate() + CREDIT_DAYS)
  return base.toISOString().slice(0, 10)
}

const daysBetween = (from, to) => {
  const start = new Date(from)
  const end = new Date(to)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0
  return Math.floor((end - start) / (1000 * 60 * 60 * 24))
}

const calculateInterest = (sale, referenceDate = new Date()) => {
  if (!sale || sale.balance <= 0) return 0
  const dueDate = new Date(sale.dueDate)
  const today = new Date(referenceDate)
  if (Number.isNaN(dueDate.getTime()) || today <= dueDate) return 0
  const monthsOverdue = Math.max(0, Math.floor(daysBetween(dueDate, today) / 30))
  return sale.balance * MONTHLY_INTEREST_RATE * monthsOverdue
}

const newId = () => Math.random().toString(36).slice(2, 12)

const createOperationsStore = (set, get) => ({
  sales: [],
  payments: [],
  upsertSales: (sales) => set({ sales }),
  upsertPayments: (payments) => set({ payments }),

  addSale: ({ party, saleDate, amount, description }) => {
    const saleAmount = Number(amount)
    if (!party || !saleDate || Number.isNaN(saleAmount) || saleAmount <= 0) {
      throw new Error("Invalid sale parameters")
    }

    const entry = {
      id: newId(),
      party,
      saleDate,
      amount: saleAmount,
      description: description ?? "",
      dueDate: calculateDueDate(saleDate),
      paidAmount: 0,
      balance: saleAmount,
      status: "pending",
    }

    set((state) => ({ sales: [...state.sales, entry] }))
  },

  addPayment: ({ party, paymentDate, amount }) => {
    const paymentAmount = Number(amount)
    if (!party || !paymentDate || Number.isNaN(paymentAmount) || paymentAmount <= 0) {
      throw new Error("Invalid payment parameters")
    }

    const state = get()
    let remaining = paymentAmount
    const sales = [...state.sales]
    const relevantSales = sales
      .filter((sale) => sale.party === party && sale.balance > 0)
      .sort((a, b) => new Date(b.saleDate) - new Date(a.saleDate))

    const paymentRecord = {
      id: newId(),
      party,
      paymentDate,
      amount: paymentAmount,
      appliedTo: [],
    }

    for (const sale of relevantSales) {
      if (remaining <= 0) break
      const applied = Math.min(remaining, sale.balance)
      sale.balance -= applied
      sale.paidAmount += applied
      sale.status = sale.balance === 0 ? "paid" : "partial"
      remaining -= applied
      paymentRecord.appliedTo.push({ saleId: sale.id, amount: applied })
    }

    set({
      sales,
      payments: [...state.payments, paymentRecord],
    })
  },

  getPartySummary: (party) => {
    if (!party) return null
    const state = get()
    const sales = state.sales.filter((sale) => sale.party === party)
    if (!sales.length) return null

    const now = new Date()

    const totals = sales.reduce(
      (acc, sale) => {
        acc.totalSales += sale.amount
        acc.totalPaid += sale.paidAmount
        acc.outstanding += sale.balance
        acc.interest += calculateInterest(sale, now)
        if (sale.balance > 0 && new Date(sale.dueDate) < now) {
          acc.overdue += 1
        }
        acc.transactions += 1
        return acc
      },
      { totalSales: 0, totalPaid: 0, outstanding: 0, interest: 0, overdue: 0, transactions: 0 },
    )

    return totals
  },

  getDashboardSnapshot: () => {
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()

    return get().sales.reduce(
      (acc, sale) => {
        acc.totalOutstanding += sale.balance
        acc.totalInterest += calculateInterest(sale, now)
        if (sale.balance > 0 && new Date(sale.dueDate) < now) acc.overdueCount += 1
        const date = new Date(sale.saleDate)
        if (date.getMonth() === currentMonth && date.getFullYear() === currentYear) {
          acc.monthlySales += sale.amount
        }
        return acc
      },
      { totalOutstanding: 0, totalInterest: 0, overdueCount: 0, monthlySales: 0 },
    )
  },
})

const useOperationsStore = create(
  persist(createOperationsStore, {
    name: "ambrox-operations-store",
    partialize: (state) => ({ sales: state.sales, payments: state.payments }),
  }),
)

export default useOperationsStore
export { calculateDueDate, calculateInterest, daysBetween, CREDIT_DAYS, MONTHLY_INTEREST_RATE }

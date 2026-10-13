import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getBudget, getExpenditures } from '../api'
import { BudgetResponse, Expenditure } from '../types'
import StatusBadge from '../components/StatusBadge'
import ProgressBar from '../components/ProgressBar'
import { CheckCircle, Clock, Lock } from 'lucide-react'

function formatCrore(n: number) {
  return `₹${(n / 1e7).toFixed(2)} Cr`
}

function formatInr(n: number) {
  if (n >= 1e7) return `₹${(n / 1e7).toFixed(2)} Cr`
  if (n >= 1e5) return `₹${(n / 1e5).toFixed(1)} L`
  return `₹${n.toLocaleString('en-IN')}`
}

function Spinner() {
  return (
    <div className="flex items-center justify-center h-48">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
    </div>
  )
}

function ErrorMsg({ message }: { message: string }) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
      <p className="text-red-600 text-sm">{message}</p>
    </div>
  )
}

function TrancheCard({ t }: { t: BudgetResponse['tranches'][0] }) {
  const isReleased = !!t.actual_release
  const Icon = isReleased ? CheckCircle : t.status === 'pending' ? Lock : Clock

  const allocTotal = t.allocations.reduce((s, a) => s + a.amount_inr, 0)
  const byDept = t.allocations.reduce<Record<string, number>>((acc, a) => {
    acc[a.dept_id] = (acc[a.dept_id] ?? 0) + a.amount_inr
    return acc
  }, {})

  return (
    <div className={`rounded-xl border p-5 ${isReleased ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <Icon className={`w-5 h-5 ${isReleased ? 'text-green-600' : 'text-gray-400'}`} />
          <div>
            <p className="font-bold text-gray-900">{t.tranche_id}</p>
            <p className="text-xs text-gray-500">{t.pct_of_grant}% of grant</p>
          </div>
        </div>
        <StatusBadge status={t.status} />
      </div>

      <p className="text-2xl font-bold text-gray-900 mb-1">{formatCrore(t.amount_inr)}</p>

      <div className="space-y-1 text-xs text-gray-600 mb-3">
        {t.actual_release ? (
          <p>Released: <span className="font-medium text-green-700">{t.actual_release}</span></p>
        ) : (
          <p>Expected: <span className="font-medium text-orange-600">{t.expected_release ?? 'TBD'}</span></p>
        )}
        <p>Condition: <span className="font-medium">{t.condition_milestone_id}</span>
          {t.milestone_name && <span className="text-gray-400 ml-1">— {t.milestone_name}</span>}
        </p>
      </div>

      {allocTotal > 0 && (
        <div className="border-t border-gray-200 pt-3">
          <p className="text-xs text-gray-500 mb-2">
            Allocated: {formatCrore(allocTotal)} across {t.allocations.length} lines
          </p>
          <div className="space-y-1">
            {Object.entries(byDept).slice(0, 5).map(([dept, amt]) => (
              <div key={dept} className="flex justify-between text-xs">
                <span className="text-gray-500">{dept}</span>
                <span className="text-gray-700">{formatCrore(amt)}</span>
              </div>
            ))}
            {Object.keys(byDept).length > 5 && (
              <p className="text-xs text-gray-400">+{Object.keys(byDept).length - 5} more depts</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function ExpenditureTable({ expenditures }: { expenditures: Expenditure[] }) {
  const [sortKey, setSortKey] = useState<keyof Expenditure>('expense_date')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [search, setSearch] = useState('')

  const handleSort = (key: keyof Expenditure) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('desc') }
  }

  const filtered = expenditures.filter(e => {
    const q = search.toLowerCase()
    return (
      !q ||
      e.dept_id?.toLowerCase().includes(q) ||
      e.category?.toLowerCase().includes(q) ||
      e.description?.toLowerCase().includes(q) ||
      e.vendor?.toLowerCase().includes(q) ||
      e.expense_id?.toLowerCase().includes(q)
    )
  })

  const sorted = [...filtered].sort((a, b) => {
    const av = a[sortKey] ?? ''
    const bv = b[sortKey] ?? ''
    const cmp = String(av).localeCompare(String(bv), undefined, { numeric: true })
    return sortDir === 'asc' ? cmp : -cmp
  })

  const Th = ({ k, label }: { k: keyof Expenditure; label: string }) => (
    <th
      className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100 select-none"
      onClick={() => handleSort(k)}
    >
      {label} {sortKey === k ? (sortDir === 'asc' ? '↑' : '↓') : ''}
    </th>
  )

  return (
    <div>
      <div className="mb-3">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by dept, category, description, vendor…"
          className="w-full max-w-sm px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400"
        />
        <span className="ml-3 text-xs text-gray-400">{filtered.length} of {expenditures.length} records</span>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full text-xs">
          <thead className="bg-gray-50">
            <tr>
              <Th k="expense_date" label="Date" />
              <Th k="dept_id" label="Dept" />
              <Th k="category" label="Category" />
              <Th k="description" label="Description" />
              <Th k="amount_inr" label="Amount" />
              <Th k="po_id" label="PO" />
              <Th k="requested_by" label="Requester" />
              <Th k="approved_by" label="Approver" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sorted.slice(0, 200).map(e => (
              <tr key={e.expense_id} className="hover:bg-gray-50">
                <td className="px-3 py-2 text-gray-500">{e.expense_date}</td>
                <td className="px-3 py-2 font-medium text-gray-700">{e.dept_id}</td>
                <td className="px-3 py-2">
                  <span className="capitalize text-gray-600">{e.category?.replace(/_/g, ' ')}</span>
                </td>
                <td className="px-3 py-2 text-gray-600 max-w-xs truncate" title={e.description}>
                  {e.description}
                </td>
                <td className="px-3 py-2 font-medium text-gray-900 text-right">
                  {formatInr(e.amount_inr)}
                </td>
                <td className="px-3 py-2 text-gray-400 font-mono">{e.po_id ?? '—'}</td>
                <td className="px-3 py-2 text-gray-500">{e.requested_by}</td>
                <td className={`px-3 py-2 ${e.requested_by === e.approved_by ? 'text-red-600 font-semibold' : 'text-gray-500'}`}>
                  {e.approved_by}
                  {e.requested_by === e.approved_by && ' ⚠'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {sorted.length > 200 && (
          <p className="text-xs text-gray-400 text-center py-2">
            Showing 200 of {sorted.length} results. Use search to narrow down.
          </p>
        )}
      </div>
    </div>
  )
}

export default function BudgetPage() {
  const [tab, setTab] = useState<'tranches' | 'expenditures'>('tranches')

  const { data: budget, isLoading: budgetLoading, error: budgetError } = useQuery<BudgetResponse>({
    queryKey: ['budget'],
    queryFn: getBudget,
  })

  const { data: expenditures = [], isLoading: expLoading, error: expError } = useQuery<Expenditure[]>({
    queryKey: ['expenditures'],
    queryFn: getExpenditures,
    enabled: tab === 'expenditures',
  })

  const spentPct = budget
    ? Math.round((budget.total_spent_inr / budget.total_released_inr) * 100)
    : 0

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Budget & Finance</h1>
        <p className="text-sm text-gray-500 mt-0.5">Grant tranches, allocations, and expenditures</p>
      </div>

      {/* KPI summary strip */}
      {budget && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <p className="text-xs text-gray-500 uppercase">Total Grant</p>
            <p className="text-xl font-bold text-gray-900">{formatCrore(budget.total_grant_inr)}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <p className="text-xs text-gray-500 uppercase">Released</p>
            <p className="text-xl font-bold text-green-700">{formatCrore(budget.total_released_inr)}</p>
            <ProgressBar
              value={Math.round(budget.total_released_inr / budget.total_grant_inr * 100)}
              color="bg-green-500"
              height="h-1"
            />
          </div>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <p className="text-xs text-gray-500 uppercase">Allocated</p>
            <p className="text-xl font-bold text-blue-700">{formatCrore(budget.total_allocated_inr)}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <p className="text-xs text-gray-500 uppercase">Spent</p>
            <p className={`text-xl font-bold ${spentPct > 90 ? 'text-red-600' : 'text-gray-900'}`}>
              {formatCrore(budget.total_spent_inr)}
            </p>
            <ProgressBar
              value={spentPct}
              color={spentPct > 90 ? 'bg-red-500' : 'bg-blue-500'}
              showLabel
              height="h-1"
            />
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-1">
          {(['tranches', 'expenditures'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 text-sm font-medium capitalize border-b-2 transition-colors ${
                tab === t
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {t}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab content */}
      {tab === 'tranches' && (
        <>
          {budgetLoading && <Spinner />}
          {budgetError && <ErrorMsg message={String(budgetError)} />}
          {budget && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {budget.tranches.map(t => (
                <TrancheCard key={t.tranche_id} t={t} />
              ))}
            </div>
          )}
        </>
      )}

      {tab === 'expenditures' && (
        <>
          {expLoading && <Spinner />}
          {expError && <ErrorMsg message={String(expError)} />}
          {!expLoading && <ExpenditureTable expenditures={expenditures} />}
        </>
      )}
    </div>
  )
}

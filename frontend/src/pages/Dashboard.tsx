import { useQuery } from '@tanstack/react-query'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { getDashboard, getAnomalies } from '../api'
import { DashboardResponse, AnomalyItem } from '../types'
import StatusBadge from '../components/StatusBadge'
import AnomalyPanel from '../components/AnomalyPanel'
import ProgressBar from '../components/ProgressBar'

function formatCrore(n: number) {
  if (!n && n !== 0) return '—'
  return `₹${(n / 1e7).toFixed(2)} Cr`
}

function KPICard({
  label,
  value,
  sub,
  color = 'text-gray-900',
}: {
  label: string
  value: string
  sub?: string
  color?: string
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  )
}

function Spinner() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
    </div>
  )
}

function ErrorMsg({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md text-center">
        <p className="text-red-600 font-medium">Failed to load data</p>
        <p className="text-red-400 text-sm mt-1">{message}</p>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { data, isLoading, error } = useQuery<DashboardResponse>({
    queryKey: ['dashboard'],
    queryFn: getDashboard,
  })
  const { data: anomalies = [] } = useQuery<AnomalyItem[]>({
    queryKey: ['anomalies'],
    queryFn: getAnomalies,
  })

  if (isLoading) return <Spinner />
  if (error) return <ErrorMsg message={String(error)} />
  if (!data) return null

  const { kpi, task_counts, anomaly_counts, milestones, dept_budgets } = data

  const spentPct = kpi.total_released_inr > 0
    ? Math.round((kpi.total_spent_inr / kpi.total_released_inr) * 100)
    : 0

  // Sort anomalies: high first
  const sortedAnomalies = [...anomalies].sort((a, b) => {
    const ord = { high: 0, medium: 1, low: 2 }
    return (ord[a.severity] ?? 3) - (ord[b.severity] ?? 3)
  })

  // Chart data (in Crore)
  const chartData = dept_budgets.map(d => ({
    name: d.dept_id,
    Budget: parseFloat((d.budget / 1e7).toFixed(2)),
    Allocated: parseFloat((d.allocated / 1e7).toFixed(2)),
    Spent: parseFloat((d.spent / 1e7).toFixed(2)),
  }))

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Programme Dashboard</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          K02 Metro Airport Link · Data as of 15 September 2026
        </p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          label="Total Grant"
          value={formatCrore(kpi.total_grant_inr)}
          sub={`Released: ${formatCrore(kpi.total_released_inr)}`}
        />
        <KPICard
          label="Total Spent"
          value={formatCrore(kpi.total_spent_inr)}
          sub={`${spentPct}% of released`}
          color={spentPct > 90 ? 'text-red-600' : 'text-gray-900'}
        />
        <KPICard
          label="Tasks"
          value={`${task_counts.completed} / ${task_counts.total}`}
          sub={`${task_counts.in_progress} in progress · ${task_counts.not_started} not started`}
        />
        <KPICard
          label="Anomalies"
          value={String(anomaly_counts.total)}
          sub={`${anomaly_counts.high} high · ${anomaly_counts.medium} med · ${anomaly_counts.low} low`}
          color={anomaly_counts.high > 0 ? 'text-red-600' : 'text-gray-900'}
        />
      </div>

      {/* Task progress bar */}
      <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Overall Task Progress</h2>
        <div className="flex gap-1 h-4 rounded-full overflow-hidden">
          <div
            className="bg-green-500"
            style={{ width: `${(task_counts.completed / task_counts.total) * 100}%` }}
            title={`Completed: ${task_counts.completed}`}
          />
          <div
            className="bg-blue-400"
            style={{ width: `${(task_counts.in_progress / task_counts.total) * 100}%` }}
            title={`In progress: ${task_counts.in_progress}`}
          />
          <div
            className="bg-gray-200"
            style={{ width: `${(task_counts.not_started / task_counts.total) * 100}%` }}
            title={`Not started: ${task_counts.not_started}`}
          />
        </div>
        <div className="flex gap-4 mt-2 text-xs text-gray-500">
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block" />Completed ({task_counts.completed})</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-blue-400 inline-block" />In Progress ({task_counts.in_progress})</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-gray-200 inline-block border border-gray-300" />Not Started ({task_counts.not_started})</span>
        </div>
      </div>

      {/* Middle row: milestones + anomalies */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Milestones */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-700">Milestones & Tranche Status</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-50 text-gray-500 uppercase tracking-wide">
                  <th className="px-4 py-2 text-left">Milestone</th>
                  <th className="px-4 py-2 text-left">Due</th>
                  <th className="px-4 py-2 text-left">Status</th>
                  <th className="px-4 py-2 text-left">Tranche</th>
                  <th className="px-4 py-2 text-center">Risk</th>
                </tr>
              </thead>
              <tbody>
                {milestones.slice(0, 8).map(ms => (
                  <tr key={ms.milestone_id} className="border-t border-gray-50 hover:bg-gray-50">
                    <td className="px-4 py-2.5">
                      <span className="font-medium text-gray-800">{ms.milestone_id}</span>
                      <br />
                      <span className="text-gray-500">{ms.name}</span>
                    </td>
                    <td className="px-4 py-2.5 text-gray-500">{ms.due_date ?? '—'}</td>
                    <td className="px-4 py-2.5">
                      <StatusBadge status={ms.reported_status} small />
                    </td>
                    <td className="px-4 py-2.5 text-gray-600">
                      {ms.releases_tranche_id
                        ? `${ms.releases_tranche_id} (${formatCrore(ms.tranche_amount_inr ?? 0)})`
                        : '—'}
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      {ms.is_at_risk ? (
                        <span className="text-red-500 font-bold">⚠</span>
                      ) : (
                        <span className="text-green-500">✓</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top anomalies */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-700">
              Top Anomalies
              <span className="ml-2 text-xs text-gray-400 font-normal">
                {anomaly_counts.total} total
              </span>
            </h2>
          </div>
          <div className="p-4">
            <AnomalyPanel anomalies={sortedAnomalies} limit={6} />
          </div>
        </div>
      </div>

      {/* Department budget chart */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">
          Department Budget Overview (₹ Crore)
        </h2>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 0, right: 20, left: 40, bottom: 0 }}
          >
            <XAxis type="number" tick={{ fontSize: 11 }} />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={50} />
            <Tooltip formatter={(v: number) => `₹${v} Cr`} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="Budget" fill="#e2e8f0" radius={[0, 2, 2, 0]} />
            <Bar dataKey="Allocated" fill="#93c5fd" radius={[0, 2, 2, 0]} />
            <Bar dataKey="Spent" fill="#3b82f6" radius={[0, 2, 2, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

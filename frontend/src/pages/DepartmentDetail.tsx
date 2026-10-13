import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getDepartments, getDepartment } from '../api'
import { DepartmentSummary, DepartmentDetail as DeptDetail } from '../types'
import StatusBadge from '../components/StatusBadge'
import ProgressBar from '../components/ProgressBar'
import { ArrowLeft, Users, CheckSquare, IndianRupee } from 'lucide-react'

function formatCrore(n: number) {
  return `₹${(n / 1e7).toFixed(2)} Cr`
}

function formatLakh(n: number) {
  return `₹${(n / 1e5).toFixed(1)} L`
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
        <p className="text-red-600 font-medium">Failed to load</p>
        <p className="text-red-400 text-sm mt-1">{message}</p>
      </div>
    </div>
  )
}

function DeptCard({
  dept,
  onClick,
}: {
  dept: DepartmentSummary
  onClick: () => void
}) {
  const { task_counts } = dept
  const pct =
    task_counts.total > 0
      ? Math.round((task_counts.completed / task_counts.total) * 100)
      : 0

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 cursor-pointer hover:shadow-md hover:border-blue-200 transition-all"
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-gray-900 text-sm">{dept.dept_name}</h3>
          <p className="text-xs text-gray-500 mt-0.5">{dept.dept_id}</p>
        </div>
        <span className="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded-md">
          {dept.head_name.split(' ').slice(0, 2).join(' ')}
        </span>
      </div>

      <div className="mb-3">
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>Tasks: {task_counts.completed}/{task_counts.total}</span>
          <span>{pct}%</span>
        </div>
        <ProgressBar value={pct} color="bg-green-500" />
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        <div>
          <p className="text-xs text-gray-500">Budget</p>
          <p className="text-xs font-medium text-gray-700">{formatCrore(dept.total_budget_inr)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Allocated</p>
          <p className="text-xs font-medium text-blue-600">{formatLakh(dept.allocated_inr)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Spent</p>
          <p className={`text-xs font-medium ${dept.spent_inr > dept.total_budget_inr ? 'text-red-600' : 'text-gray-700'}`}>
            {formatLakh(dept.spent_inr)}
          </p>
        </div>
      </div>

      <div className="flex gap-1.5 mt-3">
        <span className="text-xs px-1.5 py-0.5 rounded bg-green-50 text-green-700">
          {task_counts.completed} done
        </span>
        <span className="text-xs px-1.5 py-0.5 rounded bg-blue-50 text-blue-700">
          {task_counts.in_progress} active
        </span>
        <span className="text-xs px-1.5 py-0.5 rounded bg-gray-50 text-gray-600">
          {task_counts.not_started} pending
        </span>
      </div>
    </div>
  )
}

function DeptDetailView({ deptId }: { deptId: string }) {
  const navigate = useNavigate()
  const { data, isLoading, error } = useQuery<DeptDetail>({
    queryKey: ['department', deptId],
    queryFn: () => getDepartment(deptId),
  })

  if (isLoading) return <Spinner />
  if (error) return <ErrorMsg message={String(error)} />
  if (!data) return null

  const sortedTasks = [...data.tasks].sort((a, b) => {
    const ord: Record<string, number> = { in_progress: 0, not_started: 1, completed: 2 }
    return (ord[a.status] ?? 3) - (ord[b.status] ?? 3)
  })

  const spentPct =
    data.total_budget_inr > 0
      ? Math.round((data.spent_inr / data.total_budget_inr) * 100)
      : 0

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <button
          onClick={() => navigate('/departments')}
          className="flex items-center gap-1 text-sm text-blue-600 hover:underline mb-3"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> All departments
        </button>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{data.dept_name}</h1>
            <p className="text-sm text-gray-500 mt-0.5">{data.scope}</p>
            <p className="text-xs text-gray-400 mt-1">Head: {data.head_name}</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-gray-900">{formatCrore(data.total_budget_inr)}</p>
            <p className="text-xs text-gray-500">Total budget</p>
          </div>
        </div>
      </div>

      {/* Budget summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center gap-2 mb-2">
            <IndianRupee className="w-4 h-4 text-gray-400" />
            <p className="text-xs font-medium text-gray-500 uppercase">Allocated</p>
          </div>
          <p className="text-xl font-bold text-blue-600">{formatCrore(data.allocated_inr)}</p>
          <p className="text-xs text-gray-400">{Math.round(data.allocated_inr / data.total_budget_inr * 100)}% of budget</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center gap-2 mb-2">
            <IndianRupee className="w-4 h-4 text-gray-400" />
            <p className="text-xs font-medium text-gray-500 uppercase">Spent</p>
          </div>
          <p className={`text-xl font-bold ${spentPct > 100 ? 'text-red-600' : 'text-gray-900'}`}>
            {formatCrore(data.spent_inr)}
          </p>
          <ProgressBar
            value={spentPct}
            color={spentPct > 90 ? 'bg-red-500' : 'bg-blue-500'}
            showLabel
          />
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="text-xs font-medium text-gray-500 uppercase mb-2">By Category</p>
          <div className="space-y-1">
            {data.allocations_by_category.slice(0, 4).map(cat => (
              <div key={cat.category} className="flex justify-between text-xs">
                <span className="text-gray-500 capitalize">{cat.category.replace(/_/g, ' ')}</span>
                <span className="font-medium text-gray-700">{formatCrore(cat.amount_inr)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tasks + People */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tasks */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
            <CheckSquare className="w-4 h-4 text-gray-400" />
            <h2 className="text-sm font-semibold text-gray-700">Tasks ({data.tasks.length})</h2>
          </div>
          <div className="divide-y divide-gray-50 max-h-96 overflow-y-auto">
            {sortedTasks.map(t => (
              <div key={t.task_id} className="px-5 py-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-gray-400">{t.task_id}</span>
                      <StatusBadge status={t.status} small />
                    </div>
                    <p className="text-sm text-gray-800 mt-0.5 leading-tight">{t.task_name}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    {t.percent_complete > 0 && (
                      <span className="text-xs text-gray-400">{t.percent_complete}%</span>
                    )}
                  </div>
                </div>
                {t.percent_complete > 0 && (
                  <div className="mt-1.5">
                    <ProgressBar value={t.percent_complete} height="h-1" />
                  </div>
                )}
                <div className="flex gap-3 mt-1 text-xs text-gray-400">
                  {t.planned_start && <span>Start: {t.planned_start}</span>}
                  {t.planned_end && <span>End: {t.planned_end}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* People */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
            <Users className="w-4 h-4 text-gray-400" />
            <h2 className="text-sm font-semibold text-gray-700">People ({data.people.length})</h2>
          </div>
          <div className="divide-y divide-gray-50 max-h-96 overflow-y-auto">
            {data.people.map(p => (
              <div key={p.researcher_id} className="px-5 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-800">{p.full_name}</p>
                  <p className="text-xs text-gray-500">{p.role}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">{p.project_allocation_pct}%</span>
                  <StatusBadge status={p.status} small />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function DepartmentDetailPage() {
  const { deptId } = useParams<{ deptId?: string }>()
  const navigate = useNavigate()

  const { data: departments, isLoading, error } = useQuery<DepartmentSummary[]>({
    queryKey: ['departments'],
    queryFn: getDepartments,
    enabled: !deptId,
  })

  if (deptId) {
    return <DeptDetailView deptId={deptId} />
  }

  if (isLoading) return <Spinner />
  if (error) return <ErrorMsg message={String(error)} />

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Departments</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {departments?.length ?? 0} departments · click a card for full detail
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {(departments ?? []).map(dept => (
          <DeptCard
            key={dept.dept_id}
            dept={dept}
            onClick={() => navigate(`/departments/${dept.dept_id}`)}
          />
        ))}
      </div>
    </div>
  )
}

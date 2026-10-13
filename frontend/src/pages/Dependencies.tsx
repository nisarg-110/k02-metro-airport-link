import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getTasks, getComponents } from '../api'
import { TaskSummary, Component } from '../types'
import StatusBadge from '../components/StatusBadge'
import { ArrowRight, AlertTriangle } from 'lucide-react'

function Spinner() {
  return (
    <div className="flex items-center justify-center h-48">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
    </div>
  )
}

function ErrorMsg({ message }: { message: string }) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-600">
      {message}
    </div>
  )
}

// Critical chain: CVL-04 → TRP-04 → TRP-05 → RST-04 → OCC-05 → OPS-04
const CRITICAL_CHAIN = ['CVL-04', 'TRP-04', 'TRP-05', 'RST-04', 'OCC-05', 'OPS-04']

function TaskDepsTab({ tasks }: { tasks: TaskSummary[] }) {
  const taskMap = Object.fromEntries(tasks.map(t => [t.task_id, t]))
  const criticalTasks = CRITICAL_CHAIN.map(id => taskMap[id]).filter(Boolean)

  return (
    <div className="space-y-6">
      {/* Critical chain highlight */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">
          Critical Chain — Tranche Release Path
        </h3>
        <p className="text-xs text-gray-500 mb-4">
          This finish-to-start chain gates M4/M6 milestones and thus T3/T4 tranche releases.
          A slip in any task delays all successors.
        </p>
        <div className="flex flex-wrap items-center gap-2">
          {criticalTasks.map((t, i) => (
            <div key={t.task_id} className="flex items-center gap-2">
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-center min-w-24">
                <p className="text-xs font-mono font-bold text-gray-600">{t.task_id}</p>
                <p className="text-xs text-gray-500 mt-0.5 max-w-28 truncate" title={t.task_name}>
                  {t.task_name}
                </p>
                <div className="mt-1.5">
                  <StatusBadge status={t.status} small />
                </div>
              </div>
              {i < criticalTasks.length - 1 && (
                <ArrowRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Full task list with status */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700">All Tasks by Department</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-gray-500 uppercase font-medium">Task ID</th>
                <th className="px-4 py-2 text-left text-gray-500 uppercase font-medium">Name</th>
                <th className="px-4 py-2 text-left text-gray-500 uppercase font-medium">Dept</th>
                <th className="px-4 py-2 text-left text-gray-500 uppercase font-medium">Status</th>
                <th className="px-4 py-2 text-left text-gray-500 uppercase font-medium">Planned Start</th>
                <th className="px-4 py-2 text-left text-gray-500 uppercase font-medium">Planned End</th>
                <th className="px-4 py-2 text-left text-gray-500 uppercase font-medium">Actual End</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {tasks
                .sort((a, b) => a.task_id.localeCompare(b.task_id))
                .map(t => (
                <tr
                  key={t.task_id}
                  className={`hover:bg-gray-50 ${CRITICAL_CHAIN.includes(t.task_id) ? 'bg-amber-50' : ''}`}
                >
                  <td className="px-4 py-2.5 font-mono font-medium text-gray-700">
                    {t.task_id}
                    {CRITICAL_CHAIN.includes(t.task_id) && (
                      <span className="ml-1 text-amber-500" title="Critical chain">★</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-gray-600 max-w-xs truncate" title={t.task_name}>
                    {t.task_name}
                  </td>
                  <td className="px-4 py-2.5 text-gray-500">{t.dept_id}</td>
                  <td className="px-4 py-2.5">
                    <StatusBadge status={t.status} small />
                  </td>
                  <td className="px-4 py-2.5 text-gray-400">{t.planned_start ?? '—'}</td>
                  <td className="px-4 py-2.5 text-gray-400">{t.planned_end ?? '—'}</td>
                  <td className="px-4 py-2.5 text-gray-400">{t.actual_end ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function ComponentDepsTab({ components }: { components: Component[] }) {
  const [search, setSearch] = useState('')

  // We need component dependencies — fetch from API
  const { data: compDeps = [], isLoading, error } = useQuery<Array<{
    component_id: string
    depends_on_component_id: string
    dependency_type: string
  }>>({
    queryKey: ['component-deps'],
    queryFn: async () => {
      const res = await fetch('/api/components')
      return res.json()
    },
  })

  const compMap = Object.fromEntries(components.map(c => [c.component_id, c]))

  // Build dependency rows from the components data
  // For each component, find its parent and status
  const installedStatuses = new Set(['installed', 'tested'])

  // Filter: show components that have anomalous dependency state
  const filtered = components.filter(c => {
    if (search) {
      const q = search.toLowerCase()
      return c.component_id.toLowerCase().includes(q) || c.component_name.toLowerCase().includes(q)
    }
    return true
  })

  return (
    <div className="space-y-4">
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <div className="flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-amber-800">
            <strong>Rule 5 applies:</strong> A component can only be installed when every component it depends on
            (power, physical_space, signalling, ventilation, control_software) is already installed.
            Violations are flagged in the Anomalies page.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-4">
          <h3 className="text-sm font-semibold text-gray-700">Component Status Overview</h3>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search components…"
            className="ml-auto px-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400 w-48"
          />
        </div>
        <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
          <table className="w-full text-xs">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="px-4 py-2 text-left text-gray-500 uppercase font-medium">ID</th>
                <th className="px-4 py-2 text-left text-gray-500 uppercase font-medium">Name</th>
                <th className="px-4 py-2 text-left text-gray-500 uppercase font-medium">Type</th>
                <th className="px-4 py-2 text-left text-gray-500 uppercase font-medium">Dept</th>
                <th className="px-4 py-2 text-left text-gray-500 uppercase font-medium">Status</th>
                <th className="px-4 py-2 text-right text-gray-500 uppercase font-medium">Cost (unit)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(c => (
                <tr key={c.component_id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 font-mono text-gray-600">{c.component_id}</td>
                  <td className="px-4 py-2 text-gray-700 max-w-xs truncate" title={c.component_name}>
                    {c.component_name}
                  </td>
                  <td className="px-4 py-2 text-gray-500 capitalize">{c.component_type}</td>
                  <td className="px-4 py-2 text-gray-500">{c.owner_dept_id ?? '—'}</td>
                  <td className="px-4 py-2">
                    <StatusBadge status={c.status} small />
                  </td>
                  <td className="px-4 py-2 text-right text-gray-500">
                    {c.unit_cost_inr > 0 ? `₹${c.unit_cost_inr.toLocaleString('en-IN')}` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default function DependenciesPage() {
  const [tab, setTab] = useState<'tasks' | 'components'>('tasks')

  const { data: tasks = [], isLoading: tasksLoading, error: tasksError } = useQuery<TaskSummary[]>({
    queryKey: ['tasks'],
    queryFn: getTasks,
    enabled: tab === 'tasks',
  })

  const { data: components = [], isLoading: compsLoading, error: compsError } = useQuery<Component[]>({
    queryKey: ['components'],
    queryFn: getComponents,
    enabled: tab === 'components',
  })

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dependencies</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Task finish-to-start chains and component installation prerequisites
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-1">
          {([
            { key: 'tasks', label: 'Task Dependencies' },
            { key: 'components', label: 'Component Dependencies' },
          ] as const).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                tab === key
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {label}
            </button>
          ))}
        </nav>
      </div>

      {tab === 'tasks' && (
        <>
          {tasksLoading && <Spinner />}
          {tasksError && <ErrorMsg message={String(tasksError)} />}
          {!tasksLoading && <TaskDepsTab tasks={tasks} />}
        </>
      )}

      {tab === 'components' && (
        <>
          {compsLoading && <Spinner />}
          {compsError && <ErrorMsg message={String(compsError)} />}
          {!compsLoading && <ComponentDepsTab components={components} />}
        </>
      )}
    </div>
  )
}

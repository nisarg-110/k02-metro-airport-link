import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getPeople } from '../api'
import { PersonRow } from '../types'
import StatusBadge from '../components/StatusBadge'

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

export default function PeoplePage() {
  const [deptFilter, setDeptFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [search, setSearch] = useState('')

  const { data: people = [], isLoading, error } = useQuery<PersonRow[]>({
    queryKey: ['people'],
    queryFn: getPeople,
  })

  const counts = useMemo(() => ({
    total: people.length,
    active: people.filter(p => p.status === 'active').length,
    on_leave: people.filter(p => p.status === 'on_leave').length,
    exited: people.filter(p => p.status === 'exited').length,
  }), [people])

  const departments = useMemo(() => {
    const depts = Array.from(new Set(people.map(p => p.dept_id))).sort()
    return depts
  }, [people])

  const filtered = useMemo(() => {
    return people.filter(p => {
      if (deptFilter !== 'all' && p.dept_id !== deptFilter) return false
      if (statusFilter !== 'all' && p.status !== statusFilter) return false
      if (search) {
        const q = search.toLowerCase()
        return (
          p.full_name.toLowerCase().includes(q) ||
          p.role.toLowerCase().includes(q) ||
          p.email.toLowerCase().includes(q) ||
          p.researcher_id.toLowerCase().includes(q)
        )
      }
      return true
    })
  }, [people, deptFilter, statusFilter, search])

  if (isLoading) return <Spinner />
  if (error) return <ErrorMsg message={String(error)} />

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">People</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Staff directory — {counts.total} researchers
        </p>
      </div>

      {/* Status summary */}
      <div className="flex gap-4">
        <div className="bg-white rounded-lg border border-gray-100 shadow-sm px-4 py-3 text-center">
          <p className="text-xl font-bold text-gray-900">{counts.total}</p>
          <p className="text-xs text-gray-500">Total</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-100 shadow-sm px-4 py-3 text-center">
          <p className="text-xl font-bold text-blue-600">{counts.active}</p>
          <p className="text-xs text-gray-500">Active</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-100 shadow-sm px-4 py-3 text-center">
          <p className="text-xl font-bold text-yellow-600">{counts.on_leave}</p>
          <p className="text-xs text-gray-500">On Leave</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-100 shadow-sm px-4 py-3 text-center">
          <p className="text-xl font-bold text-red-600">{counts.exited}</p>
          <p className="text-xs text-gray-500">Exited</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        {/* Search */}
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search name, role, email…"
          className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400 w-56"
        />

        {/* Dept filter */}
        <div className="flex gap-1 flex-wrap">
          <button
            onClick={() => setDeptFilter('all')}
            className={`px-3 py-1.5 text-xs rounded-full font-medium transition-colors ${
              deptFilter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            All Depts
          </button>
          {departments.map(d => (
            <button
              key={d}
              onClick={() => setDeptFilter(d)}
              className={`px-3 py-1.5 text-xs rounded-full font-medium transition-colors ${
                deptFilter === d
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {d}
            </button>
          ))}
        </div>

        {/* Status filter */}
        <div className="flex gap-1 ml-auto">
          {['all', 'active', 'on_leave', 'exited'].map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 text-xs rounded-full font-medium capitalize transition-colors ${
                statusFilter === s
                  ? 'bg-gray-700 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {s.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      <p className="text-xs text-gray-400">{filtered.length} of {people.length} showing</p>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">Dept</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                <th className="px-4 py-2.5 text-center text-xs font-medium text-gray-500 uppercase">Allocation</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">Left On</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(p => (
                <tr
                  key={p.researcher_id}
                  className={`hover:bg-gray-50 ${p.status === 'exited' ? 'opacity-60' : ''}`}
                >
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{p.full_name}</p>
                    <p className="text-xs text-gray-400 font-mono">{p.researcher_id}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-medium text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
                      {p.dept_id}
                    </span>
                    <p className="text-xs text-gray-400 mt-0.5">{p.dept_name}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-sm">{p.role}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`font-medium ${p.project_allocation_pct >= 80 ? 'text-blue-700' : 'text-gray-600'}`}>
                      {p.project_allocation_pct}%
                    </span>
                    <p className="text-xs text-gray-400">
                      {Math.round(40 * p.project_allocation_pct / 100)} h/wk
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={p.status} small />
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">{p.email}</td>
                  <td className="px-4 py-3 text-xs text-gray-400">{p.left_on ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

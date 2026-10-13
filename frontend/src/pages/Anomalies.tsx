import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getAnomalies } from '../api'
import { AnomalyItem } from '../types'
import { AlertTriangle, AlertCircle, Info, ChevronDown, ChevronUp } from 'lucide-react'

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

const severityConfig = {
  high: {
    Icon: AlertTriangle,
    bg: 'bg-red-50',
    border: 'border-red-200',
    iconColor: 'text-red-500',
    badge: 'bg-red-100 text-red-700',
    headerBg: 'bg-red-100',
    label: 'High',
  },
  medium: {
    Icon: AlertCircle,
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    iconColor: 'text-orange-500',
    badge: 'bg-orange-100 text-orange-700',
    headerBg: 'bg-orange-100',
    label: 'Medium',
  },
  low: {
    Icon: Info,
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    iconColor: 'text-yellow-600',
    badge: 'bg-yellow-100 text-yellow-700',
    headerBg: 'bg-yellow-100',
    label: 'Low',
  },
}

function AnomalyRow({ anomaly, expanded, onToggle }: {
  anomaly: AnomalyItem
  expanded: boolean
  onToggle: () => void
}) {
  const cfg = severityConfig[anomaly.severity] ?? severityConfig.low
  const { Icon } = cfg

  return (
    <div className={`rounded-lg border ${cfg.bg} ${cfg.border} overflow-hidden`}>
      <button
        className="w-full text-left px-4 py-3 flex items-start gap-3"
        onClick={onToggle}
      >
        <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${cfg.iconColor}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${cfg.badge}`}>
              {anomaly.rule_id}
            </span>
            <span className="text-xs text-gray-500">{anomaly.entity_type}: {anomaly.entity_id}</span>
            <span className="text-xs text-gray-400 ml-auto hidden sm:block">{anomaly.anomaly_id}</span>
          </div>
          <p className="text-sm text-gray-800 mt-1 leading-snug">{anomaly.description}</p>
        </div>
        <div className="flex-shrink-0 text-gray-400">
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>
      {expanded && (
        <div className="px-4 pb-3 border-t border-gray-200 pt-2 ml-7">
          <p className="text-xs text-gray-600">{anomaly.detail}</p>
        </div>
      )}
    </div>
  )
}

function RuleExplanation({ ruleId }: { ruleId: string }) {
  const explanations: Record<string, string> = {
    RULE1: 'A department may spend only from allocations whose tranche has been released.',
    RULE2a: 'Equipment or civil works above ₹5,00,000 must go through a purchase order.',
    RULE2b: 'Total payments on a PO must not exceed the PO value.',
    RULE3a: 'The requester and the approver of an expense must be different people.',
    RULE3b: 'People who have exited the project cannot approve expenses.',
    RULE3c: 'Expenses cannot be approved by someone who had already left the project.',
    RULE3d: 'Exited researchers should not be logging hours after their departure date.',
    RULE4: 'Task dependencies are finish-to-start: a task cannot start before its predecessors finish.',
    RULE5: 'A component can be installed only when every component it depends on is installed.',
    RULE6: '100% allocation = 40 hours per week. Logged hours should not exceed the allowed allocation.',
    RULE7: 'Milestone status is self-reported — cross-checked against linked task completion.',
    RULE_BUDGET: 'Department total expenditure should not exceed its total budget.',
  }
  return (
    <span className="text-xs text-gray-500 italic">{explanations[ruleId] ?? ''}</span>
  )
}

export default function AnomaliesPage() {
  const [severityFilter, setSeverityFilter] = useState<string>('all')
  const [ruleFilter, setRuleFilter] = useState<string>('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const { data: anomalies = [], isLoading, error } = useQuery<AnomalyItem[]>({
    queryKey: ['anomalies'],
    queryFn: getAnomalies,
  })

  const rules = useMemo(() => Array.from(new Set(anomalies.map(a => a.rule_id))).sort(), [anomalies])

  const filtered = useMemo(() => {
    return anomalies.filter(a => {
      if (severityFilter !== 'all' && a.severity !== severityFilter) return false
      if (ruleFilter !== 'all' && a.rule_id !== ruleFilter) return false
      return true
    }).sort((a, b) => {
      const ord = { high: 0, medium: 1, low: 2 }
      return (ord[a.severity] ?? 3) - (ord[b.severity] ?? 3)
    })
  }, [anomalies, severityFilter, ruleFilter])

  const counts = useMemo(() => ({
    high: anomalies.filter(a => a.severity === 'high').length,
    medium: anomalies.filter(a => a.severity === 'medium').length,
    low: anomalies.filter(a => a.severity === 'low').length,
  }), [anomalies])

  if (isLoading) return <Spinner />
  if (error) return <ErrorMsg message={String(error)} />

  // Group by rule
  const byRule = filtered.reduce<Record<string, AnomalyItem[]>>((acc, a) => {
    if (!acc[a.rule_id]) acc[a.rule_id] = []
    acc[a.rule_id].push(a)
    return acc
  }, {})

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Anomalies</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Data quality issues detected against project rules
        </p>
      </div>

      {/* Severity summary */}
      <div className="flex gap-4">
        <div className="bg-red-50 border border-red-200 rounded-lg px-5 py-3 text-center">
          <p className="text-2xl font-bold text-red-700">{counts.high}</p>
          <p className="text-xs text-red-500 font-medium">High</p>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-lg px-5 py-3 text-center">
          <p className="text-2xl font-bold text-orange-700">{counts.medium}</p>
          <p className="text-xs text-orange-500 font-medium">Medium</p>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-5 py-3 text-center">
          <p className="text-2xl font-bold text-yellow-700">{counts.low}</p>
          <p className="text-xs text-yellow-500 font-medium">Low</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg px-5 py-3 text-center">
          <p className="text-2xl font-bold text-gray-700">{anomalies.length}</p>
          <p className="text-xs text-gray-500 font-medium">Total</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        {/* Severity */}
        <div className="flex gap-1">
          {['all', 'high', 'medium', 'low'].map(s => (
            <button
              key={s}
              onClick={() => setSeverityFilter(s)}
              className={`px-3 py-1.5 text-xs rounded-full font-medium capitalize transition-colors ${
                severityFilter === s
                  ? 'bg-gray-800 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Rule filter */}
        <select
          value={ruleFilter}
          onChange={e => setRuleFilter(e.target.value)}
          className="px-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400"
        >
          <option value="all">All rules</option>
          {rules.map(r => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>

        <span className="text-xs text-gray-400 self-center ml-auto">
          {filtered.length} of {anomalies.length} showing
        </span>
      </div>

      {/* Grouped by rule */}
      <div className="space-y-6">
        {Object.entries(byRule).map(([ruleId, items]) => {
          const firstSeverity = items[0]?.severity ?? 'low'
          const cfg = severityConfig[firstSeverity] ?? severityConfig.low
          return (
            <div key={ruleId}>
              <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${cfg.headerBg} mb-2`}>
                <span className={`text-xs font-bold px-2 py-0.5 rounded ${cfg.badge}`}>{ruleId}</span>
                <span className="text-xs font-medium text-gray-700">{items.length} issue{items.length > 1 ? 's' : ''}</span>
                <div className="ml-2">
                  <RuleExplanation ruleId={ruleId} />
                </div>
              </div>
              <div className="space-y-2">
                {items.map(a => (
                  <AnomalyRow
                    key={a.anomaly_id}
                    anomaly={a}
                    expanded={expandedId === a.anomaly_id}
                    onToggle={() => setExpandedId(expandedId === a.anomaly_id ? null : a.anomaly_id)}
                  />
                ))}
              </div>
            </div>
          )
        })}
        {filtered.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <p className="text-lg font-medium">No anomalies match your filters</p>
          </div>
        )}
      </div>
    </div>
  )
}

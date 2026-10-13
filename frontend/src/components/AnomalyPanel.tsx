import { AlertTriangle, AlertCircle, Info } from 'lucide-react'
import { AnomalyItem } from '../types'

interface Props {
  anomalies: AnomalyItem[]
  limit?: number
}

const severityConfig = {
  high: {
    icon: AlertTriangle,
    bg: 'bg-red-50',
    border: 'border-red-200',
    iconColor: 'text-red-500',
    badge: 'bg-red-100 text-red-700',
    label: 'High',
  },
  medium: {
    icon: AlertCircle,
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    iconColor: 'text-orange-500',
    badge: 'bg-orange-100 text-orange-700',
    label: 'Medium',
  },
  low: {
    icon: Info,
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    iconColor: 'text-yellow-600',
    badge: 'bg-yellow-100 text-yellow-700',
    label: 'Low',
  },
}

export default function AnomalyPanel({ anomalies, limit }: Props) {
  const shown = limit ? anomalies.slice(0, limit) : anomalies

  const counts = {
    high: anomalies.filter(a => a.severity === 'high').length,
    medium: anomalies.filter(a => a.severity === 'medium').length,
    low: anomalies.filter(a => a.severity === 'low').length,
  }

  return (
    <div>
      {/* Summary badges */}
      <div className="flex gap-2 mb-3">
        {counts.high > 0 && (
          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
            {counts.high} High
          </span>
        )}
        {counts.medium > 0 && (
          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
            {counts.medium} Medium
          </span>
        )}
        {counts.low > 0 && (
          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
            {counts.low} Low
          </span>
        )}
      </div>

      {/* Anomaly list */}
      <div className="space-y-2">
        {shown.map(anomaly => {
          const cfg = severityConfig[anomaly.severity] ?? severityConfig.low
          const Icon = cfg.icon
          return (
            <div
              key={anomaly.anomaly_id}
              className={`p-3 rounded-lg border ${cfg.bg} ${cfg.border}`}
            >
              <div className="flex items-start gap-2">
                <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${cfg.iconColor}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className={`text-xs font-semibold rounded px-1.5 py-0.5 ${cfg.badge}`}>
                      {anomaly.rule_id}
                    </span>
                    <span className="text-xs text-gray-500 truncate">{anomaly.entity_id}</span>
                  </div>
                  <p className="text-xs text-gray-700 leading-snug">{anomaly.description}</p>
                </div>
              </div>
            </div>
          )
        })}
        {limit && anomalies.length > limit && (
          <p className="text-xs text-gray-400 text-center pt-1">
            + {anomalies.length - limit} more anomalies
          </p>
        )}
      </div>
    </div>
  )
}

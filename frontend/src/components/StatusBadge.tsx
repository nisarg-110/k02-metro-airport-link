interface Props {
  status: string
  small?: boolean
}

const colorMap: Record<string, string> = {
  completed: 'bg-green-100 text-green-800',
  achieved: 'bg-green-100 text-green-800',
  released: 'bg-green-100 text-green-800',
  in_progress: 'bg-blue-100 text-blue-800',
  on_track: 'bg-blue-100 text-blue-800',
  active: 'bg-blue-100 text-blue-800',
  delivered: 'bg-blue-100 text-blue-800',
  installed: 'bg-blue-100 text-blue-800',
  tested: 'bg-green-100 text-green-800',
  not_started: 'bg-gray-100 text-gray-600',
  planned: 'bg-gray-100 text-gray-600',
  pending: 'bg-gray-100 text-gray-600',
  ordered: 'bg-purple-100 text-purple-800',
  at_risk: 'bg-red-100 text-red-800',
  high: 'bg-red-100 text-red-800',
  medium: 'bg-orange-100 text-orange-800',
  low: 'bg-yellow-100 text-yellow-800',
  on_leave: 'bg-yellow-100 text-yellow-800',
  exited: 'bg-red-100 text-red-800',
  closed: 'bg-gray-100 text-gray-600',
}

export default function StatusBadge({ status, small = false }: Props) {
  const normalized = status?.toLowerCase().replace(/ /g, '_') ?? ''
  const color = colorMap[normalized] ?? 'bg-gray-100 text-gray-600'
  const label = status?.replace(/_/g, ' ') ?? ''

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium capitalize ${color} ${
        small ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-0.5 text-xs'
      }`}
    >
      {label}
    </span>
  )
}

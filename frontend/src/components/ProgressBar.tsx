interface Props {
  value: number        // 0–100
  color?: string       // tailwind bg color class
  showLabel?: boolean
  height?: string      // tailwind h- class
}

export default function ProgressBar({
  value,
  color = 'bg-blue-500',
  showLabel = false,
  height = 'h-2',
}: Props) {
  const clamped = Math.min(100, Math.max(0, value))

  return (
    <div className="flex items-center gap-2">
      <div className={`flex-1 bg-gray-200 rounded-full overflow-hidden ${height}`}>
        <div
          className={`${color} ${height} rounded-full transition-all duration-300`}
          style={{ width: `${clamped}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-xs text-gray-500 w-8 text-right">{clamped}%</span>
      )}
    </div>
  )
}

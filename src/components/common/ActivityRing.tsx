// Apple Watch 활동 링에서 가져온 시그니처 요소.
// 진행률(0~1)을 링으로 그리고 중앙에 값을 표시한다.

interface ActivityRingProps {
  progress: number // 0 ~ 1 (1 초과분은 링이 가득 찬 상태로 표시)
  color: string
  size?: number
  strokeWidth?: number
  children?: React.ReactNode
}

export default function ActivityRing({
  progress,
  color,
  size = 120,
  strokeWidth = 10,
  children,
}: ActivityRingProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const clamped = Math.min(Math.max(progress, 0), 1)
  const offset = circumference * (1 - clamped)

  return (
    <div className="ring" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--track)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="ring-progress"
        />
      </svg>
      <div className="ring-center">{children}</div>
    </div>
  )
}

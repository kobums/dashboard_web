import { useEffect, useRef } from 'react'

// 범용 잔디 히트맵 — 개발(커밋)·독서(분) 공용.
// 색은 단일 hue sequential ramp(CSS 변수), 초기 스크롤은 최근(오른쪽 끝),
// 요일 라벨·범례는 스크롤 밖 고정, 1월 라벨 자리는 연도.

export interface HeatDay {
  date: string
  total: number
  tooltip: string
}

const CELL = 12
const GAP = 3
const RADIUS = 2
const LEVELS = ['var(--heat-0)', 'var(--heat-1)', 'var(--heat-2)', 'var(--heat-3)', 'var(--heat-4)']

const DOW_LABELS = ['', '월', '', '수', '', '금', '']
const MONTHS = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월']

export default function Heatmap({
  days,
  thresholds = [2, 5, 9], // total ≤ t1 → 레벨1, ≤ t2 → 2, ≤ t3 → 3, 초과 → 4
}: {
  days: HeatDay[]
  thresholds?: [number, number, number]
}) {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollLeft = el.scrollWidth
  }, [days])

  if (days.length === 0) return null

  function level(total: number): number {
    if (total <= 0) return 0
    if (total <= thresholds[0]) return 1
    if (total <= thresholds[1]) return 2
    if (total <= thresholds[2]) return 3
    return 4
  }

  const first = new Date(days[0].date + 'T00:00:00')
  const startDow = first.getDay()
  const totalCols = Math.ceil((days.length + startDow) / 7)

  const labelWidth = 28
  const topPad = 18
  const gridWidth = totalCols * (CELL + GAP)
  const height = topPad + 7 * (CELL + GAP)

  const monthLabels: { col: number; label: string }[] = []
  let lastMonth = -1
  for (let i = 0; i < days.length; i++) {
    const col = Math.floor((i + startDow) / 7)
    const d = new Date(days[i].date + 'T00:00:00')
    if (d.getMonth() !== lastMonth && d.getDate() <= 7) {
      const label = d.getMonth() === 0 ? String(d.getFullYear()) : MONTHS[d.getMonth()]
      monthLabels.push({ col, label })
      lastMonth = d.getMonth()
    }
  }

  return (
    <div className="heatmap-wrap">
      <div className="heatmap-body">
        <svg width={labelWidth} height={height} aria-hidden="true">
          {DOW_LABELS.map((label, row) =>
            label ? (
              <text key={row} x={0} y={topPad + row * (CELL + GAP) + CELL - 1} fontSize={11} fill="var(--ink-48)">
                {label}
              </text>
            ) : null,
          )}
        </svg>
        <div className="heatmap-scroll" ref={scrollRef}>
          <svg width={gridWidth} height={height} role="img" aria-label="히트맵">
            {monthLabels.map((m) => (
              <text key={`${m.col}-${m.label}`} x={m.col * (CELL + GAP)} y={12} fontSize={11} fill="var(--ink-48)">
                {m.label}
              </text>
            ))}
            {days.map((day, i) => {
              const col = Math.floor((i + startDow) / 7)
              const row = (i + startDow) % 7
              return (
                <rect
                  key={day.date}
                  x={col * (CELL + GAP)}
                  y={topPad + row * (CELL + GAP)}
                  width={CELL}
                  height={CELL}
                  rx={RADIUS}
                  fill={LEVELS[level(day.total)]}
                >
                  <title>{day.tooltip}</title>
                </rect>
              )
            })}
          </svg>
        </div>
      </div>
      <div className="heatmap-legend">
        <span>적음</span>
        {LEVELS.map((c) => (
          <span key={c} className="heatmap-legend-cell" style={{ background: c }} />
        ))}
        <span>많음</span>
      </div>
    </div>
  )
}

import { useEffect, useRef } from 'react'
import type { CalendarDay } from '../../types'

// GitHub 잔디 스타일 히트맵 — 커스텀 SVG.
// 색은 Action Blue 단일 hue의 sequential ramp (빈 날은 중립 회색).
// github+gitlab 합계로 농도를 정하고, 툴팁에 소스별 분리 표시.

const CELL = 12
const GAP = 3
const RADIUS = 2

// sequential ramp: 밝기 단조 감소 (0 = 빈 셀)
const LEVELS = ['#ebedf0', '#cfe0f5', '#93bce9', '#4a90d9', '#0066cc']

function level(total: number): number {
  if (total <= 0) return 0
  if (total <= 2) return 1
  if (total <= 5) return 2
  if (total <= 9) return 3
  return 4
}

const DOW_LABELS = ['', '월', '', '수', '', '금', '']
const MONTHS = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월']

export default function ContributionHeatmap({ calendar }: { calendar: CalendarDay[] }) {
  const scrollRef = useRef<HTMLDivElement>(null)

  // 최근(오른쪽 끝)이 먼저 보이도록 초기 스크롤을 끝으로 — 과거는 왼쪽으로 스크롤
  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollLeft = el.scrollWidth
  }, [calendar])

  if (calendar.length === 0) return null

  const first = new Date(calendar[0].date + 'T00:00:00')
  const startDow = first.getDay() // 0=일
  const totalCols = Math.ceil((calendar.length + startDow) / 7)

  const labelWidth = 28 // 요일 라벨 열 (스크롤 밖 고정)
  const topPad = 18 // 월 라벨 행
  const gridWidth = totalCols * (CELL + GAP)
  const height = topPad + 7 * (CELL + GAP)

  // 월 라벨: 각 열의 첫 셀 날짜가 새 달의 1~7일이면 라벨.
  // 다년 캘린더에서 연도를 알 수 있게 1월은 연도("2025")로 표시한다.
  const monthLabels: { col: number; label: string }[] = []
  let lastMonth = -1
  for (let i = 0; i < calendar.length; i++) {
    const col = Math.floor((i + startDow) / 7)
    const d = new Date(calendar[i].date + 'T00:00:00')
    if (d.getMonth() !== lastMonth && d.getDate() <= 7) {
      const label = d.getMonth() === 0 ? String(d.getFullYear()) : MONTHS[d.getMonth()]
      monthLabels.push({ col, label })
      lastMonth = d.getMonth()
    }
  }

  return (
    <div className="heatmap-wrap">
      <div className="heatmap-body">
        {/* 요일 라벨 — 스크롤 밖 고정 열 */}
        <svg width={labelWidth} height={height} aria-hidden="true">
          {DOW_LABELS.map((label, row) =>
            label ? (
              <text
                key={row}
                x={0}
                y={topPad + row * (CELL + GAP) + CELL - 1}
                fontSize={11}
                fill="#7a7a7a"
              >
                {label}
              </text>
            ) : null,
          )}
        </svg>
        {/* 그리드 — 여기만 가로 스크롤 */}
        <div className="heatmap-scroll" ref={scrollRef}>
          <svg width={gridWidth} height={height} role="img" aria-label="컨트리뷰션 히트맵">
            {monthLabels.map((m) => (
              <text
                key={`${m.col}-${m.label}`}
                x={m.col * (CELL + GAP)}
                y={12}
                fontSize={11}
                fill="#7a7a7a"
              >
                {m.label}
              </text>
            ))}
            {calendar.map((day, i) => {
              const col = Math.floor((i + startDow) / 7)
              const row = (i + startDow) % 7
              const parts = [`${day.date}`]
              if (day.github) parts.push(`GitHub ${day.github}`)
              if (day.gitlab) parts.push(`GitLab ${day.gitlab}`)
              if (!day.github && !day.gitlab) parts.push('활동 없음')
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
                  <title>{parts.join(' · ')}</title>
                </rect>
              )
            })}
          </svg>
        </div>
      </div>
      {/* 범례 — 스크롤 밖 고정 */}
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

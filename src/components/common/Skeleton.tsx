// 스켈레톤 조각 — 로딩 중 최종 레이아웃과 같은 자리를 잡아 레이아웃 시프트를 막는다.
// 스타일은 index.css 의 .sk 계열 (DESIGN 그라디언트 금지 → opacity 펄스).

export function SkLine({
  width,
  height,
  large = false,
  style,
}: {
  width: number | string
  height?: number
  large?: boolean
  style?: React.CSSProperties
}) {
  return (
    <div
      className={`sk sk-line${large ? ' lg' : ''}`}
      style={{ width, ...(height ? { height } : {}), ...style }}
    />
  )
}

// 홈 요약 카드용 — ActivityRing(96px) + 스탯 2개 자리
export function SkRingRow() {
  return (
    <div className="card-row">
      <div className="sk sk-ring" />
      <div className="stat-grid">
        {[0, 1].map((i) => (
          <div key={i}>
            <SkLine width={52} large />
            <SkLine width={68} style={{ marginTop: 8 }} />
          </div>
        ))}
      </div>
    </div>
  )
}

// 목록 카드용 — 폭이 조금씩 다른 텍스트 줄 여러 개
export function SkLines({ rows = 4 }: { rows?: number }) {
  const widths = ['82%', '64%', '74%', '58%', '70%', '66%']
  return (
    <div className="stack" style={{ gap: 14, marginTop: 14 }}>
      {Array.from({ length: rows }, (_, i) => (
        <SkLine key={i} width={widths[i % widths.length]} />
      ))}
    </div>
  )
}

// 차트·히트맵 등 큰 영역용
export function SkBlock({ height }: { height: number }) {
  return <div className="sk" style={{ height, marginTop: 14 }} />
}

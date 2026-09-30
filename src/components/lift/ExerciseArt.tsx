import type { CSSProperties } from 'react'
import { artFrame, exerciseArt } from '../../lib/exerciseArt'

// 종목 동작 그림. 선화 SVG 를 mask 로 써서 --ink 로 칠한다(라이트/다크 자동).
// animate: 시작↔끝 자세를 번갈아 보여 GIF 처럼 움직임 (reduced-motion 이면 끝 자세 고정).
// 그림 없는 종목은 아무것도 그리지 않는다 — 썸네일 자리를 맞춰야 하면 placeholder.

export default function ExerciseArt({
  name,
  size = 'md',
  animate = false,
  placeholder = false,
}: {
  name: string
  size?: 'sm' | 'md' | 'lg'
  animate?: boolean
  placeholder?: boolean
}) {
  const art = exerciseArt(name)
  if (!art) {
    return placeholder ? <span className={`ex-art ex-art-${size} ex-art-empty`} aria-hidden="true" /> : null
  }
  const frame = (n: 1 | 2): CSSProperties => {
    const url = `url(${artFrame(art.slug, n)})`
    return { WebkitMaskImage: url, maskImage: url }
  }
  return (
    <span className={`ex-art ex-art-${size}${animate ? ' ex-art-animate' : ''}`} role="img" aria-label={`${name} 동작 그림`}>
      {animate && <span className="ex-art-frame ex-art-start" style={frame(1)} />}
      <span className="ex-art-frame ex-art-end" style={frame(2)} />
    </span>
  )
}

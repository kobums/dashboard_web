// 버튼 안 아이콘 — 글자 기호(‹ › ✕ + −)는 글꼴마다 기준선·여백이 달라 원형 버튼 가운데에 오지 않아서 SVG 로 그린다.
// 크기 = 부모 font-size(1em), 색 = currentColor. 버튼은 display:flex + center 로 가운데 정렬.

const PATHS = {
  'chevron-left': 'M15.5 5l-7 7 7 7',
  'chevron-right': 'M8.5 5l7 7-7 7',
  close: 'M6 6l12 12M18 6L6 18',
  plus: 'M12 5v14M5 12h14',
  minus: 'M5 12h14',
} as const

export type IconName = keyof typeof PATHS

export default function Icon({ name }: { name: IconName }) {
  return (
    <svg className="icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d={PATHS[name]} />
    </svg>
  )
}

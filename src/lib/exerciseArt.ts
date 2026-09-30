// 종목 → 동작 그림 (Everkinetic 선화, CC BY-SA 4.0 — public/exercises/CREDITS.md).
// 파일: /exercises/{slug}-1.svg(시작 자세) · -2.svg(끝 자세). 흰 배경을 뺀 선만 있어 CSS mask 로 테마 잉크색을 칠한다.
// exact=false 는 토러·해머 머신 등 같은 움직임의 일반 동작 그림(참고용) — 상세에서 "참고 동작"으로 표기.
// 그림이 없는 종목(벨트 스쿼트·하이 로우·유산소·풋살)은 undefined.

export type ExerciseArt = { slug: string; title: string; exact: boolean }

const ART: Record<string, ExerciseArt> = {
  벤치프레스: { slug: 'bench-press', title: 'Bench Press', exact: true },
  '인클라인 벤치프레스 (토러)': { slug: 'incline-bench-press', title: 'Incline Bench Press', exact: false },
  '체스트 프레스 (토러)': { slug: 'machine-bench-press', title: 'Machine Bench Press', exact: false },
  '시티드 딥': { slug: 'chest-dips', title: 'Chest Dips', exact: false },
  '스미스 푸쉬업': { slug: 'push-ups', title: 'Push Ups', exact: false },
  '와이드 체스트 프레스 (해머)': { slug: 'machine-bench-press', title: 'Machine Bench Press', exact: false },
  '디클라인 프레스 (해머)': { slug: 'decline-chest-press', title: 'Decline Chest Press', exact: true },
  '루마니안 데드리프트': { slug: 'romanian-dead-lift', title: 'Romanian Deadlift', exact: true },
  '레터럴 로우 (토러)': { slug: 'seated-cable-rows', title: 'Seated Cable Rows', exact: false },
  '프론트 랫풀다운 (해머)': { slug: 'v-bar-pull-down', title: 'V-Bar Pull Down', exact: false },
  '시티드 로우': { slug: 'seated-cable-rows', title: 'Seated Cable Rows', exact: true },
  '로우 로우 (해머)': { slug: 'seated-cable-rows', title: 'Seated Cable Rows', exact: false },
  '로우 로우 (토러)': { slug: 'rear-deltoid-row-dumbbell', title: 'One-Arm Dumbbell Row', exact: false },
  'D·Y 로우': { slug: 't-bar-rows', title: 'T-Bar Rows', exact: false },
  '와이드 풀다운 (토러)': { slug: 'underhand-pull-downs', title: 'Lat Pull Down', exact: false },
  '덤벨 레이즈 3종': { slug: 'lateral-dumbbell-raises', title: 'Lateral Dumbbell Raises', exact: false },
  '숄더 프레스 (스미스)': { slug: 'seated-military-press', title: 'Seated Military Press', exact: false },
  '사이드 레터럴 레이즈 (머신)': { slug: 'lateral-dumbbell-raises', title: 'Lateral Dumbbell Raises', exact: false },
  '리어 델트 플라이 (토러)': {
    slug: 'bent-over-rear-deltoid-raise-with-head-on-bench',
    title: 'Bent-Over Rear Delt Raise',
    exact: false,
  },
  '업라이트 로우 (스미스)': { slug: 'smith-machine-upright-row', title: 'Smith Machine Upright Row', exact: true },
  '바벨 컬': { slug: 'biceps-curls-with-barbell', title: 'Barbell Curl', exact: true },
  '케이블 푸쉬다운': { slug: 'triceps-pushdown-with-cable', title: 'Triceps Pushdown', exact: true },
  '해머 컬': { slug: 'alternating-hammer-curl-with-dumbbell', title: 'Hammer Curl', exact: true },
  '오버헤드 익스텐션': { slug: 'standing-triceps-extension-2', title: 'Standing Triceps Extension', exact: false },
  'V 스쿼트': { slug: 'hack-squat-machine', title: 'Hack Squat Machine', exact: false },
  '레그 프레스': { slug: 'leg-press', title: 'Leg Press', exact: true },
  '스탠딩 힙 어브덕션': { slug: 'thigh-abductor', title: 'Thigh Abductor', exact: false },
  '레그 컬': { slug: 'lying-leg-curl-machine', title: 'Lying Leg Curl', exact: true },
  '레그 익스텐션': { slug: 'leg-extensions', title: 'Leg Extensions', exact: true },
}

export function exerciseArt(name: string): ExerciseArt | undefined {
  return ART[name]
}

export const artFrame = (slug: string, frame: 1 | 2) => `/exercises/${slug}-${frame}.svg`

export const ART_CREDIT = {
  text: '그림 Everkinetic · CC BY-SA 4.0',
  url: 'https://github.com/everkinetic/data',
}

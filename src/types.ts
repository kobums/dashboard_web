// snippet 프록시(/api/reading/summary) 응답 형태 — snippet_back DTO 와 1:1

export interface MonthlyStats {
  month: number
  completedCount: number
  totalPages: number
  categoryCount: Record<string, number>
}

export interface YearlyStats {
  year: number
  completedCount: number
  totalPages: number
}

export interface CategoryStats {
  category: string
  totalCount: number
  completedCount: number
  completionRate: number
}

export interface ReadingInsights {
  averageReadingDays: number
  topCategory: string
  longestReadingDays: number
  longestBook: string
}

export interface Streak {
  currentStreak: number
  maxStreak: number
  lastReadDate: string
}

export interface ReadingGoal {
  year: number
  targetBooks: number
  completedBooks: number
}

export interface ProgressBook {
  id: number
  bookId: number
  title: string
  author: string
  coverUrl: string
  status: string
  readPage: number | null
  totalPage: number | null
}

export interface ReadingSummary {
  year: number
  month: number
  monthlyStats: MonthlyStats[] | null
  yearlyStats: YearlyStats[] | null
  categoryStats: CategoryStats[] | null
  insights: ReadingInsights | null
  streak: Streak | null
  goals: ReadingGoal | null // 단일 객체 (올해 목표)
  progress: ProgressBook[] | null
}

// dashboard_go 자체 도메인

export interface Workout {
  id: number
  type: string
  title: string
  workoutdate: string
  starttime: string
  duration: number
  calories: number
  distance: number
  memo: string
  source: string
}

export interface HealthMetric {
  id: number
  metricdate: string
  name: string
  qty: number
  unit: string
}

// 개발 현황 (/api/dev/summary, /api/dev/recent)

export interface CalendarDay {
  date: string
  github: number
  gitlab: number
  total: number
}

export interface SourceCount {
  github: number
  gitlab: number
  all: number
}

export interface DevSummary {
  days: number
  from: string
  to: string
  calendar: CalendarDay[]
  total: SourceCount
  week: SourceCount
  month: SourceCount
  streak: { current: number; max: number }
}

export interface DevActivity {
  source: 'github' | 'gitlab'
  type: string
  repo: string
  title: string
  url: string
  date: string
}

export interface DevYear {
  year: number
  github: number
  gitlab: number
  total: number
  activeDays: number
  monthly: { month: number; total: number }[]
}

// 통합 같은 요일 비교 (/api/compare)

export interface UnifiedPoint {
  label: 'base' | 'prev' | 'week' | 'month' | 'year'
  date: string
  steps: number | null
  activeEnergy: number | null
  exerciseMinutes: number | null
  workoutMinutes: number | null
  workoutCount: number
  devCommits: number | null
  readingMinutes: number | null
  readingPages: number | null
}

export interface UnifiedCompare {
  baseDate: string
  weekdayLabel: string
  points: UnifiedPoint[]
}

// 독서 (/api/reading/daily, /api/reading/books)
// ReadingDay.pages = 세션 페이지와 snippet 읽은 페이지 로그 중 큰 값 (로그만 있는 날은 minutes·sessions 0)

export interface ReadingDay {
  date: string
  minutes: number
  pages: number
  sessions: number
}

export interface DoneBook {
  title: string
  author: string
  coverUrl: string
  rating: number
  endDate: string
}

// 운동·웨이트 잔디 (/api/fitness/daily, /api/lift/daily)

export interface FitnessDay {
  date: string
  minutes: number
  count: number
  calories: number
  types: string // 콤마 구분 workout 타입
  lift: boolean // 노션 웨이트 기록일
}

export interface LiftDailyRow {
  date: string
  sets: number // 본세트 (웜업 제외)
  volume: number // 중량 본세트 kg×회 (맨몸 제외)
  exercises: number
  parts: string[]
}

export interface MonthlyFitness {
  month: number
  sessions: number
  minutes: number
}

export interface YearFitness {
  year: number
  sessions: number
  minutes: number
  distance: number
  calories: number
  avgSteps: number
  byType: Record<string, number>
  monthly: MonthlyFitness[]
}

// ---- 웨이트 (노션 운동 기록 → /api/lift/*) ----

export interface LiftSet {
  weight: number
  reps: number
  bodyweight: boolean
}

export interface LiftAchievement {
  hit: number
  total: number
}

export interface LiftSyncStatus {
  configured: boolean
  lastSyncAt: string
  ok: boolean
  error: string
  days: number
  exercises: number
  sets: number
}

export interface LiftSessionSummary {
  date: string
  e1rm: number
  topWeight: number
  topReps: number
  volume: number
  sets: number
  mainText: string
}

export interface LiftExerciseSummary {
  name: string
  part: string
  bodyweight: boolean
  sessions: number
  firstDate: string
  lastDate: string
  best: { e1rm: number; weight: number; reps: number; date: string }
  last: LiftSessionSummary
  prev: LiftSessionSummary | null
  deltaE1rm: number | null
  deltaVolumePct: number | null
  nextTarget: string
  lastAchievement: LiftAchievement | null
}

export interface LiftCardio {
  name: string
  sessions: number
  lastDate: string
  totalMinutes: number
  totalDistance: number
}

export interface LiftWeek {
  weekStart: string
  days: number
  sets: Record<string, number>
  volume: Record<string, number>
  splitDone: string[]
  cardioMinutes: number
  cardioSessions: number
}

export interface LiftPR {
  date: string
  name: string
  kind: 'e1rm' | 'reps'
  value: number
  text: string
}

export interface LiftParseError {
  date: string
  name: string
  error: string
  notionUrl: string
}

export interface LiftOverview {
  sync: LiftSyncStatus
  exercises: LiftExerciseSummary[]
  cardio: LiftCardio[]
  weekly: LiftWeek[]
  prs: LiftPR[]
  parseErrors: LiftParseError[]
  bodyweight: { date: string; weight: number }[]
}

export interface LiftSession {
  date: string
  notionUrl: string
  warmup: LiftSet[]
  main: LiftSet[]
  warmupText: string
  mainText: string
  e1rm: number
  topWeight: number
  topReps: number
  volume: number
  totalReps: number
  goal: string
  achievement: LiftAchievement | null
  target: string
  isPR: boolean
  memo: string
  condition: string
}

export interface LiftExerciseDetail {
  name: string
  part: string
  bodyweight: boolean
  sessions: LiftSession[]
}

export interface LiftCalendarExercise {
  name: string
  part: string
  warmupText: string
  mainText: string
  main: LiftSet[]
  volume: number
  e1rm: number
  minutes: number
  speed: number
  incline: number
  distance: number
  memo: string
}

export interface LiftCalendarDay {
  date: string
  lift: null | {
    title: string
    parts: string[]
    condition: string
    summary: string
    cardio: string
    notionUrl: string
  }
  exercises: LiftCalendarExercise[]
  apple: { sessions: number; minutes: number; calories: number; types: string[] }
  steps: number
  weight: number
}

// ---- 웨이트 입력 (대시보드 → 노션, /api/lift/form·log) ----

export interface LiftCardioValues {
  minutes: number
  speed: number
  incline: number
  distance: number
}

export interface LiftFormEntry extends LiftCardioValues {
  id: string
  name: string
  part: string
  warmupText: string
  mainText: string
  target: string
  warmup: LiftSet[]
  main: LiftSet[]
  condition: string
  memo: string
}

export interface LiftCatalogLast extends LiftCardioValues {
  date: string
  warmupText: string
  mainText: string
  target: string
  warmup: LiftSet[]
  main: LiftSet[]
}

export interface LiftCatalogItem {
  name: string
  part: string
  bodyweight: boolean
  last: LiftCatalogLast | null
  goal: LiftSet[]
}

export interface LiftForm {
  date: string
  suggestedPart: string
  day: null | { id: string; title: string; parts: string[]; condition: string }
  entries: LiftFormEntry[]
  catalog: LiftCatalogItem[]
  parts: string[]
  conditions: string[]
}

// ---- 식단 (/api/diet/*) — 원본은 노션 「식단 일지」 ----

export interface Macros {
  kcal: number
  protein: number
  carbs: number
  fat: number
}

export type DayType = 'training' | 'rest'

export interface DietItem extends Macros {
  id: string
  food: string
  grams: number
  foodCode: string
  memo: string
}

export interface DietMeal {
  meal: string
  items: DietItem[]
  totals: Macros
}

export interface DietFrequent extends Macros {
  food: string
  grams: number
  foodCode: string
  meal: string
  count: number
}

export interface DietDay {
  date: string
  dayType: DayType
  dayTypeReason: string
  targets: Macros
  totals: Macros
  meals: DietMeal[]
  frequent: DietFrequent[]
  searchEnabled: boolean
}

export interface DietSummaryDay {
  date: string
  dayType: DayType
  logged: boolean
  totals: Macros
  target: Macros
  activeEnergy: number
  burn: number | null
  balance: number | null
  weight: number
}

export interface DietWeek {
  weekStart: string
  loggedDays: number
  avg: Macros | null
  avgBalance: number | null
  proteinHitDays: number
  avgWeight: number | null
  weightDelta: number | null
}

export interface DietTargets {
  training: Macros
  rest: Macros
}

export interface DietSummary {
  targets: DietTargets
  bmr: number
  days: DietSummaryDay[]
  weekly: DietWeek[]
}

export interface DietSearchItem {
  foodCode: string
  name: string
  maker: string
  basis: string
  basisGrams: number
  per: Macros
  servingGrams: number
}

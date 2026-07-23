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

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { api } from '../lib/api'
import type { HealthMetric, Workout } from '../types'
import { buildWeeklyMinutes, fmtDate, thisWeekStart, WORKOUT_TYPES } from '../lib/fitness'
import ActivityRing from '../components/common/ActivityRing'
import WorkoutForm from '../components/fitness/WorkoutForm'
import WeeklyChart from '../components/fitness/WeeklyChart'
import WorkoutList from '../components/fitness/WorkoutList'
import CompareCard from '../components/fitness/CompareCard'
import YearlyStatsCard from '../components/fitness/YearlyStatsCard'

export { WORKOUT_TYPES } from '../lib/fitness'

export default function Fitness() {
  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [weights, setWeights] = useState<HealthMetric[]>([])

  const today = new Date()
  const rangeStart = new Date(today.getTime() - 55 * 86400000) // 8주

  const load = useCallback(() => {
    api
      .get(`/workout?startworkoutdate=${fmtDate(rangeStart)}&endworkoutdate=${fmtDate(today)}&pagesize=500`)
      .then((res) => setWorkouts(res.data.items ?? []))
      .catch(() => {})
    api
      .get(`/health/metrics?name=weight&from=${fmtDate(rangeStart)}&to=${fmtDate(today)}`)
      .then((res) => setWeights(res.data.items ?? []))
      .catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(load, [load])

  async function remove(w: Workout) {
    if (!window.confirm(`${w.workoutdate} ${WORKOUT_TYPES[w.type] ?? w.type} 기록을 삭제할까요?`)) return
    await api.delete('/workout', { data: { id: w.id } })
    load()
  }

  // 이번 주 (일요일 시작)
  const weekStart = thisWeekStart(today)
  const thisWeek = workouts.filter((w) => w.workoutdate >= fmtDate(weekStart))
  const weekMinutes = Math.round(thisWeek.reduce((s, w) => s + w.duration, 0) / 60)
  const weekCalories = thisWeek.reduce((s, w) => s + w.calories, 0)

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const weeklyData = useMemo(() => buildWeeklyMinutes(workouts, weekStart), [workouts])

  const weightData = weights.map((m) => ({
    name: `${Number(m.metricdate.slice(5, 7))}/${Number(m.metricdate.slice(8, 10))}`,
    kg: m.qty,
  }))
  const hasWeight = weightData.length > 1

  return (
    <div className="stack desktop-grid">
      <h1 className="display-title">운동</h1>

      {/* 이번 주 요약 */}
      <section className="card dg-4">
        <div className="card-row" style={{ gap: 32 }}>
          <ActivityRing progress={weekMinutes / 150} color="var(--accent)" size={140} strokeWidth={12}>
            <span className="ring-value large">{weekMinutes}</span>
            <span className="ring-sub">분 / 150분</span>
          </ActivityRing>
          <div className="stat-grid">
            <div>
              <p className="stat-value large">{thisWeek.length}</p>
              <p className="stat-label">이번 주 운동</p>
            </div>
            <div>
              <p className="stat-value large">{weekCalories.toLocaleString()}</p>
              <p className="stat-label">칼로리 (kcal)</p>
            </div>
          </div>
        </div>
      </section>

      {/* 같은 요일 비교 */}
      <CompareCard className="dg-8" />

      {/* 기록 추가 */}
      <section className="card dg-4">
        <h2 className="card-title">기록 추가</h2>
        <WorkoutForm onSaved={load} />
      </section>

      {/* 주별 운동 시간 */}
      <section className={`card ${hasWeight ? 'dg-4' : 'dg-8'}`}>
        <h2 className="card-title">주별 운동 시간</h2>
        <WeeklyChart data={weeklyData} />
      </section>

      {/* 체중 추이 (Apple Health) */}
      {hasWeight && (
        <section className="card dg-4">
          <h2 className="card-title">체중 추이</h2>
          <div className="chart-box">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weightData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="var(--track)" />
                <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fill: 'var(--ink-48)', fontSize: 12 }} />
                <YAxis
                  domain={['auto', 'auto']}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: 'var(--ink-48)', fontSize: 12 }}
                />
                <Tooltip
                  contentStyle={{ borderRadius: 11, border: '1px solid var(--tooltip-border)', background: 'var(--tooltip-bg)', color: 'var(--ink)', fontFamily: 'inherit', fontSize: 13 }}
                  formatter={(value) => [`${value ?? 0}kg`, '체중']}
                />
                <Line type="monotone" dataKey="kg" stroke="var(--accent)" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}

      {/* 연도별 통계 */}
      <YearlyStatsCard className="dg-8" />

      {/* 최근 기록 */}
      <section className="card dg-4">
        <h2 className="card-title">최근 기록</h2>
        <WorkoutList workouts={workouts} limit={10} onRemove={remove} />
      </section>
    </div>
  )
}

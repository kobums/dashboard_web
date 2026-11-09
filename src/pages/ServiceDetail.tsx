import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../lib/api'
import type { ServiceDetail as Detail } from '../types'
import { BarCard, daysAgoText, shortDate } from '../components/services/parts'

// 서비스 상세 — /api/signups/:key?days=30|90 (5분 캐시).
// 일별·주별 가입/활성, 활동 내역(라벨별), 이번 주 신규 vs 기존, 가입 주 코호트 리텐션.
// 색은 Action Blue 하나 — 코호트 칸은 같은 색의 불투명도로 비율을 인코딩.

const STATUS_LABEL: Record<Detail['status'], string> = {
  active: '활성',
  stale: '정체',
  dormant: '휴면',
  none: '기록 없음',
}

function CohortTable({ cohorts, weekStart }: { cohorts: NonNullable<Detail['activity']>['cohorts']; weekStart: string }) {
  const horizon = cohorts[0]?.active.length ?? 0
  return (
    <div className="cohort-wrap">
      <table className="cohort-table">
        <thead>
          <tr>
            <th>가입 주</th>
            <th>인원</th>
            {Array.from({ length: horizon }, (_, k) => (
              <th key={k}>{k + 1}주 뒤</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {[...cohorts].reverse().map((c) => (
            <tr key={c.start}>
              <td>{shortDate(c.start)}</td>
              <td className="size">{c.size}</td>
              {c.active.map((n, k) => {
                if (n === null) return <td key={k} />
                if (c.size === 0) return <td key={k} className="text-tertiary">–</td>
                const pct = Math.round((n / c.size) * 100)
                // 이번 주(진행 중) 칸은 점선 테두리
                const target = new Date(c.start + 'T00:00:00')
                target.setDate(target.getDate() + 7 * (k + 1))
                const partial =
                  `${target.getFullYear()}-${String(target.getMonth() + 1).padStart(2, '0')}-${String(target.getDate()).padStart(2, '0')}` ===
                  weekStart
                return (
                  <td
                    key={k}
                    className={`cohort-cell${pct >= 50 ? ' strong' : ''}${partial ? ' partial' : ''}`}
                    title={`${n}/${c.size}명${partial ? ' · 이번 주 진행 중' : ''}`}
                  >
                    <i style={{ opacity: pct === 0 ? 0.06 : 0.12 + (pct / 100) * 0.88 }} />
                    <b>{pct}%</b>
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function ServiceDetail() {
  const { key = '' } = useParams()
  const [days, setDays] = useState<30 | 90>(30)
  const [data, setData] = useState<Detail | null>(null)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    let alive = true
    api
      .get(`/signups/${encodeURIComponent(key)}?days=${days}`)
      .then((res) => {
        if (alive && res.data.code === 'ok' && res.data.item) setData(res.data.item)
      })
      .catch((err) => {
        if (alive && err.response?.status === 404) setNotFound(true)
      })
    return () => {
      alive = false
    }
  }, [key, days])

  if (notFound) {
    return (
      <div className="stack">
        <Link to="/services" className="back-link">‹ 서비스</Link>
        <p className="card text-secondary">없는 서비스입니다.</p>
      </div>
    )
  }
  if (!data || data.key !== key) {
    return <p className="text-tertiary">불러오는 중…</p>
  }

  const a = data.activity
  const rate = a && data.total > 0 ? Math.round((a.last30 / data.total) * 100) : null
  const daily = (pick: 'signups' | 'active') => data.daily.map((d) => ({ name: shortDate(d.date), 명: d[pick] }))
  const weekly = (pick: 'signups' | 'active') => data.weekly.map((w) => ({ name: shortDate(w.start), 명: w[pick] }))
  const newShare = a && a.thisWeek > 0 ? (a.newThisWeek / a.thisWeek) * 100 : 0

  return (
    <div className="stack desktop-grid">
      <div>
        <Link to="/services" className="back-link">‹ 서비스</Link>
        <h1 className="display-title">
          {data.name}
          <span className={`status-pill ${data.status}`}>{STATUS_LABEL[data.status]}</span>
        </h1>
      </div>

      <section className="card">
        <div className="stat-grid signup-stats">
          <div>
            <p className="stat-value large">{data.total.toLocaleString()}</p>
            <p className="stat-label">누적 가입</p>
            <span className="compare-delta">{daysAgoText('마지막 가입', data.lastSignup, '가입 없음')}</span>
          </div>
          <div>
            <p className="stat-value large">{a ? a.last30 : '–'}</p>
            <p className="stat-label">30일 활성</p>
            <span className="compare-delta">
              {a ? daysAgoText('마지막 활동', a.lastActive, '활동 없음') : '활동 기록 없음'}
            </span>
          </div>
          <div>
            <p className="stat-value large">{rate === null ? '–' : `${rate}%`}</p>
            <p className="stat-label">활성률</p>
            <span className="compare-delta">30일 활성 ÷ 누적 가입</span>
          </div>
          <div>
            <p className="stat-value large">{data.signupsThisWeek}</p>
            <p className="stat-label">이번 주 가입</p>
            <span className="compare-delta">오늘 {data.signupsToday}</span>
          </div>
        </div>
      </section>

      <div className="year-chips" style={{ marginTop: 0 }}>
        {([30, 90] as const).map((d) => (
          <button key={d} className={`year-chip${days === d ? ' active' : ''}`} onClick={() => setDays(d)}>
            {d}일
          </button>
        ))}
      </div>

      <BarCard
        className="dg-6"
        title="일별 가입"
        sub={`최근 ${data.days}일 · ${data.signupsWindow}명`}
        data={daily('signups')}
        label="신규 가입"
      />
      {a ? (
        <BarCard
          className="dg-6"
          title="일별 활성 유저"
          sub={`최근 ${data.days}일 · 고유 ${a.window}명`}
          data={daily('active')}
          label="활성 유저"
        />
      ) : (
        <section className="card dg-6 text-secondary">이 서비스는 유저별 활동 기록이 없어 활성도를 집계할 수 없습니다.</section>
      )}

      <BarCard
        className="dg-6"
        title="주별 가입"
        sub={`최근 ${data.weekly.length}주`}
        data={weekly('signups')}
        label="신규 가입"
        tooltipLabel={(l) => `${l} 주`}
      />
      {a && (
        <BarCard
          className="dg-6"
          title="주별 활성 유저"
          sub={`최근 ${data.weekly.length}주`}
          data={weekly('active')}
          label="활성 유저"
          tooltipLabel={(l) => `${l} 주`}
        />
      )}

      {a && (
        <section className="card dg-6">
          <h2 className="card-title">활동 내역</h2>
          <p className="text-secondary" style={{ fontSize: 14, marginTop: 4 }}>
            최근 {data.days}일 · 활성 유저로 집계하는 기록
          </p>
          <div style={{ marginTop: 8 }}>
            <div className="source-row head">
              <span>항목</span>
              <span className="num">건수</span>
              <span className="num">유저</span>
            </div>
            {a.sources.map((s) => (
              <div className="source-row" key={s.label}>
                <span>{s.label}</span>
                <span className="num">{s.events.toLocaleString()}</span>
                <span className="num">{s.users}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {a && a.cohortsReady && (
        <section className="card dg-6">
          <h2 className="card-title">이번 주 활성 유저</h2>
          <p className="text-secondary" style={{ fontSize: 14, marginTop: 4 }}>
            {shortDate(data.weekStart)} 월요일부터 · {a.thisWeek}명
          </p>
          <div className="stat-grid" style={{ marginTop: 16 }}>
            <div>
              <p className="stat-value">{a.newThisWeek}</p>
              <p className="stat-label">이번 주 가입</p>
            </div>
            <div>
              <p className="stat-value">{a.returningThisWeek}</p>
              <p className="stat-label">기존 유저</p>
            </div>
          </div>
          <div className="split-bar" aria-hidden="true">
            <span style={{ width: `${newShare}%` }} />
          </div>
        </section>
      )}

      {a && a.cohortsReady && (
        <section className="card">
          <h2 className="card-title">가입 코호트 리텐션</h2>
          <p className="text-secondary" style={{ fontSize: 14, marginTop: 4 }}>
            가입한 주별로, N주 뒤 그 주에 활동한 비율 · 점선 칸은 이번 주(진행 중)
          </p>
          <CohortTable cohorts={a.cohorts} weekStart={data.weekStart} />
        </section>
      )}
    </div>
  )
}

import { useCallback, useEffect, useMemo, useState } from 'react'
import { api } from '../lib/api'
import type { LiftDailyRow, LiftOverview } from '../types'
import { buildLiftHeatDays, kg, shortDate, timeAgo } from '../lib/lift'
import Heatmap from '../components/common/Heatmap'
import Modal from '../components/common/Modal'
import { SkBlock, SkLines } from '../components/common/Skeleton'
import ExerciseGrowth from '../components/lift/ExerciseGrowth'
import ExerciseDetail from '../components/lift/ExerciseDetail'
import WeeklyVolume from '../components/lift/WeeklyVolume'
import LiftCalendar from '../components/lift/LiftCalendar'
import WeightVsStrength from '../components/lift/WeightVsStrength'
import LogSheet from '../components/lift/LogSheet'

// 웨이트 — 노션 「운동 캘린더」「운동 일지」를 서버가 동기화한 복제본(/api/lift/*)을 보여준다.
// 「오늘 기록」 시트로 대시보드에서 노션에 직접 기록할 수도 있다(/api/lift/form·log).
// 섹션: 동기화 상태 · 종목별 성장 · 최근 PR · 부위별 주간 볼륨 · 캘린더 · 웨이트 잔디 · 체중 vs 근력.

export default function Lift() {
  const [data, setData] = useState<LiftOverview | null>(null)
  const [daily, setDaily] = useState<LiftDailyRow[]>([])
  const [failed, setFailed] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [syncMessage, setSyncMessage] = useState('')
  const [selected, setSelected] = useState<string | null>(null)
  const [logging, setLogging] = useState(false)
  const [version, setVersion] = useState(0) // 기록 변경 시 자체 로딩 컴포넌트(캘린더) 리마운트

  const load = useCallback(() => {
    api
      .get('/lift/overview')
      .then((res) => {
        if (res.data.code === 'ok') {
          setData(res.data as LiftOverview)
          setFailed(false)
        } else setFailed(true)
      })
      .catch(() => setFailed(true))
    api
      .get('/lift/daily')
      .then((res) => setDaily(res.data.items ?? []))
      .catch(() => {})
  }, [])

  useEffect(load, [load])

  async function syncNow() {
    setSyncing(true)
    setSyncMessage('')
    try {
      const res = await api.post('/lift/sync')
      if (res.data.code !== 'ok') setSyncMessage(res.data.message || '동기화에 실패했습니다.')
      load()
    } catch {
      setSyncMessage('동기화에 실패했습니다.')
    } finally {
      setSyncing(false)
    }
  }

  const sync = data?.sync
  const heatDays = useMemo(() => buildLiftHeatDays(daily), [daily])
  const totalSets = daily.reduce((s, d) => s + d.sets, 0)

  return (
    <div className="stack desktop-grid">
      <div className="page-head">
        <div>
          <h1 className="display-title">웨이트</h1>
          <p className="lift-sync-status">
            {!sync
              ? failed
                ? '불러오지 못했습니다'
                : '불러오는 중…'
              : !sync.configured
                ? '노션 연동 미설정 (서버 NOTION_TOKEN)'
                : !sync.lastSyncAt
                  ? '아직 동기화 전'
                  : sync.ok
                    ? `노션 동기화 ${timeAgo(sync.lastSyncAt)} · ${sync.days}일 · ${sync.sets}세트`
                    : `동기화 실패 (${timeAgo(sync.lastSyncAt)}): ${sync.error}`}
            {syncMessage && ` · ${syncMessage}`}
          </p>
        </div>
        <div className="page-actions">
          <button
            className="page-action page-action-secondary"
            onClick={syncNow}
            disabled={syncing || (sync != null && !sync.configured)}
          >
            {syncing ? '동기화 중…' : '지금 동기화'}
          </button>
          <button className="page-action" onClick={() => setLogging(true)} disabled={sync != null && !sync.configured}>
            오늘 기록
          </button>
        </div>
      </div>

      {sync && !sync.configured && (
        <section className="card">
          <h2 className="card-title">노션 연동 설정 필요</h2>
          <p className="text-secondary" style={{ marginTop: 8, fontSize: 15 }}>
            notion.so/my-integrations 에서 내부 integration 을 만들고 「운동 계획 — 4분할」 페이지에 연결한 뒤, 서버 환경변수{' '}
            <code>NOTION_TOKEN</code> 을 설정하세요.
          </p>
        </section>
      )}

      {data && data.parseErrors.length > 0 && (
        <section className="card">
          <h2 className="card-title">노션 형식 확인 필요</h2>
          <p className="text-secondary" style={{ marginTop: 4, fontSize: 14 }}>
            아래 행은 세트 문법을 읽지 못해 통계에서 빠졌습니다. 예: <code>50×15,11,10 / 60×4,4</code>, 맨몸{' '}
            <code>BW×10,10</code>
          </p>
          <ul className="kv-list">
            {data.parseErrors.map((e) => (
              <li key={e.notionUrl + e.error}>
                <a className="kv-key lift-link" href={e.notionUrl} target="_blank" rel="noreferrer">
                  {shortDate(e.date)} {e.name}
                </a>
                <span className="kv-value">{e.error}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {!data ? (
        failed ? (
          <section className="card">
            <p className="text-tertiary">웨이트 데이터를 불러오지 못했습니다.</p>
          </section>
        ) : (
          <section className="card">
            <SkLines rows={3} />
            <SkBlock height={208} />
          </section>
        )
      ) : (
        <>
          <ExerciseGrowth className="dg-8" exercises={data.exercises} onSelect={setSelected} />

          <div className="side-stack dg-4">
            <section className="card">
              <h2 className="card-title">최근 신기록</h2>
              {data.prs.length === 0 ? (
                <p className="text-secondary" style={{ marginTop: 12, fontSize: 15 }}>
                  아직 신기록이 없습니다. 같은 종목 2회차부터 비교합니다.
                </p>
              ) : (
                <ul className="pr-list">
                  {data.prs.map((p) => (
                    <li key={p.date + p.name + p.kind}>
                      <button className="pr-item" onClick={() => setSelected(p.name)}>
                        <span className="pr-date">{shortDate(p.date)}</span>
                        <span className="pr-name">{p.name}</span>
                        <span className="pr-value">{p.kind === 'e1rm' ? kg(p.value) : `${p.value}회`}</span>
                        {p.text && <span className="pr-text">{p.text}</span>}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {data.cardio.length > 0 && (
              <section className="card">
                <h2 className="card-title">유산소</h2>
                <ul className="kv-list">
                  {data.cardio.map((c) => (
                    <li key={c.name}>
                      <span className="kv-key">{c.name}</span>
                      <span className="kv-value">
                        {c.sessions}회 · {Math.round(c.totalMinutes)}분
                        {c.totalDistance > 0 && ` · ${c.totalDistance.toFixed(1)}km`}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>

          <WeeklyVolume className="dg-6" weekly={data.weekly} />
          <LiftCalendar key={version} className="dg-6" />
          {heatDays.length > 0 && (
            <section className="card">
              <div className="card-head">
                <h2 className="card-title">웨이트 잔디</h2>
                <span className="text-secondary" style={{ fontSize: 14 }}>
                  {daily.length}일 · {totalSets.toLocaleString()}세트
                </span>
              </div>
              <Heatmap days={heatDays} thresholds={[8, 16, 24]} />
            </section>
          )}
          <WeightVsStrength bodyweight={data.bodyweight} exercises={data.exercises} />
        </>
      )}

      {logging && (
        <LogSheet
          onClose={(changed) => {
            setLogging(false)
            if (changed) {
              load()
              setVersion((v) => v + 1)
            }
          }}
        />
      )}

      {selected && (
        <Modal title={selected} onClose={() => setSelected(null)}>
          <ExerciseDetail name={selected} />
        </Modal>
      )}
    </div>
  )
}

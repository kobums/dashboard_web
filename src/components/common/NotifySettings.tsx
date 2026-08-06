import { useEffect, useState } from 'react'
import Modal from './Modal'
import {
  getCurrentSubscription,
  getServerPushStatus,
  pushSupportReason,
  sendTestPush,
  subscribePush,
  unsubscribePush,
  type PushServerStatus,
} from '../../lib/push'

// 알림 설정 모달 — 웹푸시(이 기기) 켜기/끄기 + ntfy 상태 + 테스트 발송.
// 발송 시각은 서버 스케줄러 고정: 아침 9시(어제 보고) / 저녁 8시(부족 경고).

export default function NotifySettings({ onClose }: { onClose: () => void }) {
  const [server, setServer] = useState<PushServerStatus | null>(null)
  const [subscribed, setSubscribed] = useState(false)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')

  const supportReason = pushSupportReason()

  useEffect(() => {
    getServerPushStatus()
      .then(setServer)
      .catch(() => setMessage('서버 상태를 불러오지 못했어요.'))
    getCurrentSubscription()
      .then((sub) => setSubscribed(!!sub))
      .catch(() => {})
  }, [])

  async function toggleWebPush() {
    if (!server) return
    setBusy(true)
    setMessage('')
    try {
      if (subscribed) {
        await unsubscribePush()
        setSubscribed(false)
        setMessage('이 기기의 알림을 껐어요.')
      } else {
        await subscribePush(server.publicKey)
        setSubscribed(true)
        setMessage('이 기기로 알림이 오도록 켰어요.')
      }
      getServerPushStatus().then(setServer).catch(() => {})
    } catch (e) {
      setMessage(e instanceof Error ? e.message : '알림 설정에 실패했어요.')
    } finally {
      setBusy(false)
    }
  }

  async function handleTest() {
    setBusy(true)
    setMessage('')
    try {
      const sent = await sendTestPush()
      setMessage(sent.length > 0 ? `테스트 발송 완료 (${sent.join(', ')})` : '발송할 채널이 없어요.')
    } catch (e) {
      setMessage(e instanceof Error ? e.message : '테스트 발송에 실패했어요.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal title="알림 설정" onClose={onClose}>
      <div className="push-settings">
        <p className="push-desc">
          아침 9시에 어제 결과를, 저녁 8시에 오늘 부족한 지표를 알려드려요.
        </p>

        <div className="push-row">
          <div className="push-row-text">
            <span className="push-row-title">이 기기 푸시 (웹푸시)</span>
            <span className="push-row-sub">
              {supportReason
                ? supportReason
                : server && !server.webpushConfigured
                  ? '서버에 VAPID 키가 설정되지 않았어요.'
                  : subscribed
                    ? '켜짐 — 이 기기로 알림이 와요.'
                    : '꺼짐'}
            </span>
          </div>
          {!supportReason && server?.webpushConfigured && (
            <button className="push-btn" onClick={toggleWebPush} disabled={busy}>
              {subscribed ? '끄기' : '켜기'}
            </button>
          )}
        </div>

        <div className="push-row">
          <div className="push-row-text">
            <span className="push-row-title">ntfy 앱 푸시</span>
            <span className="push-row-sub">
              {server?.ntfyConfigured
                ? '서버 설정됨 — iPhone ntfy 앱에서 토픽을 구독하면 알림이 와요.'
                : '서버에 NTFY_TOPIC 이 설정되지 않았어요.'}
            </span>
          </div>
        </div>

        {message && <p className="push-message">{message}</p>}

        <div className="push-footer">
          <button className="form-submit" onClick={handleTest} disabled={busy}>
            테스트 알림 보내기
          </button>
        </div>
      </div>
    </Modal>
  )
}

import { api } from './api'

// 웹푸시(PWA) 구독 관리.
// iOS 는 16.4+ 에서 홈 화면에 추가한 PWA(standalone)에서만 웹푸시가 동작한다 —
// Safari 탭에서는 PushManager 자체가 없어 pushSupportReason() 이 안내 문구를 돌려준다.

export interface PushServerStatus {
  publicKey: string
  webpushConfigured: boolean
  ntfyConfigured: boolean
  subscriptions: number
}

function isIOS(): boolean {
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  )
}

export function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as unknown as { standalone?: boolean }).standalone === true
  )
}

// 웹푸시 미지원이면 사유 문구, 지원하면 null.
export function pushSupportReason(): string | null {
  if ('serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window) {
    return null
  }
  if (isIOS() && !isStandalone()) {
    return '아이폰에서는 Safari 공유 버튼 → "홈 화면에 추가" 후, 홈 화면 앱에서 알림을 켤 수 있어요.'
  }
  return '이 브라우저는 웹 푸시를 지원하지 않아요.'
}

export async function getServerPushStatus(): Promise<PushServerStatus> {
  const res = await api.get('/push/status')
  return res.data as PushServerStatus
}

async function getRegistration(): Promise<ServiceWorkerRegistration> {
  return navigator.serviceWorker.register('/sw.js')
}

export async function getCurrentSubscription(): Promise<PushSubscription | null> {
  if (pushSupportReason()) return null
  const reg = await getRegistration()
  return reg.pushManager.getSubscription()
}

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4)
  const raw = atob((base64 + padding).replace(/-/g, '+').replace(/_/g, '/'))
  const out = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i)
  return out
}

export async function subscribePush(publicKey: string): Promise<void> {
  if (!publicKey) throw new Error('서버에 VAPID 키가 설정되지 않았어요.')
  const permission = await Notification.requestPermission()
  if (permission !== 'granted') throw new Error('알림 권한이 거부됐어요. 설정에서 허용해 주세요.')

  const reg = await getRegistration()
  const sub = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
  })
  await api.post('/push/subscribe', sub.toJSON())
}

export async function unsubscribePush(): Promise<void> {
  const sub = await getCurrentSubscription()
  if (!sub) return
  await api.post('/push/unsubscribe', { endpoint: sub.endpoint })
  await sub.unsubscribe()
}

export async function sendTestPush(): Promise<string[]> {
  const res = await api.post('/push/test')
  if (res.data.code !== 'ok') throw new Error(res.data.message || '테스트 발송 실패')
  return (res.data.sent as string[]) || []
}

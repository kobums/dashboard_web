// 테마 관리 — light / dark / system 3모드.
// system 은 html 의 data-theme 속성을 제거해 CSS 의 prefers-color-scheme 에 맡기고,
// 명시 선택은 data-theme 속성으로 강제한다. (초기 적용은 index.html 인라인 스크립트)

export type ThemeMode = 'system' | 'light' | 'dark'

const KEY = 'theme'
const ORDER: ThemeMode[] = ['system', 'light', 'dark']

export const THEME_LABELS: Record<ThemeMode, string> = {
  system: '자동',
  light: '라이트',
  dark: '다크',
}

export function getTheme(): ThemeMode {
  const saved = localStorage.getItem(KEY)
  return saved === 'light' || saved === 'dark' ? saved : 'system'
}

export function applyTheme(mode: ThemeMode) {
  if (mode === 'system') {
    document.documentElement.removeAttribute('data-theme')
  } else {
    document.documentElement.setAttribute('data-theme', mode)
  }
}

export function setTheme(mode: ThemeMode) {
  if (mode === 'system') {
    localStorage.removeItem(KEY)
  } else {
    localStorage.setItem(KEY, mode)
  }
  applyTheme(mode)
}

export function nextTheme(current: ThemeMode): ThemeMode {
  return ORDER[(ORDER.indexOf(current) + 1) % ORDER.length]
}

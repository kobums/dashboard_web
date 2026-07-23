# dashboard_web

대시보드 프론트엔드 — Vite + React 19 + TypeScript SPA. 빌드 산출물(`dist/`)은 `dashboard_go` 가 서빙한다 (별도 배포 없음).

## 스택

- Vite · React 19 · TypeScript · react-router · axios · recharts
- **Tailwind 안 씀** — 순수 CSS 한 파일 (`src/index.css`)
- 차트: recharts (바/라인), 히트맵은 커스텀 SVG

## 디자인 규칙 (SSOT: 루트 `DESIGN.md`)

- **단일 액센트 Action Blue `--accent`(#0066cc)** — 링크·버튼·활성 탭·포커스·차트·활동 링 전부. 두 번째 색 금지
- 그림자는 **책 표지에만** (제품 이미지 원칙). 카드는 hairline(#e0e0e0) 보더, radius 18px
- body 17px / 웨이트 300·400·600·700(500 없음) / 음수 letter-spacing / 버튼 프레스 `scale(0.95)`
- 증감 표시는 ▲▼ 기호 + 중립 잉크 (초록/빨강 금지)
- 폰트: `system-ui` 스택 (맥/iOS에서 SF Pro) — 웹폰트 없음

## 반응형

- **≤1023px**: 단일 컬럼 세로 스택 (모바일 기준)
- **≥1024px**: `.desktop-grid` 12컬럼(콘텐츠 1280px), 카드에 `dg-3/-4/-6/-8` span. `desktop-only` 는 데스크톱 전용 섹션(홈 미리보기 행)
- 히트맵·비교 표는 내부 가로 스크롤 (히트맵은 초기 스크롤 = 최근/오른쪽 끝, 요일·범례는 스크롤 밖 고정)

## 구조

```
src/
├── main.tsx              라우팅 + RequireAuth (dash_token localStorage)
├── index.css             전체 스타일 (토큰 :root + 컴포넌트 클래스 + 데스크톱 그리드)
├── types.ts              API 응답 타입
├── lib/
│   ├── api.ts            axios 인스턴스 (Bearer, 401 → /login)
│   ├── fitness.ts        주별 집계 유틸 (Fitness·홈 공용)
│   └── reading.ts        독서 일별 데이터 가공 (잔디·일별/주별 차트) + 개발 잔디 변환
├── pages/
│   ├── Overview.tsx      홈 — 알림 배너 + 3 요약 카드 + (데스크톱) 히트맵·책·운동차트·최근활동
│   ├── Reading.tsx       목표 링 / 나와의 비교 / 일별·주별 독서 시간 / 독서 잔디 / 연도별(완독 표지 그리드) / 읽는 책
│   ├── Fitness.tsx       주간 링 / 나와의 비교 / 일별·주별 운동 시간 / 기록 추가 모달 / 연도별 / 최근
│   ├── Dev.tsx           전체 잔디 / 나와의 비교 / 소스 카드 / 연도별 / 최근 활동
│   └── Login.tsx         액세스 키 입력
└── components/
    ├── common/           ActivityRing(시그니처), AppShell(탭 네비+테마 토글), NotifyBanner(알림 배너),
    │                     CompareCard(통합 /api/compare — metrics prop 으로 지표 선택, 세 페이지 공용),
    │                     Heatmap(범용 잔디 SVG — thresholds prop, 1월=연도 라벨, 개발·독서 공용)
    ├── reading/          BookProgressList, ReadingYearlyCard(연도 칩 + 월별 차트 + 완독 표지 그리드)
    ├── fitness/          WorkoutForm, WeeklyChart, YearlyStatsCard
    └── dev/              YearlyDevCard, RecentActivityList
```

## 개발 · 빌드

```bash
npm run dev      # :5173 — /api 는 localhost:8010 프록시 (vite.config.ts)
npm run build    # dist/ 생성 → dashboard_go 의 make web 이 복사해 이미지에 포함
```

인증: 로그인 화면에서 서버 `DASH_TOKEN` 값을 입력 → localStorage `dash_token` → axios 인터셉터가 Bearer 로 전송, 401 이면 로그인으로 리다이렉트.

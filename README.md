# 게임 쿠폰 허브 (Game Coupon Hub)

> 게임별 최신 쿠폰 정보를 5초 안에 확인하고 원클릭으로 복사하는 초경량 정적 웹사이트 MVP입니다.

서버, 데이터베이스, 로그인, 크롤러 없이 정적 사이트 생성(SSG) 방식으로 동작하며, 수많은 동시 접속자가 몰려도 Cloudflare Pages 무료 플랜 환경에서 비용과 서버 장애 없이 안정적으로 서비스됩니다.

---

## 1. 프로젝트 목적

사이트 방문자는 오직 **"사용 가능한 쿠폰 코드"**를 얻기 위해 접속합니다. 사용자가 페이지에 진입한 후 **5초 안에** 다음 정보를 파악할 수 있도록 최적화되었습니다.

1. 현재 사용 가능한 쿠폰 여부 및 개수
2. 쿠폰 코드 (가독성 높은 모노스페이스)
3. 보상 내용
4. 만료일 및 한국 시간(KST) 기준 D-Day
5. 원클릭 복사 버튼 (엄지 터치 최적화 44px 이상)
6. 게임사 공식 출처 링크
7. 게임 내 쿠폰 입력 가이드

---

## 2. 기술 스택

- **프레임워크**: Astro (Static Site Generation - SSG)
- **언어**: TypeScript
- **스타일링**: Pure CSS / Astro Scoped CSS (외부 UI 라이브러리 배제, 모바일 퍼스트 라이트 테마)
- **시간대 엔진**: 한국 표준시(`Asia/Seoul`, UTC+9) 기반 제로 디펜던시 계산 유틸리티
- **배포 타겟**: Cloudflare Pages (정적 `dist` 배포)
- **테스트 러너**: `tsx` (`node:test`) 기반 경량 단위 테스트

---

## 3. 설치 및 실행 방법

### 패키지 설치
```bash
npm install
```

### 로컬 개발 서버 실행
```bash
npm run dev
```
브라우저에서 `http://localhost:4321`로 접속합니다.

### 정적 빌드
```bash
npm run build
```
산출물은 `dist/` 디렉터리에 순수 HTML, CSS, JS, 에셋 형태로 생성됩니다.

### 단위 테스트 실행
```bash
npm test
```
KST 날짜 계산, D-Day 산출, 상태 판정, 게임 추가 확장성 테스트가 0.2초 이내로 실행됩니다.

---

## 4. Cloudflare Pages 배포 설정

Cloudflare Pages 대시보드에서 Git 리포지토리를 연결하고 다음 설정을 입력합니다:

| 설정 항목 | 입력 값 |
| :--- | :--- |
| **Framework preset** | `Astro` |
| **Build command** | `npm run build` |
| **Build output directory** | `dist` |
| **Node.js Version** | `18.0.0` 이상 (권장: `20+` or `22+`) |

### 환경 변수 (선택 사항)
- `PUBLIC_SITE_URL`: 운영 도메인 주소 (예: `https://game-coupon-hub.pages.dev` 또는 커스텀 도메인)
  - 이 값이 설정되면 올바른 canonical 태그, OpenGraph URL, `sitemap.xml`의 절대 경로가 자동 생성됩니다.
  - 설정되지 않은 경우 잘못된 canonical 태그 생성을 방지합니다.

별도의 Cloudflare Workers, Functions, KV, D1 데이터베이스는 일절 필요하지 않습니다.

---

## 5. 새 게임 추가하기 (5분 가이드)

새 게임을 추가할 때 Astro 컴포넌트나 라우트 코드를 일절 수정할 필요가 없습니다.

### 3단계 추가 절차:
1. `src/data/games/` 경로에 `{게임슬러그}.json` 파일을 생성합니다.
2. `public/games/` 경로에 게임 대표 아이콘 이미지(`{게임슬러그}.svg` 또는 `.webp`)를 넣습니다.
3. `npm run build`를 실행하면 `/games/{게임슬러그}` 상세 페이지 및 홈 목록, 사이트맵이 자동 생성됩니다.

### JSON 작성 예시 (`src/data/games/example-game.json`):
```json
{
  "slug": "example-game",
  "name": "예시 게임",
  "officialName": "Example Game Online",
  "icon": "/games/example-game.svg",
  "officialUrl": "https://example.com",
  "couponGuide": [
    "게임 접속 후 로비 우측 상단 [설정] 클릭",
    "메뉴에서 [계정] 또는 [서비스] 탭 선택",
    "[쿠폰 등록] 버튼 클릭 후 쿠폰 코드 입력",
    "인게임 우편함에서 보상 수령"
  ],
  "lastUpdated": "2026-09-06",
  "coupons": [
    {
      "code": "LAUNCH2026",
      "reward": "다이아 1,000개 + 골드 50,000",
      "issuedAt": "2026-09-01",
      "expiresAt": "2026-10-31T23:59:59+09:00",
      "sourceUrl": "https://example.com/notice/1",
      "notes": "신규 런칭 기념 쿠폰"
    }
  ]
}
```

---

## 6. 새 쿠폰 추가하기 (3분 가이드)

기존 게임에 새로운 쿠폰이 발표되었을 때:

1. 해당 게임의 JSON 파일 (`src/data/games/{게임슬러그}.json`)을 엽니다.
2. `coupons` 배열 맨 앞에 새 쿠폰 객체를 추가합니다.
3. `lastUpdated` 날짜를 오늘 날짜로 갱신하고 커밋/빌드합니다.

### 쿠폰 JSON 예시:
```json
{
  "code": "SPECIALGIFT",
  "reward": "영웅 소환권 10장",
  "issuedAt": "2026-09-06",
  "expiresAt": "2026-09-20T23:59:59+09:00",
  "sourceUrl": "https://playeternalreturn.com/posts/news/1234",
  "notes": "주말 깜짝 라이브 방송 보상"
}
```
만료일이 정해지지 않은 무기한 쿠폰은 `"expiresAt": null`로 입력하면 자동으로 `만료일 미정` 배지가 부여됩니다.

---

## 7. 만료 쿠폰 및 실시간 KST 처리 방식

- **SSG 정적 빌드 시점**: 빌드 시 한국 시간(KST) 기준으로 만료 상태를 판정하여 초기 HTML을 렌더링합니다.
- **브라우저 로드 시점 (Stale 방지)**: 사용자가 페이지를 열었을 때 클라이언트 스크립트가 현재 브라우저 시각을 KST(UTC+9)로 환산하여 각 쿠폰의 D-Day를 실시간으로 재계산합니다.
  - 빌드 이후 시간이 흘러 만료 시점이 지난 쿠폰은 즉시 '만료된 쿠폰' 접기 영역으로 DOM 노드가 자동 이동합니다.
  - 상단의 '사용 가능 N개' 카운터가 실시간 숫자로 갱신됩니다.
  - 따라서 **사이트를 매일 다시 빌드하지 않아도 방문자는 항상 정확한 상태를 보게 됩니다.**

---

## 8. 현재 이터널 리턴 데이터 상태

- **데이터 성격**: 100% 님블뉴런 이터널 리턴 공식 홈페이지 공지(`playeternalreturn.com`) 기반 검증 데이터
- **활성 쿠폰 상태**: 2026년 9월 현재 공식 확인된 활성 쿠폰이 없으므로 정직하게 **사용 가능한 쿠폰: 0개**로 표시
- **공식 만료 쿠폰**:
  - `ERBW2026`: Bilibili World 2026 기념 공식 쿠폰 (만료)
  - `THX3RDANNIVERSARY`: 3주년 기념 공식 쿠폰 (만료)
  - `2026ERSUMMER`: 여름 맞이 공식 쿠폰 (만료)
  - `SEASON11PTMG`: 시즌 11 시작 공식 쿠폰 (만료)
- **가이드 안내**: 인게임 공식 설정 경로 (`로비 > 우측 상단 톱니바퀴 > 서비스 탭 > 쿠폰 입력`) 수록

---

## 9. 프로젝트 구조

```
game-coupon-hub/
├── package.json
├── astro.config.mjs
├── tsconfig.json
├── .gitignore
├── README.md
├── public/
│   ├── favicon.svg
│   ├── robots.txt
│   └── games/
│       └── eternal-return.svg         # 이터널 리턴 전용 아이콘
├── src/
│   ├── types/
│   │   └── game.ts                    # GameData, CouponItem 타입 정의
│   ├── utils/
│   │   ├── date.ts                    # KST 기준 날짜 및 D-Day 계산 유틸리티
│   │   └── games.ts                   # JSON 데이터 로더 (fixtures 격리 보장)
│   ├── styles/
│   │   └── global.css                 # 모바일 퍼스트 라이트 디자인 시스템
│   ├── components/
│   │   ├── Header.astro               # 헤더
│   │   ├── Footer.astro               # 푸터 및 공식 공지 면책 조항
│   │   ├── GameCard.astro             # 홈 화면 게임 카드 (반응형/검색 대응)
│   │   ├── CouponCard.astro           # 쿠폰 카드 (모노스페이스, 원클릭 복사)
│   │   └── SeoMeta.astro              # SEO, OpenGraph, JSON-LD
│   ├── pages/
│   │   ├── index.astro                # 홈 (게임 목록 & 실시간 브라우저 검색)
│   │   ├── 404.astro                  # 404 에러 페이지
│   │   ├── sitemap.xml.ts             # 동적 정적 사이트맵
│   │   └── games/
│   │       └── [slug].astro           # 게임 상세 페이지 (SSG 정적 라우트)
│   └── data/
│       ├── games/
│       │   └── eternal-return.json    # 이터널 리턴 실데이터
│       └── fixtures/
│           └── multi-game-sample.json # 테스트용 격리 fixture (배포 차단)
└── tests/
    ├── date.test.ts                   # KST 만료/D-Day 계산 단위 테스트
    ├── games.test.ts                  # 게임 로더 및 fixtures 격리 테스트
    ├── client-reclassify.test.ts      # 시간 경과 시 만료 재분류 로직 테스트
    └── game-expansion.test.ts         # 새 게임 JSON 동적 확장성 테스트
```

---

## 10. 현재 MVP에서 의도적으로 제외한 기능

초경량성과 유지보수 단순함을 지키기 위해 다음 기능은 의도적으로 제외되었습니다:

- 데이터베이스 / 백엔드 API 서버 (Cloudflare Pages 무료 플랜 완벽 호환)
- 회원가입 / 로그인 / 사용자 세션
- 결제 / 후원 / 구독
- 실시간 크롤러 (공식 공지 직접 검증 원칙)
- AI API 연동
- 푸시 알림 및 웹소켓
- 관리자 패널 (Git + JSON 수정이 가장 안전하고 빠름)
- 불필요한 서드파티 추적 스크립트 및 빈 광고 박스

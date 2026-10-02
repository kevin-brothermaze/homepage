# 보면소득 · 광고해요 웹

광고 보고 소득 받는 앱 **보면소득**(brothermaze.com)과 광고주용 **광고해요**(adhaeyo.com)
랜딩 페이지입니다. 토스(toss.im) 서비스 페이지의 디자인 언어를 기준으로 만들었습니다.

**미리보기** — https://sooohaaan.github.io/brothermaze-web/

| 화면 | 주소 |
| --- | --- |
| 보면소득 | `/` |
| 광고해요 | `/adhaeyo/` |

이전에 공유된 `/?site=adhaeyo` 링크도 계속 열립니다.

> 총 지급액·시청자 수 등 일부 수치는 예시값입니다. `src/content.ts` 에 `[임시]` 로
> 표시돼 있고, 확정된 값은 `[확정]` 입니다.

## 실행

```bash
pnpm install
pnpm dev
```

`main` 에 푸시하면 GitHub Actions 가 GitHub Pages 로 배포합니다. 프로젝트 페이지라
빌드할 때 `--base=/brothermaze-web/` 가 붙습니다.

### AWS 미리보기 배포

CloudFront 미리보기 주소는 [보면소득](https://d1a6u3p5w26p51.cloudfront.net/)과
[광고해요](https://d1a6u3p5w26p51.cloudfront.net/adhaeyo/)입니다. 정식 도메인과는
별개이며, `main` 푸시로 자동 배포되는 GitHub Pages와도 별개입니다.

AWS CLI에 계정 `399376050959` 접근 권한이 있는 프로필을 설정한 다음 실행합니다.

```bash
pnpm install --frozen-lockfile
AWS_PROFILE=<profile> pnpm deploy:aws:preview --dry-run     # 변경 내용 미리 확인
AWS_PROFILE=<profile> pnpm deploy:aws:preview                 # 실제 배포
```

스크립트는 AWS 계정·S3 버킷·CloudFront 배포를 확인하고 `/` 기준으로 빌드한 뒤
S3에 업로드합니다. HTML은 재검증 캐시로, 기타 자산은 5분 캐시로 올리고 CloudFront
캐시 무효화가 끝나면 두 주소의 응답을 확인합니다. 기존 S3 객체를 삭제하지 않으며,
정식 도메인 DNS는 변경하지 않습니다. 정식 `www` 도메인용 화면 분기와
OG·canonical URL은 코드에 반영되어 있지만, CloudFront 호스트별 라우팅·인증서·DNS
연결은 아직 필요합니다. 자세한 대상 값은
`scripts/deploy-aws-preview.sh`에 고정되어 있습니다.

## 구조

| 경로 | 내용 |
| --- | --- |
| `src/content.ts` | 단가·통계·FAQ·링크 등 모든 숫자와 문구의 단일 출처 |
| `src/sites.ts` | 사이트별 제목·설명·og:image. 화면과 빌드가 같이 씁니다 |
| `src/App.tsx` | 경로 분기, 헤더·푸터, 스크롤 등장 관찰자, 다운로드 QR |
| `src/pages/BomeonPage.tsx` · `GwanggoPage.tsx` | 두 사이트의 본문 |
| `src/shared/ui.tsx` | `Section` `ChapterHead` `Button` `FAQ` `Coin` `Money` `SplitWords` |
| `src/index.css` | 디자인 토큰과 모션 |
| `src/assets/3d/` | 블렌더 렌더 (폰 레이어 + 금화·상품 스프라이트) |
| `scripts/make-og.mjs` | og:image 생성 → `public/og-image.png`, `public/og-adhaeyo.png` |
| `scripts/capture-screens.mjs` | 화면설계서용 섹션 캡처 (`?capture=1` 모드) |

`vite.config.ts` 의 `multiSiteHtml()` 이 빌드할 때 `dist/adhaeyo/index.html` 을 함께
찍어냅니다. 제목·설명·og 태그는 `sites.ts` 값으로 바꿔 넣습니다. 자바스크립트가
꺼져 있어도 두 주소가 각각 제대로 된 메타를 갖도록 하기 위한 것입니다.

## 디자인 시스템

토스 서비스 페이지를 실제로 띄워 계산된 값을 재서 맞췄습니다.

| | 모바일(390) | 데스크톱(1440) |
| --- | --- | --- |
| h1 | 32 / 1.30 | 56 / 1.30 |
| h2 | 28 / 1.40 | 40 / 1.40 |
| h3 | 24 / 1.40 | 32 / 1.40 |
| 카드 제목 | 20 | 24 |
| 본문 | 16 / 1.60 | 18 / 1.60 |

자간은 모두 `-0.01em`, 한글 줄바꿈은 `word-break: keep-all` 입니다.
콘텐츠 폭은 1440 에서 1224px(컨테이너 1320 + 좌우 여백 48), 모바일 여백은 20px.

색과 라운드는 `src/index.css` 의 `@theme` 에 있습니다. 회색 계열
(`#333840` `#4e535c` `#727780` `#1c1f25` `#f6f7f9` `#e8ebf0`)은 토스와 같은 값입니다.

- 브랜드 블루 `#0d82ff` — 큰 글자·버튼 배경·아이콘
- `#0967ce` — 작은 글자용 (흰 배경 대비 5.4:1)
- 카드 라운드 52px, 버튼은 알약

본문 글자는 모두 흰 배경 대비 4.5:1 이상입니다. 반투명으로 색을 흐리면 이 기준이
쉽게 깨지므로, 연한 글자가 필요하면 `ink-2` `ink-3` 같은 단색 토큰을 쓰세요.

## 모션

모든 효과는 `@media (prefers-reduced-motion: no-preference)` 안에 있습니다. 모션을
줄인 사용자에게는 아무것도 움직이지 않고, 내용은 처음부터 다 보입니다.

`src/index.css` 에 정의된 클래스입니다.

| 클래스 | 동작 |
| --- | --- |
| `.reveal-children` | 자식이 차례로 떠오릅니다. 화면 밖으로 나가면 되돌아가 다시 재생됩니다 |
| `.reveal-words` | 제목을 **글자 단위**로 쪼개 순차로 띄웁니다 (어절은 `.wgroup` 으로 묶어 줄바꿈 보호) |
| `.bar` `.bar-label` | 막대가 높이로 차오르고 금액이 뒤따릅니다 (`#why`) |
| `.fill` `.draw` `.seek` | 비율 막대 · 선그래프 그리기 · 재생 막대 (광고해요 `#memory`) |
| `.step` | 목록이 하나씩 이어집니다 |
| `.float-coin` | 3D 금화·상품이 각자 다른 주기로 떠다닙니다 |
| `.coin-in` | 히어로 — 뜨자마자 한 번 올라옵니다 |
| `.coin-drop` | `#referral` — 위에서 하나씩 내려와 쌓입니다 |
| `.coin-pop` | `#cash` — 폰 화면 한가운데서 튀어나옵니다 |
| `.coin-stream` | 코인이 계속 흘러옵니다 — "제한 없음"을 나타냅니다 (`#why`) |
| `.marquee` | 브랜드 띠. 마우스를 올리거나 포커스가 들어가면 멈춥니다 |

등장 효과는 `App.tsx` 의 IntersectionObserver 가 `.is-in` 을 붙였다 떼며 제어합니다.
`.float-coin` `.coin-stream` `.marquee` 는 무한 반복이라 화면 밖에서도 계속 돕니다.
새로 무한 반복을 넣는다면 보이지 않는 동안 세워 둘지 함께 정하세요.

## 3D 이미지

폰과 금화·상품을 **따로 렌더링해 겹쳐** 놓았습니다. 그래야 금화만 따로 움직일 수
있습니다. 블렌더 장면은 저장소 밖 `../3d-scenes/` 에 로컬로만 있고, 카메라·조명·재질
값과 좌표 변환은 그 폴더의 `README.md` 에 적어 두었습니다. `.blend` 는 바이너리라
저장할 때마다 통째로 쌓이므로 저장소에 넣지 않습니다.

화면 텍스처에는 실명·계좌번호가 들어 있던 스크린샷이 있어, 모두 가명(홍길동)과
예시 계좌로 바꾼 판을 씁니다.

## 앱 다운로드

스토어 배지 둘 대신 **원링크 하나**(`LINKS.oneLink`)로 보냅니다. 기기 판별은
원링크가 하므로 코드에서 `navigator.userAgent` 를 보지 않습니다.
헤더 버튼은 데스크톱에서 QR(`src/assets/qr-onelink.svg`, 빌드 전에 만들어 둔 SVG)을
펼치고, 모바일에서는 설치 링크로 바로 갑니다. 링크를 바꾸면 QR 도 다시 만들어야
합니다.

## 알아둘 것

- `pnpm format`(oxfmt 0.2)은 타입 선언의 구분자를 지우는 버그가 있어 쓰지 않습니다.
- Tailwind v4 커스텀 브레이크포인트는 **`rem` 으로 적어야** 합니다. `px` 로 적으면
  미디어 블록이 기본값보다 앞에 나와 `md:` 에 집니다.
- `@layer components` 의 규칙은 `utilities` 레이어보다 뒤에 오지 못합니다. 유틸리티와
  같은 속성을 다투면(예: 폭) 유틸리티가 이깁니다.
- `transform` 의 퍼센트는 **요소 자신의 크기** 기준입니다. 컨테이너 기준이 아닙니다.

React 19 · Vite 8 · Tailwind CSS 4 · Figma Make 스캐폴드 기반.

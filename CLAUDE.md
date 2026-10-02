@AGENTS.md

# 보면소득 · 광고해요 홈페이지

이 저장소는 React 19 + Vite 8 + Tailwind CSS 4로 만든 **정적 랜딩 페이지 두 개**를
한 번에 빌드합니다. 서비스 앱(`bmsd_app`)이나 광고 관리 서버와는 별도 프로젝트입니다.
처음 작업할 때 이 파일과 `README.md`를 읽고, 현재 Git 상태를 확인하세요.

## 화면과 소스

| 화면 | 경로 | 본문 |
| --- | --- | --- |
| 보면소득 | `/` | `src/pages/BomeonPage.tsx` |
| 광고해요 | `/adhaeyo/` | `src/pages/GwanggoPage.tsx` |

- `src/App.tsx`: 경로별 화면 전환, 공통 헤더·푸터, 모션, QR 다운로드 UI.
- `src/content.ts`: 숫자·문구·FAQ·외부 링크의 단일 출처. `[임시]` 표시 수치는
  운영 콘텐츠로 확정된 값이 아니므로 임의로 확정값처럼 사용하지 마세요.
- `src/sites.ts`: 각 화면의 제목·설명·OG 이미지 정의.
- `src/index.css`: 디자인 토큰·전역 CSS·모션.
- `src/assets/3d/`: 홈페이지에 사용하는 렌더 이미지.
- `vite.config.ts`의 `multiSiteHtml()`: 빌드 시 `dist/index.html`과
  `dist/adhaeyo/index.html`을 만들고 각 페이지의 메타데이터를 분리합니다.
- `scripts/make-og.mjs`: 공유용 OG 이미지를 `public/`에 생성합니다.

`src/App.tsx`는 정식 `www` 도메인에서는 호스트명으로 사이트를 판별합니다.
미리보기·GitHub Pages에서는 기존 경로(`/adhaeyo/`) 또는 `?site=adhaeyo`도 지원합니다.

## 로컬 실행과 검증

```bash
pnpm install --frozen-lockfile
pnpm dev
pnpm build
```

의존성 버전은 `pnpm-lock.yaml`을 따릅니다. UI 수정 후에는 두 경로를 각각 열어
데스크톱·모바일 배치, 이미지, 링크, 제목을 확인하세요. `pnpm format`은 현재 oxfmt
버전이 타입 선언 구분자를 손상시킬 수 있어 실행하지 않습니다(`README.md` 참조).

## 배포 경계 (2026-10-02 기준)

1. **GitHub Pages**: `.github/workflows/deploy.yml`이 `main` 푸시 때 자동 배포합니다.
   이 빌드는 프로젝트 하위 경로용 `--base=/brothermaze-web/`를 사용합니다.
2. **AWS 미리보기**: 비공개 S3 버킷
   `bmsd-homepage-static-399376050959` → CloudFront 배포
   `E2S9WRKM37X22G` (`d1a6u3p5w26p51.cloudfront.net`). 보면소득은 `/`,
   광고해요는 `/adhaeyo/`에서 확인합니다. CloudFront Function이 디렉터리 URL에
   `index.html`을 붙여 S3 파일로 연결합니다. 기존 도메인 DNS에는 연결하지 않았습니다.
3. **AWS 운영**: `www.brothermaze.com`과 `www.adhaeyo.com` 연결은 아직 구성되지
   않았고 운영 배포 스크립트도 없습니다. 미리보기 배포를 운영 배포로 간주하지 마세요.

미리보기 수동 배포에는 `scripts/deploy-aws-preview.sh`를 사용합니다.

```bash
AWS_PROFILE=<BMSD용_프로필> pnpm deploy:aws:preview --dry-run
AWS_PROFILE=<BMSD용_프로필> pnpm deploy:aws:preview
```

스크립트는 AWS 계정·버킷·CloudFront ID를 검증하고 `/` 기준으로 빌드·업로드한 뒤,
캐시 무효화와 두 공개 URL의 응답을 확인합니다. `--delete`를 사용하지 않습니다.
브라우저의 AWS 콘솔 로그인과 AWS CLI 자격 증명은 별개이므로, 실제 실행 전에
BMSD 계정의 CLI 접근 권한을 확인해야 합니다.

운영 연결 전 확인할 사항:

- 두 운영 도메인의 `/`에서 서로 다른 정적 HTML이 나와야 합니다. 앱의 호스트별
  화면 분기와 각 HTML의 OG·canonical URL은 코드에 반영했지만, CloudFront의
  호스트별 루트 URI 라우팅은 아직 구성되지 않았습니다.
- 운영 도메인에 연결하기 전에 인증서·DNS와 두 HTML의 실제 응답을 점검하세요.
- 운영용 인증서·CloudFront·DNS·운영 배포 대상은 미리보기와 구분해 검증하세요.

## 작업 원칙

- 기존 미커밋 변경을 보존하고, 배포·도메인 변경·`main` 푸시는 요청 범위를
  확인한 뒤 수행하세요. `main` 푸시 자체가 GitHub Pages 배포를 일으킵니다.
- 빌드 성공은 공개 URL 검증을 대체하지 않습니다. 배포 후 두 화면과 자산을
  실제 주소에서 확인하고 환경별 결과를 구분해 보고하세요.
- `README.md`의 콘텐츠·디자인·3D 이미지 상세 설명을 참고하고, 배포 구조나
  경로를 바꾸면 이 문서와 `README.md`도 함께 갱신하세요.

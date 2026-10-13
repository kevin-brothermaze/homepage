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

## 배포 경계 (2026-10-13 기준)

1. **GitHub Pages**: `.github/workflows/deploy.yml`이 `main` 푸시 때 자동 배포합니다.
   이 빌드는 저장소 이름에 맞춘 프로젝트 하위 경로용 `--base=/<repository-name>/`를 사용합니다.
2. **AWS 운영**: 비공개 S3 버킷
   `bmsd-homepage-static-399376050959` → CloudFront 배포
   `E2S9WRKM37X22G` (`d1a6u3p5w26p51.cloudfront.net`)는
   `https://www.brothermaze.com/`에 연결됐습니다. 광고해요는 별도 무료 배포
   `E1YEZX4JAGDCV2` (`d1oyjttq7vlv4n.cloudfront.net`)를 사용하며
   `https://www.adhaeyo.com/`에 연결됐습니다. 두 배포는 같은 S3 파일을 사용합니다.
   무료 플랜에는 서로 다른 루트 도메인을 한 배포에 연결할 수 없어 분리했습니다.
3. **기존 AWS 미리보기 주소**: 운영과 같은 버킷·파일을 사용하므로 이제 독립된
   테스트 환경이 아닙니다. `deploy:aws:preview`는 업로드를 차단합니다.

운영 수동 배포에는 `scripts/deploy-aws-production.sh`를 사용합니다.

```bash
AWS_PROFILE=<BMSD용_프로필> pnpm deploy:aws:production --dry-run
AWS_PROFILE=<BMSD용_프로필> pnpm deploy:aws:production
```

스크립트는 AWS 계정·버킷·두 CloudFront ID·운영 별칭을 검증하고 `/` 기준으로
빌드·업로드한 뒤, 두 배포의 캐시 무효화와 정식 URL의 제목·canonical을 확인합니다.
`--delete`를 사용하지 않습니다.
브라우저의 AWS 콘솔 로그인과 AWS CLI 자격 증명은 별개이므로, 실제 실행 전에
BMSD 계정의 CLI 접근 권한을 확인해야 합니다.

CloudFront Function `bmsd-homepage-directory-index`의 LIVE 소스는
`scripts/cloudfront-directory-index.js`로 보관합니다. 광고해요 호스트의 `/`를
`/adhaeyo/index.html`로 연결하고 디렉터리 URL에는 `index.html`을 붙입니다.
함수 파일을 변경해도 자동으로 AWS에 게시되지 않으므로 별도 저장·테스트·게시가 필요합니다.

`www.brothermaze.com`은 Cloudflare 프록시를 유지하며 SSL/TLS는 Full (strict)입니다.
`brothermaze.com` → `www.brothermaze.com` 이동은 기존 Cloudflare Page Rules가 처리합니다.
`www.adhaeyo.com`과 `adhaeyo.com`은 Route 53 A Alias로 같은 광고해요 배포에 연결됩니다.
2026-10-13 아임웹의 `adhaeyo.com` 사이트 연결만 해제했고, 기존 사이트는
`adhaeyo.imweb.me`를 대표 주소로 보존합니다. 루트는 LIVE 함수가 www 주소로 301 이동합니다.
광고해요 배포는 루트가 포함된 ACM 인증서 `41c4bf1f-b33f-42da-a133-5c434ae7fa13`을 사용합니다.
상세 설정·검증·롤백 값은 `docs/AWS_DOMAINS.md`를 참조하세요.

## 작업 원칙

- 기존 미커밋 변경을 보존하고, 배포·도메인 변경·`main` 푸시는 요청 범위를
  확인한 뒤 수행하세요. `main` 푸시 자체가 GitHub Pages 배포를 일으킵니다.
- 빌드 성공은 공개 URL 검증을 대체하지 않습니다. 배포 후 두 화면과 자산을
  실제 주소에서 확인하고 환경별 결과를 구분해 보고하세요.
- `README.md`의 콘텐츠·디자인·3D 이미지 상세 설명을 참고하고, 배포 구조나
  경로를 바꾸면 이 문서와 `README.md`도 함께 갱신하세요.

# AWS 정식 도메인 연결 (2026-10-13 갱신)

| 사이트 | 정식 URL | CloudFront ID | CloudFront 도메인 | S3 HTML |
| --- | --- | --- | --- | --- |
| 보면소득 | https://www.brothermaze.com/ | E2S9WRKM37X22G | d1a6u3p5w26p51.cloudfront.net | index.html |
| 광고해요 | https://www.adhaeyo.com/ | E1YEZX4JAGDCV2 | d1oyjttq7vlv4n.cloudfront.net | adhaeyo/index.html |

AWS 계정은 `399376050959`, 비공개 S3 버킷은
`bmsd-homepage-static-399376050959` (서울)입니다. 두 배포에 대한 `s3:GetObject`만
허용하는 OAC 정책을 사용합니다. 별도 사이트 업로드나 공개 버킷은 필요 없습니다.
CloudFront 무료 정액 플랜은 배포별 루트 도메인 하나를 지원하므로 배포를 분리했습니다.
공식 기준: https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/flat-rate-pricing-plan.html

## HTTPS와 라우팅

- 보면소득 배포의 활성 ACM 인증서: `us-east-1`,
  `a2f42493-5f4a-4008-800c-edc6a7790bde` (두 www 도메인, ISSUED).
- 광고해요 배포의 활성 ACM 인증서: `us-east-1`,
  `41c4bf1f-b33f-42da-a133-5c434ae7fa13` (루트 포함 네 도메인, ISSUED).
- CloudFront TLS 정책: `TLSv1.3_2025`, HTTP 요청은 HTTPS로 이동.
- LIVE 함수 `bmsd-homepage-directory-index`를 두 배포의 viewer-request에 연결.
  소스는 `scripts/cloudfront-directory-index.js`.
- `www.adhaeyo.com`과 광고해요 CloudFront 기본 호스트의 `/`는
  `/adhaeyo/index.html`로 연결. 자산 경로 `/assets/`는 유지.
- 인증서 갱신을 위해 기존 ACM 검증 CNAME은 유지.
- `adhaeyo.com` 요청은 LIVE 함수가 경로와 쿼리스트링을 유지해 www 주소로 301 이동합니다.

## DNS

### Cloudflare: brothermaze.com

- `www` CNAME: `d1a6u3p5w26p51.cloudfront.net`, **Proxied**, TTL Auto.
- SSL/TLS: Flexible → **Full (strict)**. 원본까지 HTTPS 인증서 검증.
- 루트 CNAME `brothermaze.com` → `www.brothermaze.com`은 유지.
- 기존 Page Rules 두 개가 HTTP/HTTPS 루트 요청을 `https://www.brothermaze.com/$1`로
  301 이동시키므로 루트 주소도 정상 접속.
- MX/TXT/DKIM 및 기타 레코드는 변경하지 않았습니다.

### Route 53: adhaeyo.com

- authoritative hosted zone: `Z05447971QYM1D08S0FC1`.
- `www.adhaeyo.com.` A Alias: `d1oyjttq7vlv4n.cloudfront.net.`,
  CloudFront zone `Z2FDTNDATAQYW2`, EvaluateTargetHealth false.
- 변경 ID: `/change/C03938792R66KR59SI5BX`.
- Route 53 변경 상태 `INSYNC` 확인 완료.
- 2026-10-13: 아임웹 광고해요 사이트의 대표 주소를 `adhaeyo.imweb.me`로 변경한 뒤
  `adhaeyo.com` 사이트 연결만 해제했습니다. 사이트·도메인 등록·구독은 삭제/해지하지 않았습니다.
- 아임웹의 CloudFront 별칭 해제 반영 후 광고해요 배포에 루트와 www 별칭을 함께 추가했습니다.
- `adhaeyo.com.` A Alias도 `d1oyjttq7vlv4n.cloudfront.net.`으로 전환했습니다.
  NS/TXT 및 다른 서비스 레코드는 변경하지 않았습니다.
- 루트 변경 ID: `/change/C0471988G51NVV64P78I` (2026-10-13), `INSYNC` 확인.
- 광고해요 배포는 `Deployed` 확인. CloudShell 외부 네트워크에서 루트 HTTPS의
  www 301 이동과 루트 HTTP의 HTTPS 이동을 확인했습니다.
- 외부에서 `http://adhaeyo.com/?utm_source=domain_test`를 따라가면
  `https://www.adhaeyo.com/?utm_source=domain_test` HTTP 200 및 광고해요 제목을 확인했습니다.
- 전환 직후 현재 PC의 DNS 리졸버는 루트에 대해 이전 NODATA 응답을 캐시하고 있어
  Chrome/IAB 루트 접속은 DNS 오류였습니다. 공개 권한 DNS·1.1.1.1·CloudShell에서는
  정상이며, Chrome의 www 페이지 표시도 확인했습니다. 로컬 루트 재확인은 캐시 만료 후 필요합니다.

## 운영 배포

```bash
AWS_PROFILE=<BMSD용_프로필> pnpm deploy:aws:production --dry-run
AWS_PROFILE=<BMSD용_프로필> pnpm deploy:aws:production
```

스크립트는 계정·버킷·두 배포의 도메인/별칭/원본을 검증하고 빌드·S3 업로드·두 배포
캐시 무효화·정식 URL 제목/canonical 검증을 수행합니다. DNS/함수/인증서는 변경하지 않습니다.
실행 전 BMSD 계정의 CLI 자격 증명이 필요합니다. 도메인 연결 작업은 로그인된 AWS
콘솔과 CloudShell로 수행했으며, 로컬 운영 배포 스크립트로 재배포한 것은 아닙니다.

기존 AWS 미리보기 URL은 같은 운영 파일을 읽습니다. `deploy:aws:preview`는 차단했으며
독립 미리보기는 GitHub Pages를 사용합니다. `main` 푸시는 GitHub Pages에 자동 배포됩니다.

## 확인한 결과

- 두 www HTTPS 주소에서 서로 다른 제목, canonical, OG 이미지 URL, 화면 본문 확인.
- 각 도메인에서 정적 자산 25개 모두 HTTP 200 확인.
- Chrome에서 두 화면, 상호 이동 버튼, 앱 다운로드 QR 표시 확인. 스크립트 error 로그 없음.
- `https://brothermaze.com/` → `https://www.brothermaze.com/` 301 확인.
- 라우팅 함수 로컬 7개 확인 및 AWS DEVELOPMENT 테스트 후 LIVE 게시.

## 복구 값

DNS 복구가 필요하면 배포부터 변경하지 말고 홈페이지 레코드만 이전 값으로 복원합니다.

- Cloudflare `www.brothermaze.com` 이전 CNAME: `d3s2189o9ejc7n.cloudfront.net`.
  프록시 Proxied는 유지. 현재 Full (strict)는 인증서 검증을 강화한 설정이므로
  단순 롤백 때문에 Flexible로 낮추지 않습니다.
- Route 53 `www.adhaeyo.com.` 이전 A Alias: `d3rt5ndif6flw8.cloudfront.net.`,
  HostedZoneId `Z2FDTNDATAQYW2`, EvaluateTargetHealth false.
- 루트 A Alias의 이전 값도 `d3rt5ndif6flw8.cloudfront.net.`이지만, 아임웹에서 연결을
  해제했으므로 DNS만 이 값으로 되돌려서는 복구되지 않습니다. 아임웹 도메인 재연결 및
  새로 할당되는 CloudFront 주소 확인이 먼저 필요합니다.
- 아임웹 홈페이지 자체와 DNS 검증 레코드는 삭제하지 않았습니다.

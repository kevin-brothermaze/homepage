# 광고해요 Google 추적

아임웹의 기존 설정을 AWS 홈페이지로 이전합니다.

- GA4: `G-QQZSX5KQMB`
- Google Ads: `AW-11483087405`
- 구현: `public/adhaeyo-tracking.js`, `vite.config.ts`의 광고해요 HTML 로더
- `https://www.adhaeyo.com`에서만 작동. 보면소득, localhost, GitHub Pages,
  CloudFront 미리보기에는 광고해요 측정 요청을 보내지 않습니다.
- 한 번만 초기화하며 기본 GA4 페이지 조회 및 Google Ads 기본 태그를 설정합니다.
- 아임웹의 전환 라벨은 모두 빈 값이었으므로 구매/가입/폼 제출 전환은 추가하지 않습니다.
  전환 측정이 필요하면 실제 Google Ads 전환 ID/라벨과 완료 이벤트를 별도로 연결해야 합니다.
- 전자상거래, 사용자 ID/이메일/전화번호 전송, 향상된 전환은 추가하지 않습니다.
- 기존 URL의 UTM/gclid를 변경하지 않습니다. 쿼리 URL에는 개인정보를 넣지 마세요.

## 배포와 점검

```bash
pnpm exec vite build --base=/
node --test scripts/test-tracking.mjs
pnpm deploy:aws:production
```

운영 배포는 두 CloudFront 캐시 무효화가 완료된 후 확인합니다. Chrome 개발자도구
Network에서 GA4 `g/collect`의 `tid=G-QQZSX5KQMB`, `en=page_view`와 Google Ads
`11483087405` 측정 요청 및 응답을 확인합니다. 보면소득에는 Google 태그가 없어야 합니다.
네트워크 전송 확인은 GA 보고서 집계나 광고 클릭 전환/기여도 확인과 별개입니다.

공식 가이드: https://developers.google.com/tag-platform/gtagjs/configure

## 운영 확인 — 2026-10-13

- 로그인된 AWS CloudShell에서 계정/CloudFront 별칭/원본을 확인한 뒤 광고해요
  `adhaeyo/index.html`과 `adhaeyo-tracking.js` 두 파일만 업로드했습니다.
  기존 HTML 백업: CloudShell `/tmp/adhaeyo-tracking.OOsig5/previous-index.html`.
- 광고해요 CloudFront `E1YEZX4JAGDCV2` 무효화
  `I6EACC154PIY6I6TMAFIQ6BQST`: `Completed`.
- 공개 운영 URL의 두 파일 SHA-256이 로컬 빌드 결과와 일치했습니다.
- 운영 Chrome Network: GA4 `G-QQZSX5KQMB`의 `page_view` → 204,
  Ads `11483087405`의 기본 태그/리마케팅/페이지 조회 요청 → 200/204.
- 보면소득 운영 페이지에는 Google 추적 스크립트가 없었습니다.
- `adhaeyo.com` → `www.adhaeyo.com` 301 전환 시 UTM 쿼리가 보존되었습니다.
- 실제 광고 클릭 전환, Ads 기여도 및 GA 관리 화면 집계까지 검증한 것은 아닙니다.
- 아임웹 환불/구독/SSL/도메인 갱신 설정은 변경하지 않았습니다.

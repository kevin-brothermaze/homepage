/*
 * 두 사이트의 문서 메타 — App 과 빌드 스크립트(vite.config.ts)가 함께 씁니다.
 * 여기 값이 바뀌면 화면 전환 시의 메타와 정적 HTML 이 같이 갱신됩니다.
 */
export type SiteId = "bomyeon" | "adhaeyo"

export type SiteMeta = {
  id: SiteId
  label: string
  /* 경로 — 보면소득이 기본, 광고해요는 /adhaeyo/ */
  path: string
  canonicalUrl: string
  title: string
  description: string
  ogImage: string
}

export const SITES: SiteMeta[] = [
  {
    id: "bomyeon",
    label: "보면소득",
    path: "",
    canonicalUrl: "https://www.brothermaze.com/",
    title: "보면소득 — 원하는 콘텐츠를 보기만 해도 소득받는 전국민 보면소득",
    description:
      "15초 광고 하나에 7원. 보기만 하면 소득이 쌓이고, 소득 1원은 현금 1원처럼 쓰거나 내 계좌로 출금할 수 있어요.",
    ogImage: "og-image.png",
  },
  {
    id: "adhaeyo",
    label: "광고해요",
    path: "adhaeyo/",
    canonicalUrl: "https://www.adhaeyo.com/",
    title: "광고해요 — 전국민 누구나 보면소득에서 광고해요",
    description:
      "보면소득에 광고를 올리는 광고 관리 서비스. 노출은 무료, 끝까지 본 사람에게만 15원. 광고비의 절반은 광고를 본 사람에게 돌아갑니다.",
    ogImage: "og-adhaeyo.png",
  },
]

export const siteMeta = (id: SiteId) => SITES.find((s) => s.id === id)!

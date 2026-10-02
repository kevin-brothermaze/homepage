import { useCallback, useEffect, useRef, useState } from "react"
import { COMPANY, LINKS } from "./content"
import { Button, Container, cx } from "./shared/ui"
import logoBomyeon from "./assets/logo-bomyeon.png"
import qrOneLink from "./assets/qr-onelink.svg"
import { siteMeta, type SiteId } from "./sites"
import BomeonPage from "./pages/BomeonPage"
import GwanggoPage from "./pages/GwanggoPage"

type Site = SiteId

/* 화면을 바꿀 때 문서 메타도 함께 갱신합니다. */
function setMeta(attr: "name" | "property", key: string, value: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`)
  if (!el) {
    el = document.createElement("meta")
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute("content", value)
}

function setCanonical(url: string) {
  let el = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
  if (!el) {
    el = document.createElement("link")
    el.rel = "canonical"
    document.head.appendChild(el)
  }
  el.href = url
}

/* ?site= 로 화면을 고릅니다. #앵커는 페이지 안 이동에 그대로 씁니다. */
/* ?capture=1 — 화면설계서용 캡처 모드: 프로토타입 바와 고정 CTA를 숨김 */
const CAPTURE = new URLSearchParams(window.location.search).has("capture")

const BASE = import.meta.env.BASE_URL

/* 렌더 전에 미리 켜 두어야 요소가 보였다 사라지는 깜빡임이 없습니다. */
const REDUCED =
  window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
  !("IntersectionObserver" in window)
if (!REDUCED) document.documentElement.classList.add("reveal-ready")

/* 스크롤 등장 — 화면에 들어오면 떠오르고, 완전히 벗어나면 되돌아가
 * 다시 들어올 때 또 재생됩니다. */
function useReveal(site: Site) {
  useEffect(() => {
    if (REDUCED) return
    const targets = Array.from(
      document.querySelectorAll<HTMLElement>(
        ".reveal-children > *, .reveal-words",
      ),
    )
    targets.forEach((el) => {
      if (el.classList.contains("reveal-words")) return
      const order = Array.prototype.indexOf.call(el.parentElement!.children, el)
      el.style.transitionDelay = `${Math.min(order, 4) * 60}ms`
    })
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          /* 화면 밖으로 완전히 나갔을 때만 되돌리므로
           * 보이는 중에 사라지는 일은 없습니다. */
          entry.target.classList.toggle("is-in", entry.isIntersecting)
        }
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.05 },
    )
    targets.forEach((el) => io.observe(el))
    return () => {
      io.disconnect()
      targets.forEach((el) => {
        el.classList.remove("is-in")
        el.style.transitionDelay = ""
      })
    }
  }, [site])
}

function readSite(): Site {
  const hostname = window.location.hostname.toLowerCase()
  if (hostname === "www.adhaeyo.com") return "adhaeyo"
  if (hostname === "www.brothermaze.com") return "bomyeon"
  if (/\/adhaeyo\/?$/.test(window.location.pathname)) return "adhaeyo"
  /* 이전에 공유된 ?site=adhaeyo 링크도 계속 열리도록 */
  const q = new URLSearchParams(window.location.search).get("site")
  return q === "adhaeyo" ? "adhaeyo" : "bomyeon"
}

function siteUrl(id: Site) {
  if (["www.brothermaze.com", "www.adhaeyo.com"].includes(window.location.hostname.toLowerCase())) {
    return siteMeta(id).canonicalUrl
  }
  return BASE + siteMeta(id).path
}

function useSite() {
  const [site, setSite] = useState<Site>(readSite)
  useEffect(() => {
    const onPop = () => setSite(readSite())
    window.addEventListener("popstate", onPop)
    return () => window.removeEventListener("popstate", onPop)
  }, [])
  useEffect(() => {
    const meta = siteMeta(site)
    document.title = meta.title
    setMeta("name", "description", meta.description)
    setMeta("property", "og:title", meta.title)
    setMeta("property", "og:description", meta.description)
    const ogImageUrl = new URL(meta.ogImage, meta.canonicalUrl).href
    setMeta("property", "og:image", ogImageUrl)
    setMeta("name", "twitter:image", ogImageUrl)
    setCanonical(meta.canonicalUrl)
  }, [site])
  const go = useCallback((next: Site) => {
    const target = siteUrl(next)
    if (target.startsWith("https://")) {
      window.location.assign(target)
      return
    }
    window.history.pushState(null, "", target)
    setSite(next)
    window.scrollTo({ top: 0 })
  }, [])
  return [site, go] as const
}

function useScrolled(threshold: number) {
  const [on, setOn] = useState(false)
  useEffect(() => {
    const f = () => setOn(window.scrollY > threshold)
    f()
    window.addEventListener("scroll", f, { passive: true })
    return () => window.removeEventListener("scroll", f)
  }, [threshold])
  return on
}

/* ── 사이트 헤더 ────────────────────────────────────── */
function Logo({ site, onDark }: { site: Site; onDark?: boolean }) {
  if (site === "adhaeyo") {
    return (
      <span className="flex items-baseline gap-2">
        <span
          className={cx(
            "text-[19px] font-extrabold tracking-[-0.03em]",
            onDark ? "text-white" : "text-ink",
          )}
        >
          광고해요
        </span>
        <span
          className={cx(
            "text-[12px] font-semibold",
            onDark ? "text-white/90" : "text-ink-3",
          )}
        >
          by 보면소득
        </span>
      </span>
    )
  }
  return (
    <img
      src={logoBomyeon}
      alt="보면소득"
      width={40}
      height={40}
      className="block size-10"
    />
  )
}

/* 앱 다운로드 — 데스크톱에서는 QR 을 펼치고(폰으로 찍어야 설치되니까),
 * 모바일에서는 설치 링크로 바로 보냅니다. 두 경우를 CSS 로 갈라 두어
 * 사용자 에이전트를 들여다보지 않습니다. */
function AppDownload() {
  const [open, setOpen] = useState(false)
  const box = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false)
    const onDown = (e: MouseEvent) => {
      if (!box.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("keydown", onKey)
    document.addEventListener("mousedown", onDown)
    return () => {
      document.removeEventListener("keydown", onKey)
      document.removeEventListener("mousedown", onDown)
    }
  }, [open])

  return (
    <>
      <Button href={LINKS.oneLink} external size="sm" className="md:hidden">
        앱 다운로드
      </Button>
      <div ref={box} className="relative hidden md:block">
        <Button size="sm" expanded={open} onClick={() => setOpen((v) => !v)}>
          앱 다운로드
        </Button>
        {open && (
          <div
            role="dialog"
            aria-label="앱 설치 QR 코드"
            className="absolute top-full right-0 z-50 mt-3 w-[212px] rounded-2xl bg-surface p-4 shadow-card ring-1 ring-line"
          >
            <img
              src={qrOneLink}
              alt="보면소득 앱 설치 페이지로 가는 QR 코드"
              width={180}
              height={180}
              className="block w-full rounded-lg"
            />
            <p className="mt-3 text-center text-[13px] leading-[1.5] text-ink-2">
              휴대폰 카메라로 찍으면
              <br />앱 설치 페이지로 이동해요
            </p>
          </div>
        )}
      </div>
    </>
  )
}

function Header({ site, go }: { site: Site; go: (s: Site) => void }) {
  const scrolled = useScrolled(8)
  const links =
    site === "adhaeyo"
      ? [
          ["#usecases", "누구나 쉽게"],
          ["#value", "합리적인 광고"],
          ["#how", "광고하는 법"],
          ["#faq", "자주 묻는 질문"],
        ]
      : [
          ["#why", "왜 소득을 주나요"],
          ["#referral", "얻은소득 10%"],
          ["#cash", "현금처럼 사용"],
          ["#faq", "자주 묻는 질문"],
        ]

  return (
    <header
      className={cx(
        "sticky top-0 z-40 bg-ground/85 backdrop-blur-md transition-[box-shadow] duration-200",
        scrolled && "shadow-[0_1px_0_var(--color-line)]",
      )}
    >
      <Container className="flex h-16 items-center justify-between gap-6">
        <a
          href="#top"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          aria-label={`${
            site === "adhaeyo" ? "광고해요" : "보면소득"
          } 처음으로`}
          className="inline-flex min-h-11 items-center"
        >
          <Logo site={site} />
        </a>
        <nav
          aria-label="페이지 안 이동"
          className="hidden items-center gap-8 md:flex"
        >
          {links.map(([href, label]) => (
            <a
              key={href}
              href={href}
              /* ink-2 → ink 는 한 단계 차이라 올려도 거의 티가 나지 않습니다.
               * 브랜드 색으로 바꿔 눌리는 것임이 분명히 보이게 합니다. */
              className="inline-flex min-h-11 items-center text-[15px] font-semibold text-ink-2 transition-colors hover:text-brand-700"
            >
              {label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-4">
          {site === "adhaeyo" ? (
            <>
              <button
                type="button"
                onClick={() => go("bomyeon")}
                className="hidden min-h-11 items-center text-[15px] font-semibold text-ink-2 transition-colors hover:text-brand-700 sm:inline-flex"
              >
                보면소득 둘러보기
              </button>
              <a
                href={LINKS.console}
                className="hidden min-h-11 items-center text-[15px] font-semibold text-ink-2 transition-colors hover:text-brand-700 sm:inline-flex"
              >
                로그인
              </a>
              <Button href="#signup" size="sm">
                무료로 시작하기
              </Button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => go("adhaeyo")}
                className="hidden min-h-11 items-center text-[15px] font-semibold text-ink-2 transition-colors hover:text-brand-700 sm:inline-flex"
              >
                광고주이신가요?
              </button>
              <AppDownload />
            </>
          )}
        </div>
      </Container>
    </header>
  )
}

/* ── 모바일 고정 CTA — 히어로를 지나면 나타나고, 마지막 CTA에서는 숨김 ── */
function MobileCTA({ site }: { site: Site }) {
  const pastHero = useScrolled(560)
  const [atEnd, setAtEnd] = useState(false)
  const targetId = site === "adhaeyo" ? "signup" : "download"

  useEffect(() => {
    const el = document.getElementById(targetId)
    if (!el) return
    const io = new IntersectionObserver(([e]) => setAtEnd(e.isIntersecting), {
      threshold: 0.15,
    })
    io.observe(el)
    return () => io.disconnect()
  }, [targetId, site])

  const show = pastHero && !atEnd

  return (
    <div
      aria-hidden={!show}
      className={cx(
        "fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 px-5 pt-3 backdrop-blur-md transition-transform duration-300 md:hidden",
        show ? "translate-y-0" : "pointer-events-none translate-y-full",
      )}
      style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}
    >
      {site === "adhaeyo" ? (
        <Button href="#signup" className="w-full">
          무료로 시작하기
        </Button>
      ) : (
        <Button href={LINKS.oneLink} external className="w-full">
          앱 설치하고 소득 받기
        </Button>
      )}
    </div>
  )
}

/* ── 푸터 — 현행 사이트의 사업자 정보 ─────────────────── */
function Footer({ site, go }: { site: Site; go: (s: Site) => void }) {
  return (
    <footer className="border-t border-line bg-surface pt-12 pb-28 md:pb-12">
      <Container className="grid gap-8 md:grid-cols-[1fr_auto]">
        <div>
          <Logo site={site === "adhaeyo" ? "adhaeyo" : "bomyeon"} />
          <dl className="mt-5 grid gap-1 text-[13px] leading-[1.7] text-ink-3">
            <div className="flex flex-wrap gap-x-4">
              <span>{COMPANY.name}</span>
              <span>대표 {COMPANY.ceo}</span>
              <span>사업자등록번호 {COMPANY.bizNo}</span>
            </div>
            <div className="flex flex-wrap gap-x-4">
              <span>통신판매업 신고 {COMPANY.mailOrderNo}</span>
              <span>{COMPANY.address}</span>
            </div>
            <div className="flex flex-wrap gap-x-4">
              <span>서비스 문의 {COMPANY.email}</span>
              <span>제휴·광고 문의 {COMPANY.partnerEmail}</span>
            </div>
          </dl>
          <p className="mt-5 text-[13px] text-ink-3">
            © 2026 BrotherMaze. All rights reserved.
          </p>
        </div>
        <nav
          aria-label="서비스 · 약관"
          className="flex flex-wrap gap-5 text-[13px] font-semibold text-ink-2 md:flex-col md:items-end md:gap-2"
        >
          <button
            type="button"
            onClick={() => go(site === "adhaeyo" ? "bomyeon" : "adhaeyo")}
            className="inline-flex min-h-11 items-center hover:text-ink"
          >
            {site === "adhaeyo" ? "보면소득" : "광고해요"}
          </button>
          <a
            href={LINKS.terms}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-11 items-center hover:text-ink"
          >
            이용약관
          </a>
          <a
            href={LINKS.privacy}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-11 items-center hover:text-ink"
          >
            개인정보 처리방침
          </a>
        </nav>
      </Container>
    </footer>
  )
}

export default function App() {
  const [site, go] = useSite()
  useReveal(site)
  return (
    <div id="top">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-full focus:bg-ink focus:px-5 focus:py-3 focus:font-semibold focus:text-white"
      >
        본문 바로가기
      </a>
      <Header site={site} go={go} />
      {site === "bomyeon" && <BomeonPage onSwitchToAd={() => go("adhaeyo")} />}
      {site === "adhaeyo" && <GwanggoPage />}
      <Footer site={site} go={go} />
      {!CAPTURE && <MobileCTA site={site} />}
    </div>
  )
}

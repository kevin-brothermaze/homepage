/* Imweb에서 이전한 공개 태그 ID. 운영 광고해요에서만 초기화합니다. */
;(function () {
  if (window.location.hostname.toLowerCase() !== "www.adhaeyo.com") return
  if (document.getElementById("adhaeyo-google-tag")) return

  window.dataLayer = window.dataLayer || []
  window.gtag = window.gtag || function () { window.dataLayer.push(arguments) }
  window.gtag("js", new Date())
  window.gtag("config", "G-QQZSX5KQMB")
  window.gtag("config", "AW-11483087405")

  const script = document.createElement("script")
  script.id = "adhaeyo-google-tag"
  script.async = true
  script.src = "https://www.googletagmanager.com/gtag/js?id=G-QQZSX5KQMB"
  document.head.appendChild(script)
})()

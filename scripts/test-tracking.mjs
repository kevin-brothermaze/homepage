import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { test } from "node:test"
import { runInNewContext } from "node:vm"

const source = readFileSync(new URL("../public/adhaeyo-tracking.js", import.meta.url), "utf8")
function page(hostname) {
  const scripts = []
  const window = { location: { hostname } }
  const document = {
    getElementById: (id) => scripts.find((script) => script.id === id),
    createElement: () => ({}),
    head: { appendChild: (script) => scripts.push(script) },
  }
  return { window, document, scripts }
}

test("운영 광고해요: GA4와 Ads 한 번씩 설정, 중복 초기화 방지", () => {
  const context = page("www.adhaeyo.com")
  runInNewContext(source, context)
  runInNewContext(source, context)
  assert.equal(context.scripts.length, 1)
  assert.equal(context.scripts[0].src, "https://www.googletagmanager.com/gtag/js?id=G-QQZSX5KQMB")
  const commands = Array.from(context.window.dataLayer, (args) => Array.from(args))
  assert.equal(commands.length, 3)
  assert.deepEqual(commands.slice(1), [["config", "G-QQZSX5KQMB"], ["config", "AW-11483087405"]])
  assert.equal(commands.some(([type]) => type === "event"), false)
})

for (const hostname of ["www.brothermaze.com", "brothermaze.com", "localhost", "127.0.0.1", "kevin-brothermaze.github.io", "d1oyjttq7vlv4n.cloudfront.net", "adhaeyo.com", "www.adhaeyo.com.example.org"]) {
  test(`${hostname}: 광고해요 추적 없음`, () => {
    const context = page(hostname)
    runInNewContext(source, context)
    assert.equal(context.scripts.length, 0)
    assert.equal(context.window.dataLayer, undefined)
  })
}

test("AWS HTML: 광고해요에만 로더 포함", () => {
  const main = readFileSync(new URL("../dist/index.html", import.meta.url), "utf8")
  const ad = readFileSync(new URL("../dist/adhaeyo/index.html", import.meta.url), "utf8")
  assert.equal(main.includes('src="/adhaeyo-tracking.js"'), false)
  assert.equal(ad.match(/src="\/adhaeyo-tracking.js"/g)?.length, 1)
})

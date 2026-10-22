const USER_AGENT =
  "NearbyTechBot/1.0 (personal event radar; +https://github.com/Kihoro-code/nearby-tech)"

export async function fetchText(url, { timeout = 20000, headers = {} } = {}) {
  let lastError
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const response = await fetch(url, {
        redirect: "follow",
        headers: { "user-agent": USER_AGENT, accept: "*/*", ...headers },
        signal: AbortSignal.timeout(timeout),
      })
      if (!response.ok) throw new Error(`HTTP ${response.status} for ${url}`)
      return await response.text()
    } catch (error) {
      lastError = error
      if (attempt === 0) {
        await new Promise((resolve) => setTimeout(resolve, 800))
      }
    }
  }
  throw lastError
}

export async function fetchJson(url, options) {
  return JSON.parse(await fetchText(url, options))
}

const HTML_ENTITIES = {
  nbsp: " ",
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  ndash: "–",
  mdash: "—",
  hellip: "…",
  rsquo: "’",
  lsquo: "‘",
  ldquo: "“",
  rdquo: "”",
  bull: "•",
  middot: "·",
  euro: "€",
  pound: "£",
  rupee: "₹",
  copy: "©",
  reg: "®",
  trade: "™",
}

function decodeEntities(value) {
  return String(value)
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => {
      const code = Number.parseInt(hex, 16)
      return Number.isFinite(code) ? String.fromCodePoint(code) : _
    })
    .replace(/&#(\d+);/g, (_, decimal) => {
      const code = Number(decimal)
      return Number.isFinite(code) ? String.fromCodePoint(code) : _
    })
    .replace(/&([a-z]+);/gi, (match, name) => HTML_ENTITIES[name.toLowerCase()] ?? match)
}

export function stripHtml(value = "") {
  return decodeEntities(
    String(value)
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
  )
    .replace(/\s+/g, " ")
    .trim()
}

export function truncate(value, max = 700) {
  const text = String(value || "").trim()
  if (text.length <= max) return text
  return `${text.slice(0, max - 1).trimEnd()}…`
}

export function parseJsonLdEvents(html) {
  const events = []
  const blocks = html.matchAll(
    /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
  )
  for (const block of blocks) {
    try {
      const parsed = JSON.parse(block[1])
      const roots = Array.isArray(parsed) ? parsed : [parsed]
      for (const root of roots) {
        const candidates = Array.isArray(root?.["@graph"])
          ? root["@graph"]
          : [root]
        for (const candidate of candidates) {
          const types = Array.isArray(candidate?.["@type"])
            ? candidate["@type"]
            : [candidate?.["@type"]]
          if (types.includes("Event")) events.push(candidate)
        }
      }
    } catch {
      // A malformed block should not take down the whole source.
    }
  }
  return events
}

import { mkdir, readFile, writeFile } from "node:fs/promises"
import { dirname } from "node:path"

import { hash } from "./normalize.mjs"

const USER_AGENT =
  "NearbyTechBot/1.0 (personal event radar; +https://github.com/Kihoro-code/nearby-tech)"

const BLOCKED_STATUSES = new Set([401, 403, 405, 429])

async function request(url) {
  let lastError
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const response = await fetch(url, {
        redirect: "follow",
        headers: { "user-agent": USER_AGENT, accept: "*/*" },
        signal: AbortSignal.timeout(12000),
      })
      await response.body?.cancel()
      return {
        ok: response.ok || BLOCKED_STATUSES.has(response.status),
        blocked: BLOCKED_STATUSES.has(response.status),
        status: response.status,
      }
    } catch (error) {
      lastError = error
      if (attempt === 0) {
        await new Promise((resolve) => setTimeout(resolve, 500))
      }
    }
  }
  return { ok: false, blocked: false, status: 0, error: lastError?.message }
}

async function check(url, cache, now, ttlHours) {
  const cached = cache[url]
  if (
    cached &&
    now - new Date(cached.checkedAt).getTime() < ttlHours * 3600000
  ) {
    return cached
  }
  const result = await request(url)
  const entry = { ...result, checkedAt: new Date(now).toISOString() }
  cache[url] = entry
  return entry
}

export async function verifyEvents(
  events,
  { cachePath = "data/cache/links.json", concurrency = 6, ttlHours = 24 } = {}
) {
  let cache = {}
  try {
    cache = JSON.parse(await readFile(cachePath, "utf8"))
  } catch {
    cache = {}
  }

  const now = Date.now()
  const active = events.filter((event) => event.status === "active")
  const review = []
  let cursor = 0

  async function worker() {
    while (cursor < active.length) {
      const event = active[cursor]
      cursor += 1

      const link = await check(event.url, cache, now, ttlHours)
      let resolved = link
      let linkStatus = link.ok ? (link.blocked ? "blocked" : "ok") : "error"

      if (!link.ok && event.sourceUrl && event.sourceUrl !== event.url) {
        const source = await check(event.sourceUrl, cache, now, ttlHours)
        if (source.ok) {
          resolved = source
          linkStatus = "source-only"
        }
      }

      event.lastVerified = new Date(now).toISOString()

      if (!resolved.ok) {
        event.linkStatus = "error"
        event.status = "review"
        review.push({
          id: `verify:${hash(`${event.id}:${event.url}`)}`,
          sourceId: event.sources[0] || "unknown",
          sourceName: event.sources[0] || "unknown",
          eventName: event.name,
          url: event.url,
          reason: "Both the event link and the source page failed to resolve.",
          snippet: event.sourceUrl,
          detectedAt: new Date(now).toISOString(),
        })
      } else {
        event.linkStatus = linkStatus
      }
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, Math.max(1, active.length)) }, () =>
      worker()
    )
  )

  await mkdir(dirname(cachePath), { recursive: true })
  await writeFile(cachePath, JSON.stringify(cache, null, 2), "utf8")

  return review
}

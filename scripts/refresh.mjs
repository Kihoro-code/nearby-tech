import { mkdir, readFile, rename, writeFile } from "node:fs/promises"

import { startOfTodayIST } from "./lib/date.mjs"
import {
  eventKeys,
  mergeEvents,
  normalizeEvent,
  sortEvents,
} from "./lib/normalize.mjs"
import { verifyEvents } from "./lib/verify.mjs"

import { fetchDevfolio } from "./sources/devfolio.mjs"
import { fetchUnstop } from "./sources/unstop.mjs"
import { fetchGdgNashik } from "./sources/gdg-nashik.mjs"
import { fetchWordpressNashik } from "./sources/wordpress-nashik.mjs"
import { fetchCncfNashik } from "./sources/cncf-nashik.mjs"
import { fetchKkwagh } from "./sources/kkwagh.mjs"
import { fetchSiem } from "./sources/siem.mjs"

const DATA_DIR = "data"
const WINDOW_DAYS = 90
const ARCHIVE_DAYS = 365

const ADAPTERS = [
  { id: "devfolio", name: "Devfolio", run: fetchDevfolio },
  { id: "unstop", name: "Unstop", run: fetchUnstop },
  { id: "gdg-nashik", name: "GDG Nashik", run: fetchGdgNashik },
  {
    id: "wordpress-nashik",
    name: "WordPress Nashik",
    run: fetchWordpressNashik,
  },
  { id: "cncf-nashik", name: "CNCF Nashik", run: fetchCncfNashik },
  { id: "kkwagh", name: "K. K. Wagh (KKWIEER)", run: fetchKkwagh },
  { id: "siem", name: "SIEM / Sandip Foundation", run: fetchSiem },
]

function argValue(name) {
  const prefix = `--${name}=`
  const found = process.argv.find((arg) => arg.startsWith(prefix))
  return found ? found.slice(prefix.length) : undefined
}

const options = {
  sources: argValue("source")
    ? new Set(argValue("source").split(",").map((value) => value.trim()))
    : null,
  skipVerify:
    process.argv.includes("--skip-verify") ||
    process.env.REFRESH_SKIP_VERIFY === "1",
  dryRun: process.argv.includes("--dry-run"),
}

async function readJson(path, fallback) {
  try {
    return JSON.parse(await readFile(path, "utf8"))
  } catch {
    return fallback
  }
}

async function writeJson(path, value) {
  if (options.dryRun) return
  await mkdir(DATA_DIR, { recursive: true })
  const temporary = `${path}.tmp`
  await writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`, "utf8")
  await rename(temporary, path)
}

function withTimeout(promise, ms, label) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms)
    ),
  ])
}

function sourceIdsFor(event) {
  return event.sources?.length ? event.sources : ["unknown"]
}

function sourceRunState(event, ranSources, failedSources) {
  const sources = sourceIdsFor(event).filter((id) => id !== "manual")
  return {
    isManualOnly: sources.length === 0,
    wasRun: sources.some((id) => ranSources.has(id)),
    didFail: sources.some((id) => failedSources.has(id)),
    wasNotSelected: sources.some((id) => !ranSources.has(id)),
  }
}

function eventIsPast(event, today = startOfTodayIST()) {
  const end = event.end ? new Date(event.end) : new Date(event.start)
  return end < today
}

function dedupeReview(items) {
  const seen = new Set()
  return items.filter((item) => {
    const key = `${item.sourceId}:${item.url}:${item.reason}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

async function main() {
  const now = new Date()
  const nowIso = now.toISOString()
  const today = startOfTodayIST()
  const archiveCutoff = new Date(now.getTime() - ARCHIVE_DAYS * 86400000)

  const existingFile = await readJson(`${DATA_DIR}/events.json`, { events: [] })
  const existing = Array.isArray(existingFile.events) ? existingFile.events : []
  const manualFile = await readJson(`${DATA_DIR}/manual.json`, { events: [] })
  const previousSources = await readJson(`${DATA_DIR}/sources.json`, {
    sources: [],
  })
  const previousHealth = new Map(
    (previousSources.sources || []).map((entry) => [entry.id, entry])
  )

  const selected = ADAPTERS.filter(
    (adapter) => !options.sources || options.sources.has(adapter.id)
  )

  const results = await Promise.allSettled(
    selected.map(async (adapter) => {
      const result = await withTimeout(adapter.run(), 90000, adapter.id)
      return { adapter, result }
    })
  )

  const rawEvents = []
  const reviewItems = []
  const health = []
  const ranSources = new Set()
  const failedSources = new Set()

  results.forEach((settled, index) => {
    const adapter = selected[index]
    const previous = previousHealth.get(adapter.id)
    let events = []
    let result

    if (settled.status === "fulfilled") {
      result = settled.value.result
      ranSources.add(adapter.id)
      events = result.events || []
      rawEvents.push(...events)
      reviewItems.push(...(result.review || []))
    } else {
      failedSources.add(adapter.id)
      result = null
      const message =
        settled.reason instanceof Error
          ? settled.reason.message
          : String(settled.reason)
      health.push({
        id: adapter.id,
        name: adapter.name,
        url: previous?.url || "",
        status: "error",
        events: existing.filter(
          (event) =>
            event.status === "active" &&
            sourceIdsFor(event).includes(adapter.id)
        ).length,
        lastChecked: nowIso,
        lastSuccess: previous?.lastSuccess || null,
        message: `Source failed: ${message}`,
      })
      return
    }

    const mergedHealth = {
      id: adapter.id,
      name: result.health?.name || adapter.name,
      url: result.health?.url || previous?.url || "",
      status: result.health?.status || "ok",
      events: events.length,
      lastChecked: nowIso,
      lastSuccess: nowIso,
      message: result.health?.message || "",
    }
    health.push(mergedHealth)
  })

  const manualEvents = []
  for (const raw of manualFile.events || []) {
    const normalized = normalizeEvent(
      {
        ...raw,
        sourceId: "manual",
        sourceEventId: raw.id || raw.name,
        manual: true,
        sources: ["manual"],
      },
      { now, windowDays: WINDOW_DAYS }
    )
    if (normalized.event) {
      manualEvents.push(normalized.event)
    } else {
      reviewItems.push({
        id: `manual:${raw.id || raw.name || "unknown"}`,
        sourceId: "manual",
        sourceName: "Added by you",
        eventName: raw.name || "Untitled manual event",
        url: raw.url || raw.sourceUrl || "",
        reason: `Manual event skipped: ${normalized.reason}`,
        snippet: null,
        detectedAt: nowIso,
      })
    }
  }

  const normalizedSourceEvents = []
  for (const raw of rawEvents) {
    const normalized = normalizeEvent(raw, { now, windowDays: WINDOW_DAYS })
    if (normalized.event) {
      normalizedSourceEvents.push(normalized.event)
    }
  }

  // A source that silently returns zero events is more likely broken than
  // empty. Never let that wipe the last good data from the page.
  for (const adapter of selected) {
    if (failedSources.has(adapter.id)) continue
    const entry = health.find((item) => item.id === adapter.id)
    if (!entry || entry.status !== "ok") continue

    const previousUpcoming = existing.filter(
      (event) =>
        event.status === "active" &&
        sourceIdsFor(event).includes(adapter.id) &&
        !eventIsPast(event, today)
    )
    const freshCount = normalizedSourceEvents.filter((event) =>
      sourceIdsFor(event).includes(adapter.id)
    ).length

    if (previousUpcoming.length > 0 && freshCount === 0) {
      entry.status = "error"
      entry.message = "Returned no events; keeping last good data."
      failedSources.add(adapter.id)
    }
  }

  // Keep firstSeen stable across refreshes.
  const existingByKey = new Map()
  for (const event of existing) {
    for (const key of eventKeys(event)) {
      if (!existingByKey.has(key)) existingByKey.set(key, event)
    }
  }
  for (const event of [...manualEvents, ...normalizedSourceEvents]) {
    const previous = eventKeys(event)
      .map((key) => existingByKey.get(key))
      .find(Boolean)
    if (previous?.firstSeen) event.firstSeen = previous.firstSeen
    if (options.skipVerify && previous) {
      // A fast refresh (usually for manual edits) should not throw away the
      // last link-check result.
      if (previous.linkStatus) event.linkStatus = previous.linkStatus
      if (previous.lastVerified) event.lastVerified = previous.lastVerified
    }
  }

  const mergedActive = mergeEvents([...manualEvents, ...normalizedSourceEvents])

  // Carry forward last-good data from sources that failed, or that were not
  // selected in a partial local run.
  const freshKeys = new Set(mergedActive.flatMap(eventKeys))
  const carried = []

  for (const event of existing) {
    if (event.status !== "active") continue
    if (eventKeys(event).some((key) => freshKeys.has(key))) continue
    if (eventIsPast(event, today)) continue

    const runState = sourceRunState(event, ranSources, failedSources)
    if (runState.isManualOnly) continue

    if (runState.didFail || runState.wasNotSelected || !runState.wasRun) {
      carried.push({ ...event, stale: true })
      for (const key of eventKeys(event)) freshKeys.add(key)
    }
  }

  const active = sortEvents([...mergedActive, ...carried])

  if (!options.skipVerify) {
    const verificationReview = await verifyEvents(active, {
      cachePath: `${DATA_DIR}/cache/links.json`,
      concurrency: 6,
      ttlHours: 24,
    })
    reviewItems.push(...verificationReview)
  } else {
    for (const event of active) {
      if (!event.lastVerified) event.lastVerified = nowIso
    }
  }

  const verifiedActive = active.filter((event) => event.status === "active")

  for (const entry of health) {
    if (entry.status !== "ok") continue
    const activeCount = verifiedActive.filter((event) =>
      sourceIdsFor(event).includes(entry.id)
    ).length
    entry.rows = entry.events
    entry.events = activeCount
    entry.message =
      activeCount === 0
        ? "No upcoming events."
        : `${activeCount} upcoming event${activeCount === 1 ? "" : "s"}.`
  }

  const freshKeysAfterVerify = new Set(verifiedActive.flatMap(eventKeys))
  const reviewKeys = new Set(
    active
      .filter((event) => event.status === "review")
      .flatMap((event) => eventKeys(event))
  )
  const archived = []
  for (const event of existing) {
    if (
      !["active", "archived", "delisted", "closed"].includes(event.status)
    ) {
      continue
    }
    if (
      event.status === "active" &&
      eventKeys(event).some((key) => reviewKeys.has(key))
    ) {
      // A link failed verification and the event is in the review queue. It is
      // not delisted; leave it out of the archive until a human resolves it.
      continue
    }
    if (event.status === "active") {
      if (eventKeys(event).some((key) => freshKeysAfterVerify.has(key))) continue
      if (eventIsPast(event, today)) {
        archived.push({
          ...event,
          status: "archived",
          stale: false,
          archiveNote: "Past event",
        })
      } else {
        const runState = sourceRunState(event, ranSources, failedSources)
        if (runState.isManualOnly) {
          // Removed from data/manual.json before it happened: let it go.
          continue
        }
        if (runState.didFail || runState.wasNotSelected || !runState.wasRun) {
          // Already carried above; do not archive last-good data.
          continue
        }
        const registrationClosed =
          event.deadline && new Date(event.deadline) < now
        archived.push({
          ...event,
          status: registrationClosed ? "closed" : "delisted",
          stale: false,
          archiveNote: registrationClosed
            ? "Registration closed"
            : "No longer listed at the source",
        })
      }
    } else if (new Date(event.start) >= archiveCutoff) {
      if (event.status === "delisted" && eventIsPast(event, today)) {
        archived.push({
          ...event,
          status: "archived",
          archiveNote: "Past event",
        })
      } else if (
        event.status === "delisted" &&
        event.deadline &&
        new Date(event.deadline) < now
      ) {
        archived.push({
          ...event,
          status: "closed",
          archiveNote: "Registration closed",
        })
      } else {
        archived.push(event)
      }
    }
  }

  const archivedSorted = [...archived].sort(
    (a, b) => new Date(b.start).getTime() - new Date(a.start).getTime()
  )

  const eventsOutput = {
    generatedAt: nowIso,
    windowDays: WINDOW_DAYS,
    events: [...verifiedActive, ...archivedSorted],
  }

  const sourcesOutput = {
    generatedAt: nowIso,
    sources: ADAPTERS.map((adapter) => {
      const entry = health.find((item) => item.id === adapter.id)
      return (
        entry || {
          id: adapter.id,
          name: adapter.name,
          url: "",
          status: "unknown",
          events: 0,
          lastChecked: null,
          lastSuccess: previousHealth.get(adapter.id)?.lastSuccess || null,
          message: "Not run in this refresh.",
        }
      )
    }),
  }

  const reviewOutput = {
    generatedAt: nowIso,
    items: dedupeReview(reviewItems),
  }

  await writeJson(`${DATA_DIR}/events.json`, eventsOutput)
  await writeJson(`${DATA_DIR}/sources.json`, sourcesOutput)
  await writeJson(`${DATA_DIR}/review.json`, reviewOutput)

  const laneCounts = verifiedActive.reduce((counts, event) => {
    counts[event.lane] = (counts[event.lane] || 0) + 1
    return counts
  }, {})
  const failed = health.filter((entry) => entry.status === "error")

  console.log(
    `Nearby Tech refresh — ${nowIso}\n` +
      `Active: ${verifiedActive.length} (Nashik ${laneCounts.nashik || 0}, Maharashtra ${
        laneCounts.maharashtra || 0
      }, Online ${laneCounts.online || 0})\n` +
      `Archived: ${archivedSorted.length}\n` +
      `Review: ${reviewOutput.items.length}\n` +
      `Sources: ${health.length - failed.length}/${health.length} ok` +
      (failed.length
        ? `\nFailed: ${failed.map((entry) => entry.id).join(", ")}`
        : "")
  )
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})

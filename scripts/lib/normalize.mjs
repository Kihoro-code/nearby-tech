import { createHash } from "node:crypto"

import {
  addDays,
  istDateKey,
  istParts,
  startOfTodayIST,
  toISO,
} from "./date.mjs"
import { stripHtml, truncate } from "./http.mjs"

const NASHIK_PLACES = [
  "nashik",
  "nashik road",
  "panchavati",
  "satpur",
  "ambad",
  "deolali",
  "ojhar",
  "sinnar",
  "igatpuri",
  "trimbak",
  "niphad",
  "yeola",
  "manmad",
  "lasalgaon",
  "dindori",
  "peth",
  "surgana",
  "kalwan",
  "baglan",
  "chandwad",
]

const MAHARASHTRA_CITIES = [
  "mumbai",
  "pune",
  "nagpur",
  "thane",
  "navi mumbai",
  "pimpri",
  "pimpri chinchwad",
  "chinchwad",
  "aurangabad",
  "chhatrapati sambhajinagar",
  "kolhapur",
  "solapur",
  "amravati",
  "nanded",
  "akola",
  "jalgaon",
  "dhule",
  "ahmednagar",
  "sangamner",
  "lonavala",
  "panvel",
  "kalyan",
  "vasai",
  "virar",
  "alibaug",
  "ratnagiri",
  "satara",
  "sangli",
  "wardha",
  "chandrapur",
  "gondia",
  "bhandara",
  "washim",
  "buldhana",
  "parbhani",
  "hingoli",
  "jalna",
  "beed",
  "latur",
  "dharashiv",
  "nandurbar",
]

export const SOURCE_PRIORITY = {
  manual: 100,
  devfolio: 90,
  unstop: 80,
  "gdg-nashik": 70,
  "wordpress-nashik": 65,
  "cncf-nashik": 65,
  "allevents-nashik": 60,
  "meetup-nashik": 65,
  kkwagh: 60,
  siem: 50,
  "luma-mumbai": 75,
  mlh: 55,
}

const TYPE_ORDER = { hackathon: 0, ideathon: 1, meetup: 2, workshop: 3 }
const LANE_ORDER = { nashik: 0, maharashtra: 1, online: 2 }
const EVENT_TYPES = new Set(["hackathon", "ideathon", "meetup", "workshop"])
const EVENT_MODES = new Set(["in-person", "online", "hybrid"])

export function normalizeText(value = "") {
  return String(value)
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

export function isNashik(city) {
  const value = normalizeText(city)
  if (!value) return false
  if (value.includes("nashik")) return true
  return NASHIK_PLACES.includes(value)
}

export function isMaharashtra(state, city) {
  const stateValue = normalizeText(state)
  if (stateValue.includes("maharashtra")) return true
  const cityValue = normalizeText(city)
  return MAHARASHTRA_CITIES.includes(cityValue)
}

export function isIstFriendly(start) {
  const hour = istParts(new Date(start)).hour
  return hour >= 7 && hour < 23
}

export function inferType(title, fallback = "meetup") {
  const value = normalizeText(title)
  if (/\bideathon\b/.test(value)) return "ideathon"
  if (
    /\b(hackathon|hackfest|hackday|buildathon|codeprix|codefest|tech fight|techfight|equinox|force|ignite|challenge)\b/.test(
      value
    )
  ) {
    return "hackathon"
  }
  if (
    /\b(workshop|training|bootcamp|boot camp|seminar|webinar|lecture|session|vap|course)\b/.test(
      value
    )
  ) {
    return "workshop"
  }
  if (/\b(meetup|meet up|devfest|conference|summit|community)\b/.test(value)) {
    return "meetup"
  }
  return fallback
}

export function canonicalUrl(value) {
  if (!value) return ""
  try {
    const url = new URL(value)
    const path = url.pathname.replace(/\/+$/, "")
    return `${url.hostname.replace(/^www\./, "")}${path}`.toLowerCase()
  } catch {
    return normalizeText(value)
  }
}

function isGenericListingUrl(value) {
  if (!value) return true
  try {
    const path = new URL(value).pathname.replace(/\/+$/, "")
    return (
      path === "" ||
      /\/(events?|hackathons?|calendar|opportunities)$/i.test(path)
    )
  } catch {
    return true
  }
}

function hash(value) {
  return createHash("sha1").update(value).digest("hex").slice(0, 12)
}

export function eventKeys(event) {
  const keys = []
  if (event.url && !isGenericListingUrl(event.url)) {
    keys.push(`url:${canonicalUrl(event.url)}`)
  }
  const name = normalizeText(event.name)
    .replace(/\b(hackathon|hackfest|the|20\d{2})\b/g, "")
    .replace(/\s+/g, " ")
    .trim()
  keys.push(
    `name:${name.slice(0, 70)}|${istDateKey(event.start)}|${normalizeText(
      event.city
    )}`
  )
  return keys
}

function classifyLane(raw) {
  const type = raw.type
  const mode = raw.mode
  const city = raw.city
  const state = raw.state

  if (mode === "online") {
    if (
      (type === "meetup" || type === "workshop") &&
      !isIstFriendly(raw.start)
    ) {
      return { ok: false, reason: "online event outside IST-friendly hours" }
    }
    return { ok: true, lane: "online" }
  }

  if (isNashik(city)) return { ok: true, lane: "nashik" }

  if (
    (type === "hackathon" || type === "ideathon") &&
    isMaharashtra(state, city)
  ) {
    return { ok: true, lane: "maharashtra" }
  }

  if (mode === "hybrid" && !city) {
    return { ok: false, reason: "hybrid event with no location" }
  }

  return { ok: false, reason: "outside the travel radius" }
}

export function normalizeEvent(raw, { now = new Date(), windowDays = 90 } = {}) {
  const name = stripHtml(raw.name || "").trim()
  if (!name) return { event: null, reason: "missing event name" }

  const start = toISO(raw.start)
  if (!start) return { event: null, reason: "missing or invalid start date" }

  const sourceId = raw.sourceId || "manual"
  const sourceEventId = raw.sourceEventId || raw.id || name
  const type = EVENT_TYPES.has(raw.type) ? raw.type : inferType(name)
  const mode = EVENT_MODES.has(raw.mode) ? raw.mode : "in-person"
  const city = raw.city ? String(raw.city).trim() : undefined
  const state = raw.state ? String(raw.state).trim() : undefined
  const country = raw.country ? String(raw.country).trim() : undefined
  const startDate = new Date(start)
  const end = toISO(raw.end)
  const endDate = end ? new Date(end) : undefined
  const today = startOfTodayIST()
  const windowEnd = addDays(now, windowDays)
  const deadline = toISO(raw.deadline)

  if (endDate && endDate < today) {
    return { event: null, reason: "already ended" }
  }
  if (!endDate && startDate < today) {
    return { event: null, reason: "already started" }
  }
  if (startDate > windowEnd) {
    return { event: null, reason: "beyond the 90-day window" }
  }
  if (!raw.manual && deadline && new Date(deadline) < now) {
    return { event: null, reason: "registration explicitly closed" }
  }

  const laneResult = classifyLane({
    type,
    mode,
    city,
    state,
    start,
  })
  if (!laneResult.ok) return { event: null, reason: laneResult.reason }

  const cost = ["free", "paid", "unknown"].includes(raw.cost)
    ? raw.cost
    : raw.cost === 0
      ? "free"
      : "unknown"

  const themes = Array.isArray(raw.themes)
    ? [...new Set(raw.themes.map((theme) => String(theme).trim()).filter(Boolean))].slice(
        0,
        8
      )
    : []

  const nowIso = now.toISOString()
  const event = {
    id: `${sourceId}:${hash(`${sourceId}:${sourceEventId}:${start}:${name}`)}`,
    name,
    type,
    mode,
    lane: laneResult.lane,
    start,
    end,
    deadline,
    city,
    venue: raw.venue ? String(raw.venue).trim() : undefined,
    state,
    country,
    cost,
    costLabel:
      raw.costLabel ||
      (cost === "free" ? "Free" : cost === "paid" ? "Paid" : "Not listed"),
    host: raw.host ? String(raw.host).trim() : undefined,
    prize: raw.prize ? String(raw.prize).trim() : undefined,
    themes,
    url: raw.url || raw.sourceUrl,
    sourceUrl: raw.sourceUrl || raw.url,
    sources: Array.isArray(raw.sources) ? raw.sources : [sourceId],
    sourceIds: Array.isArray(raw.sourceIds)
      ? raw.sourceIds
      : [String(sourceEventId)],
    firstSeen: raw.firstSeen || nowIso,
    lastVerified: raw.lastVerified || nowIso,
    status: raw.status || "active",
    travelNote:
      raw.travelNote ||
      (laneResult.lane === "maharashtra"
        ? "Check if round 1 is online"
        : undefined),
    manual: Boolean(raw.manual),
    linkStatus: raw.linkStatus || "unchecked",
    description: truncate(stripHtml(raw.description || ""), 700),
    archiveNote: raw.archiveNote,
  }

  if (!event.url) return { event: null, reason: "missing event URL" }

  return { event, reason: null }
}

function unique(values) {
  return [...new Set(values.filter(Boolean))]
}

function mergeInto(base, incoming) {
  const sources = unique([...base.sources, ...incoming.sources])
  const sourceIds = unique([...base.sourceIds, ...incoming.sourceIds])
  const themes = unique([...base.themes, ...incoming.themes]).slice(0, 8)
  const firstSeen =
    base.firstSeen < incoming.firstSeen ? base.firstSeen : incoming.firstSeen
  const lastVerified =
    base.lastVerified > incoming.lastVerified
      ? base.lastVerified
      : incoming.lastVerified

  if (incoming.manual) {
    const id = base.id
    Object.assign(base, incoming)
    base.id = id
    base.manual = true
    base.sources = sources
    base.sourceIds = sourceIds
    base.themes = themes
    base.firstSeen = firstSeen
    base.lastVerified = lastVerified
    return
  }

  base.sources = sources
  base.sourceIds = sourceIds
  base.themes = themes
  base.firstSeen = firstSeen
  base.lastVerified = lastVerified

  for (const field of [
    "deadline",
    "prize",
    "city",
    "venue",
    "host",
    "description",
    "travelNote",
    "state",
    "country",
  ]) {
    if (!base[field] && incoming[field]) base[field] = incoming[field]
  }

  if (base.cost === "unknown" && incoming.cost !== "unknown") {
    base.cost = incoming.cost
    base.costLabel = incoming.costLabel
  }

  if (base.linkStatus !== "ok" && incoming.linkStatus === "ok") {
    base.linkStatus = "ok"
  }

  if (base.status !== "active" && incoming.status === "active") {
    base.status = "active"
  }
}

export function mergeEvents(events) {
  const sorted = [...events].sort((a, b) => {
    const priorityA = SOURCE_PRIORITY[a.sources[0]] || 0
    const priorityB = SOURCE_PRIORITY[b.sources[0]] || 0
    return priorityB - priorityA
  })

  const merged = []
  const index = new Map()

  for (const event of sorted) {
    const keys = eventKeys(event)
    let hit
    for (const key of keys) {
      if (index.has(key)) {
        hit = index.get(key)
        break
      }
    }

    if (hit) {
      mergeInto(hit, event)
      for (const key of [...eventKeys(hit), ...keys]) index.set(key, hit)
    } else {
      merged.push(event)
      for (const key of keys) index.set(key, event)
    }
  }

  return merged
}

export function sortEvents(events) {
  return [...events].sort((a, b) => {
    const laneDiff = (LANE_ORDER[a.lane] ?? 9) - (LANE_ORDER[b.lane] ?? 9)
    if (laneDiff !== 0) return laneDiff
    const typeDiff = (TYPE_ORDER[a.type] ?? 9) - (TYPE_ORDER[b.type] ?? 9)
    if (typeDiff !== 0) return typeDiff
    const startDiff = new Date(a.start).getTime() - new Date(b.start).getTime()
    if (startDiff !== 0) return startDiff
    return a.name.localeCompare(b.name)
  })
}

export { hash, unique }

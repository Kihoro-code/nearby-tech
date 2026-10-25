import { fetchText, parseJsonLdEvents, stripHtml, truncate } from "../lib/http.mjs"
import { startOfTodayIST } from "../lib/date.mjs"
import { inferType, isNashik } from "../lib/normalize.mjs"

const PAGES = [
  {
    url: "https://allevents.in/nashik/technology",
    fallbackType: "meetup",
  },
  {
    url: "https://allevents.in/nashik/workshops",
    fallbackType: "workshop",
  },
]

const HEADERS = {
  "user-agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  accept: "text/html,application/xhtml+xml",
  "accept-language": "en-IN,en;q=0.9",
}

const TECH_PATTERN =
  /\b(tech|technology|hackathon|hackfest|hackday|ideathon|buildathon|bug bounty|coding|code|programming|developer|software|web|app|ai|artificial intelligence|machine learning|ml|data science|data|cloud|cyber|security|blockchain|web3|crypto|iot|robotics|python|java|javascript|typescript|react|node|flutter|android|devops|aws|azure|google cloud|gdg|devfest|startup|innovation|computer|prompt|llm|generative|ar|vr|metaverse|game dev|game jam|ui|ux)\b/i

export const source = {
  id: "allevents-nashik",
  name: "AllEvents Nashik",
  url: PAGES[0].url,
}

function stateName(value) {
  if (!value) return undefined
  return String(value).toUpperCase() === "MH" ? "Maharashtra" : value
}

function countryName(value) {
  if (!value) return undefined
  return value === "IN" ? "India" : value
}

function attendanceMode(value) {
  const text = Array.isArray(value) ? value.join(" ") : value || ""
  if (text.includes("Online")) return "online"
  if (text.includes("Mixed")) return "hybrid"
  return "in-person"
}

function costFromOffers(offers) {
  const list = Array.isArray(offers) ? offers : offers ? [offers] : []
  const offer = list.find((entry) => entry?.price !== undefined)
  if (!offer) return { cost: "unknown", costLabel: "Not listed" }
  const price = Number(offer.price)
  if (price === 0) return { cost: "free", costLabel: "Free" }
  if (Number.isFinite(price) && price > 0) {
    return {
      cost: "paid",
      costLabel: `${offer.priceCurrency || ""} ${offer.price}`.trim(),
    }
  }
  return { cost: "unknown", costLabel: "Not listed" }
}

function isTechEvent(item) {
  return TECH_PATTERN.test(
    `${item.name || ""} ${stripHtml(item.description || "")}`
  )
}

function fallbackType(entry) {
  return entry.categories.has("workshop") ? "workshop" : "meetup"
}

async function readCategory(page, entries) {
  const html = await fetchText(page.url, { headers: HEADERS, timeout: 15000 })
  if (!html.includes("application/ld+json")) {
    throw new Error(`AllEvents page ${page.url} no longer exposes JSON-LD`)
  }
  const events = parseJsonLdEvents(html)
  if (events.length === 0) return 0

  let added = 0
  for (const item of events) {
    if (!item.name || !item.startDate || !item.url) continue
    const city = item.location?.address?.addressLocality
    if (!isNashik(city)) continue
    if (!isTechEvent(item)) continue

    const existing = entries.get(item.url)
    if (existing) {
      existing.categories.add(page.fallbackType)
      continue
    }

    entries.set(item.url, {
      item,
      categories: new Set([page.fallbackType]),
    })
    added += 1
  }
  return added
}

function toEvent(entry, detail) {
  const item = detail || entry.item
  const address = item.location?.address || {}
  const city = address.addressLocality || entry.item.location?.address?.addressLocality
  const state = stateName(
    address.addressRegion || entry.item.location?.address?.addressRegion
  )
  const country = countryName(
    address.addressCountry || entry.item.location?.address?.addressCountry
  )
  const description = stripHtml(item.description || entry.item.description || "")
  const mode = attendanceMode(item.eventAttendanceMode)
  const { cost, costLabel } = costFromOffers(item.offers)

  return {
    sourceId: source.id,
    sourceEventId: item.url || entry.item.url,
    name: item.name || entry.item.name,
    type: inferType(`${item.name || ""} ${description}`, fallbackType(entry)),
    mode,
    start: item.startDate || entry.item.startDate,
    end: item.endDate,
    city,
    state,
    country,
    venue: item.location?.name || entry.item.location?.name,
    host: item.organizer?.name,
    cost,
    costLabel,
    themes: ["Technology"],
    url: item.url || entry.item.url,
    sourceUrl: source.url,
    description: truncate(description, 700),
  }
}

export async function fetchAllEventsNashik() {
  const entries = new Map()
  const pages = await Promise.allSettled(
    PAGES.map((page) => readCategory(page, entries))
  )
  const pagesRead = pages.filter((page) => page.status === "fulfilled").length

  if (pagesRead === 0) throw new Error("All AllEvents Nashik pages failed")

  const today = startOfTodayIST()
  const candidates = [...entries.values()].filter(
    (entry) => new Date(entry.item.startDate) >= today
  )

  const details = await Promise.allSettled(
    candidates.map(async (entry) => {
      const html = await fetchText(entry.item.url, {
        headers: HEADERS,
        timeout: 10000,
      })
      const event = parseJsonLdEvents(html).find(
        (candidate) => candidate.startDate && candidate.name
      )
      return { entry, event }
    })
  )

  const events = []
  for (const result of details) {
    if (result.status !== "fulfilled") continue
    if (!result.value.event) continue
    events.push(toEvent(result.value.entry, result.value.event))
  }

  return {
    events,
    health: {
      id: source.id,
      name: source.name,
      url: source.url,
      status: "ok",
      events: events.length,
      message:
        events.length === 0
          ? "No upcoming Nashik technology events."
          : `${events.length} upcoming Nashik events.`,
    },
    review: [],
  }
}

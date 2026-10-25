import { fetchText, parseJsonLdEvents, stripHtml, truncate } from "../lib/http.mjs"
import { isMaharashtra } from "../lib/normalize.mjs"

const LIST_URL = "https://lu.ma/mumbai"
const FETCH_URL = "https://luma.com/mumbai"

const HEADERS = {
  "user-agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  accept: "text/html,application/xhtml+xml",
  "accept-language": "en-IN,en;q=0.9",
}

const LOCALITIES = {
  "मुंबई": "Mumbai",
  "पुणे": "Pune",
  "नाशिक": "Nashik",
  "महाराष्ट्र": "Maharashtra",
}

const HACKATHON_PATTERN =
  /\b(hackathon|hackfest|hackday|hack day|buildathon|ideathon|blitz|codefest|coding challenge|innovation challenge|hack sprint)\b/i

export const source = {
  id: "luma-mumbai",
  name: "Luma Mumbai",
  url: LIST_URL,
}

function locality(value) {
  if (!value) return undefined
  return LOCALITIES[value] || value
}

function stateName(value) {
  if (!value) return undefined
  const state = locality(value)
  return String(state).toUpperCase() === "MH" ? "Maharashtra" : state
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

function itemList(html) {
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
          if (
            candidate?.["@type"] === "ItemList" &&
            Array.isArray(candidate.itemListElement)
          ) {
            return candidate.itemListElement
          }
        }
      }
    } catch {
      // A malformed block should not take down the whole source.
    }
  }
  return []
}

function listEvent(element) {
  return element?.item?.startDate ? element.item : element
}

function hostName(item) {
  const organizers = Array.isArray(item.organizer)
    ? item.organizer
    : item.organizer
      ? [item.organizer]
      : []
  return organizers.find((entry) => entry?.["@type"] === "Organization")?.name ||
    organizers[0]?.name
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

function toEvent(item, detail) {
  const event = detail || item
  const address = event.location?.address || item.location?.address || {}
  const city = locality(address.addressLocality) || "Mumbai"
  const state = stateName(address.addressRegion) || "Maharashtra"
  const country = countryName(address.addressCountry) || "India"
  const mode = attendanceMode(event.eventAttendanceMode)
  const { cost, costLabel } = costFromOffers(event.offers)
  const name = event.name || item.name

  return {
    sourceId: source.id,
    sourceEventId: event["@id"] || event.url || item.url,
    name,
    type: /\bideathon\b/i.test(name) ? "ideathon" : "hackathon",
    mode,
    start: event.startDate || item.startDate,
    end: event.endDate || item.endDate,
    city,
    state,
    country,
    venue: event.location?.name || item.location?.name,
    host: hostName(event) || hostName(item),
    cost,
    costLabel,
    themes: ["Hackathon"],
    url: event.url || item.url,
    sourceUrl: LIST_URL,
    description: truncate(stripHtml(event.description || ""), 700),
  }
}

export async function fetchLumaMumbai() {
  const html = await fetchText(FETCH_URL, {
    headers: HEADERS,
    timeout: 25000,
  })
  const elements = itemList(html)
  if (elements.length === 0) {
    throw new Error("Luma Mumbai no longer exposes an ItemList")
  }

  const candidates = elements
    .map(listEvent)
    .filter(
      (item) =>
        item?.name &&
        item.startDate &&
        item.url &&
        HACKATHON_PATTERN.test(item.name) &&
        attendanceMode(item.eventAttendanceMode) !== "online"
    )

  const details = await Promise.allSettled(
    candidates.map(async (item) => {
      const detailHtml = await fetchText(item.url, {
        headers: HEADERS,
        timeout: 8000,
      })
      const event = parseJsonLdEvents(detailHtml).find(
        (candidate) => candidate.startDate && candidate.name
      )
      return { item, event }
    })
  )

  const events = []
  for (const result of details) {
    if (result.status !== "fulfilled") continue
    const event = toEvent(result.value.item, result.value.event)
    if (event.mode === "online") continue
    const city = event.city
    const state = event.state
    if (!isMaharashtra(state, city)) continue
    events.push(event)
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
          ? "No upcoming Maharashtra hackathons."
          : `${events.length} upcoming hackathons.`,
    },
    review: [],
  }
}

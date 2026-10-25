import { fetchText, stripHtml, truncate } from "../lib/http.mjs"
import { isMaharashtra } from "../lib/normalize.mjs"

const LIST_URL = "https://www.mlh.com/events"

const HEADERS = {
  "user-agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  accept: "text/html,application/xhtml+xml",
  "accept-language": "en-IN,en;q=0.9",
}

export const source = {
  id: "mlh",
  name: "Major League Hacking",
  url: LIST_URL,
}

function inertiaProps(html) {
  const blocks = html.matchAll(
    /<script[^>]*type=["']application\/json["'][^>]*>([\s\S]*?)<\/script>/gi
  )
  for (const block of blocks) {
    try {
      const parsed = JSON.parse(block[1])
      if (parsed?.props && typeof parsed.props === "object") {
        return parsed.props
      }
    } catch {
      // A malformed block should not take down the whole source.
    }
  }
  throw new Error("MLH page no longer exposes Inertia data")
}

function stateName(value) {
  if (!value) return undefined
  return String(value).toUpperCase() === "MH" ? "Maharashtra" : value
}

function countryName(value) {
  if (!value) return undefined
  return value === "IN" ? "India" : value
}

function locationParts(event) {
  const address = event.venueAddress || {}
  let city = address.city
  let state = stateName(address.state)

  if ((!city || !state) && event.location) {
    const [locationCity, locationState] = String(event.location)
      .split(",")
      .map((part) => part.trim())
    city ||= locationCity
    state ||= stateName(locationState)
  }

  return {
    city,
    state,
    country: countryName(address.country || "IN"),
  }
}

function eventMode(value) {
  if (value === "online") return "online"
  if (String(value).includes("hybrid")) return "hybrid"
  return "in-person"
}

function mlhUrl(slug) {
  return `https://www.mlh.com/events/${slug}`
}

function toEvent(event, detail) {
  const info = detail || event
  const location = locationParts(info)
  const name = info.name || event.name
  const description = stripHtml(info.description || "")

  return {
    sourceId: source.id,
    sourceEventId: event.id || event.slug,
    name,
    type: /\bideathon\b/i.test(name) ? "ideathon" : "hackathon",
    mode: eventMode(info.formatType || event.formatType),
    start: info.startsAt || event.startsAt,
    end: info.endsAt || event.endsAt,
    city: location.city,
    state: location.state,
    country: location.country,
    venue: info.location || event.location,
    host: info.organization?.name || "Major League Hacking",
    cost: "unknown",
    costLabel: "Not listed",
    themes: [
      ...(info.customFields?.hackathon_focus ||
        event.customFields?.hackathon_focus ||
        []),
      "Student hackathon",
    ],
    url: info.websiteUrl || event.websiteUrl || mlhUrl(event.slug),
    sourceUrl: LIST_URL,
    description: truncate(description, 700),
  }
}

export async function fetchMlh() {
  const html = await fetchText(LIST_URL, { headers: HEADERS, timeout: 15000 })
  const props = inertiaProps(html)
  if (!Array.isArray(props.upcomingEvents)) {
    throw new Error("MLH page no longer exposes upcomingEvents")
  }

  const candidates = props.upcomingEvents.filter((event) => {
    if (!event?.slug || !event.startsAt || event.status === "ended") return false
    const location = locationParts(event)
    if (location.country !== "India") return false
    return isMaharashtra(location.state, location.city)
  })

  const details = await Promise.allSettled(
    candidates.map(async (event) => {
      const detailHtml = await fetchText(mlhUrl(event.slug), {
        headers: HEADERS,
        timeout: 8000,
      })
      const detailProps = inertiaProps(detailHtml)
      return { event, detail: detailProps.event || null }
    })
  )

  const events = []
  for (let index = 0; index < candidates.length; index += 1) {
    const result = details[index]
    const detail = result.status === "fulfilled" ? result.value.detail : null
    events.push(toEvent(candidates[index], detail))
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

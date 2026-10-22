import { fetchText, parseJsonLdEvents, stripHtml } from "../lib/http.mjs"

export const source = {
  id: "cncf-nashik",
  name: "CNCF Nashik",
  url: "https://nashik.cncg.in/",
}

const URLS = [
  "https://nashik.cncg.in/",
  "https://ocgroups.dev/cncf/group/cloud-native-nashik",
]

function attendanceMode(value) {
  if (!value) return "in-person"
  if (value.includes("Online")) return "online"
  if (value.includes("Mixed")) return "hybrid"
  return "in-person"
}

export async function fetchCncfNashik() {
  const pages = await Promise.allSettled(URLS.map((url) => fetchText(url)))
  const events = []
  const seen = new Set()
  let pagesRead = 0

  for (const result of pages) {
    if (result.status !== "fulfilled") continue
    pagesRead += 1
    for (const item of parseJsonLdEvents(result.value)) {
      if (!item.name || !item.startDate) continue
      const key = item.url || `${item.name}:${item.startDate}`
      if (seen.has(key)) continue
      seen.add(key)

      const address = item.location?.address || {}
      const city = address.addressLocality || item.location?.name
      const state = address.addressRegion
      const mode = attendanceMode(
        Array.isArray(item.eventAttendanceMode)
          ? item.eventAttendanceMode.join(" ")
          : item.eventAttendanceMode
      )

      events.push({
        sourceId: source.id,
        sourceEventId: key,
        name: item.name,
        type: "meetup",
        mode,
        start: item.startDate,
        end: item.endDate,
        city,
        state,
        country: address.addressCountry || "India",
        venue: item.location?.name,
        host: item.organizer?.name || "CNCF Nashik",
        cost: "free",
        costLabel: "Free",
        themes: ["Cloud Native", "Kubernetes"],
        url: item.url || source.url,
        sourceUrl: source.url,
        description: stripHtml(item.description || ""),
      })
    }
  }

  if (pagesRead === 0) throw new Error("Both CNCF Nashik pages failed")

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
          ? "No upcoming events in the structured data."
          : `${events.length} structured events.`,
    },
    review: [],
  }
}

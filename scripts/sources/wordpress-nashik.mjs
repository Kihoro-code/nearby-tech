import { fetchText, truncate } from "../lib/http.mjs"
import { parseICSDate } from "../lib/date.mjs"

const ICAL = "https://www.meetup.com/wordpress-meetup-nashik/events/ical/"

export const source = {
  id: "wordpress-nashik",
  name: "WordPress Nashik",
  url: "https://www.meetup.com/wordpress-meetup-nashik/",
}

function unfold(block) {
  return block.replace(/\r?\n[ \t]/g, "")
}

function property(block, name) {
  const match = block.match(new RegExp(`^${name}(?:;[^:]*)?:(.*)$`, "mi"))
  return match ? match[1].trim() : undefined
}

function clean(value = "") {
  return value
    .replace(/\\n/gi, " ")
    .replace(/\\,/g, ",")
    .replace(/\\;/g, ";")
    .replace(/\s+/g, " ")
    .trim()
}

export async function fetchWordpressNashik() {
  const text = await fetchText(ICAL)
  const blocks = [...text.matchAll(/BEGIN:VEVENT\r?\n([\s\S]*?)END:VEVENT/g)]
  if (blocks.length === 0) throw new Error("Meetup ICS contained no VEVENT blocks")

  const events = []
  const seen = new Set()

  for (const match of blocks) {
    const block = unfold(match[1])
    const start = parseICSDate(property(block, "DTSTART"))
    if (!start) continue

    const end =
      parseICSDate(property(block, "DTEND")) ||
      new Date(start.getTime() + 60 * 60 * 1000)
    const url = property(block, "URL")
    const name = clean(property(block, "SUMMARY") || "WordPress Nashik Meetup")
    const key = url || `${name}:${start.toISOString()}`
    if (seen.has(key)) continue
    seen.add(key)

    events.push({
      sourceId: source.id,
      sourceEventId: key,
      name,
      type: "meetup",
      mode: "in-person",
      start: start.toISOString(),
      end: end.toISOString(),
      city: "Nashik",
      state: "Maharashtra",
      country: "India",
      host: "WordPress Nashik",
      cost: "free",
      costLabel: "Free",
      themes: ["WordPress", "Web"],
      url: url || source.url,
      sourceUrl: source.url,
      description: truncate(clean(property(block, "DESCRIPTION")), 700),
    })
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
          ? "No events on the calendar."
          : `${events.length} calendar events.`,
    },
    review: [],
  }
}

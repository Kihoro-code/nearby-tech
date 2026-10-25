import { fetchText, truncate } from "../lib/http.mjs"
import { parseICSDate } from "../lib/date.mjs"
import { inferType } from "../lib/normalize.mjs"

const GROUPS = [
  {
    id: "awsugnsk",
    name: "AWS User Group Nashik",
    page: "https://www.meetup.com/awsugnsk/",
    ical: "https://www.meetup.com/awsugnsk/events/ical/",
    themes: ["AWS", "Cloud"],
  },
  {
    id: "aws-sbg-matoshri",
    name: "AWS SBG at Matoshri College",
    page: "https://www.meetup.com/aws-sbg-at-matoshri-college-of-engg-and-research-centre/",
    ical: "https://www.meetup.com/aws-sbg-at-matoshri-college-of-engg-and-research-centre/events/ical/",
    themes: ["AWS", "Cloud", "Student community"],
  },
  {
    id: "aws-sbg-mvp-kbt",
    name: "AWS SBG at MVP KBT College",
    page: "https://www.meetup.com/aws-sbg-at-mvps-kb-ganpatrao-thakare-college-of-engineering/",
    ical: "https://www.meetup.com/aws-sbg-at-mvps-kb-ganpatrao-thakare-college-of-engineering/events/ical/",
    themes: ["AWS", "Cloud", "Student community"],
  },
]

export const source = {
  id: "meetup-nashik",
  name: "Meetup Nashik",
  url: GROUPS[0].page,
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
    .replace(/\\:/g, ":")
    .replace(/\s+/g, " ")
    .trim()
}

function eventMode(location, description) {
  const text = `${location} ${description}`.toLowerCase()
  if (/\bhybrid\b/.test(text)) return "hybrid"
  if (
    /\b(online|virtual|remote)\b|zoom\.us|meet\.google|teams\.microsoft/.test(
      text
    )
  ) {
    return "online"
  }
  return "in-person"
}

function parseCalendar(text, group) {
  if (!/BEGIN:VCALENDAR/i.test(text)) {
    throw new Error(`${group.name} calendar is not valid ICS`)
  }

  const blocks = [...text.matchAll(/BEGIN:VEVENT\r?\n([\s\S]*?)END:VEVENT/g)]
  const events = []

  for (const match of blocks) {
    const block = unfold(match[1])
    const start = parseICSDate(property(block, "DTSTART"))
    if (!start) continue

    const end =
      parseICSDate(property(block, "DTEND")) ||
      new Date(start.getTime() + 60 * 60 * 1000)
    const url = property(block, "URL")
    const name = clean(property(block, "SUMMARY") || `${group.name} Meetup`)
    const location = clean(property(block, "LOCATION"))
    const description = clean(property(block, "DESCRIPTION"))
    const mode = eventMode(location, description)
    const key = url || `${group.id}:${name}:${start.toISOString()}`

    events.push({
      sourceId: source.id,
      sourceEventId: key,
      name,
      type: inferType(name, "meetup"),
      mode,
      start: start.toISOString(),
      end: end.toISOString(),
      city: mode === "online" ? undefined : "Nashik",
      state: mode === "online" ? undefined : "Maharashtra",
      country: "India",
      venue: location || (mode === "online" ? "Online" : undefined),
      host: group.name,
      cost: "free",
      costLabel: "Free",
      themes: group.themes,
      url: url || group.page,
      sourceUrl: group.page,
      description: truncate(description, 700),
    })
  }

  return events
}

export async function fetchMeetupNashik() {
  const results = await Promise.allSettled(
    GROUPS.map(async (group) => {
      const text = await fetchText(group.ical, { timeout: 15000 })
      return parseCalendar(text, group)
    })
  )

  const events = []
  let calendarsRead = 0
  for (const result of results) {
    if (result.status !== "fulfilled") continue
    calendarsRead += 1
    events.push(...result.value)
  }

  if (calendarsRead === 0) throw new Error("All Meetup Nashik calendars failed")

  const unique = new Map()
  for (const event of events) {
    unique.set(event.sourceEventId, event)
  }

  return {
    events: [...unique.values()],
    health: {
      id: source.id,
      name: source.name,
      url: source.url,
      status: "ok",
      events: unique.size,
      message:
        unique.size === 0
          ? "No events on the Nashik calendars."
          : `${unique.size} calendar events.`,
    },
    review: [],
  }
}

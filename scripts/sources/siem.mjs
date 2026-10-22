import { fetchText, stripHtml } from "../lib/http.mjs"
import { parseDMY } from "../lib/date.mjs"
import { inferType } from "../lib/normalize.mjs"

export const source = {
  id: "siem",
  name: "SIEM / Sandip Foundation",
  url: "https://siem.sandipfoundation.org/computer-engineering/events",
}

export async function fetchSiem() {
  const html = await fetchText(source.url)
  const rows = [...html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)]
  const events = []
  const seen = new Set()

  for (const row of rows) {
    const cells = [...row[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map(
      (cell) => stripHtml(cell[1])
    )
    if (cells.length < 2) continue

    const dateCell = cells.find((cell) => /^\d{2}\/\d{2}\/\d{4}$/.test(cell))
    const date = parseDMY(dateCell)
    if (!date || Number.isNaN(date.getTime())) continue

    const name = cells.find((cell) => cell && cell !== dateCell)
    if (!name) continue

    const link = row[1].match(/<a[^>]*href="([^"]+)"/i)?.[1]
    const key = `${name}:${date.toISOString()}`
    if (seen.has(key)) continue
    seen.add(key)

    events.push({
      sourceId: source.id,
      sourceEventId: key,
      name,
      type: inferType(name, "workshop"),
      mode: "in-person",
      start: date.toISOString(),
      city: "Nashik",
      state: "Maharashtra",
      country: "India",
      host: "SIEM, Sandip Foundation",
      cost: "unknown",
      costLabel: "Not listed",
      themes: ["Sandip Foundation"],
      url: source.url,
      sourceUrl: link || source.url,
      description: name,
    })
  }

  if (rows.length === 0) {
    throw new Error("SIEM events page layout changed; no table rows")
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
          ? "No dated event rows."
          : `${events.length} event rows.`,
    },
    review: [],
  }
}

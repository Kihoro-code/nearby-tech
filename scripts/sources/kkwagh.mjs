import { fetchText, stripHtml } from "../lib/http.mjs"
import { parseLongDate } from "../lib/date.mjs"
import { inferType } from "../lib/normalize.mjs"

export const source = {
  id: "kkwagh",
  name: "K. K. Wagh (KKWIEER)",
  url: "https://www.kkwagh.edu.in/life-at-k-k-wagh/happening/events",
}

export async function fetchKkwagh() {
  // Some college WAFs require browser-like headers.
  const html = await fetchText(source.url, {
    headers: {
      "user-agent":
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
      accept: "text/html,application/xhtml+xml",
    },
  })
  const cards = [
    ...html.matchAll(
      /<a\s+[^>]*href="([^"]*\/events\/[^"]+)"[^>]*>[\s\S]*?<span[^>]*class="[^"]*timing[^"]*"[^>]*>([\s\S]*?)<\/span>[\s\S]*?<span[^>]*class="[^"]*happening-title[^"]*"[^>]*>([\s\S]*?)<\/span>/gi
    ),
  ]

  if (cards.length === 0) {
    throw new Error("KKWIEER events page layout changed; no event cards found")
  }

  const events = []
  const seen = new Set()

  for (const card of cards) {
    const url = new URL(card[1], source.url).toString()
    if (seen.has(url)) continue
    const date = parseLongDate(stripHtml(card[2]))
    if (!date || Number.isNaN(date.getTime())) continue
    const name = stripHtml(card[3])
    if (!name) continue
    seen.add(url)

    events.push({
      sourceId: source.id,
      sourceEventId: url,
      name,
      type: inferType(name, "workshop"),
      mode: "in-person",
      start: date.toISOString(),
      city: "Nashik",
      state: "Maharashtra",
      country: "India",
      host: "K. K. Wagh Institute of Engineering Education & Research",
      cost: "unknown",
      costLabel: "Not listed",
      themes: ["College fest"],
      url,
      sourceUrl: source.url,
      description: name,
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
          ? "No dated events found."
          : `${events.length} college events.`,
    },
    review: [],
  }
}

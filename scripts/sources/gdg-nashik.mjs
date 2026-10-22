import { fetchText, stripHtml, truncate } from "../lib/http.mjs"

export const source = {
  id: "gdg-nashik",
  name: "GDG Nashik",
  url: "https://gdg.community.dev/gdg-nashik/",
}

function collectEventObjects(root) {
  const found = []
  const seen = new Set()
  const walk = (node) => {
    if (Array.isArray(node)) {
      for (const item of node) walk(item)
      return
    }
    if (!node || typeof node !== "object") return
    if (node.start_date && node.title && node.url && !seen.has(node.url)) {
      seen.add(node.url)
      found.push(node)
    }
    for (const value of Object.values(node)) walk(value)
  }
  walk(root)
  return found
}

export async function fetchGdgNashik() {
  const html = await fetchText(source.url)
  const match = html.match(
    /<script[^>]*id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/
  )
  if (!match) throw new Error("GDG Nashik page no longer exposes __NEXT_DATA__")

  const data = JSON.parse(match[1])
  const objects = collectEventObjects(data)

  const events = objects.map((item) => ({
    sourceId: source.id,
    sourceEventId: item.url,
    name: item.title,
    type: "meetup",
    mode: "in-person",
    start: item.start_date,
    end: item.end_date,
    city: "Nashik",
    state: "Maharashtra",
    country: "India",
    host: "GDG Nashik",
    cost: "free",
    costLabel: "Free",
    themes: ["Google", "Community"],
    url: item.url,
    sourceUrl: source.url,
    description: truncate(stripHtml(item.description || ""), 700),
  }))

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
          ? "No events on the chapter page."
          : `${events.length} chapter events.`,
    },
    review: [],
  }
}

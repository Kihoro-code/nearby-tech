import { fetchJson } from "../lib/http.mjs"

const API = "https://api.devfolio.co/api/hackathons"

export const source = {
  id: "devfolio",
  name: "Devfolio",
  url: "https://devfolio.co",
}

async function getPage(filter, page) {
  return fetchJson(`${API}?filter=${filter}&page=${page}`, {
    timeout: 30000,
  })
}

function travelNote(item, rich) {
  if (item.state !== "Maharashtra" || item.city === "Nashik") return undefined
  const description = `${rich?.desc || ""} ${rich?.tagline || ""}`
  if (/\bround\s*1\b[^.]{0,80}\bonline\b/i.test(description)) {
    return "Round 1 online"
  }
  if (/\bonline\b[^.]{0,80}\bround\s*1\b/i.test(description)) {
    return "Round 1 online"
  }
  return "Check if round 1 is online"
}

export async function fetchDevfolio() {
  const open = await getPage("application_open", 1)
  const first = await getPage("all", 1)
  const pages = Math.max(1, Number(first.pages) || 1)
  const all = [...(first.result || [])]

  for (let page = 2; page <= pages; page += 1) {
    const next = await getPage("all", page)
    all.push(...(next.result || []))
  }

  // The open list is richer; the all list is the superset.
  for (let page = 2; page <= Math.max(1, Number(open.pages) || 1); page += 1) {
    const next = await getPage("application_open", page)
    open.result = [...(open.result || []), ...(next.result || [])]
  }

  const richBySlug = new Map(
    (open.result || []).map((item) => [item.slug, item])
  )
  const unique = new Map()
  for (const item of all) {
    if (item?.uuid) unique.set(item.uuid, item)
  }

  const now = Date.now()
  const events = []
  for (const item of unique.values()) {
    if (!item.ends_at) continue
    if (new Date(item.ends_at).getTime() < now) continue
    if (!item.is_online && item.country !== "India") continue

    const rich = richBySlug.get(item.slug)
    const setting = rich?.hackathon_setting || {}
    const pageUrl = `https://${item.slug}.devfolio.co/`
    const mode = setting.is_hybrid
      ? "hybrid"
      : item.is_online
        ? "online"
        : "in-person"

    events.push({
      sourceId: source.id,
      sourceEventId: item.uuid,
      name: item.name,
      type: "hackathon",
      mode,
      start: item.starts_at,
      end: item.ends_at,
      city: item.city,
      state: item.state,
      country: item.country,
      venue: item.location,
      cost: rich ? (setting.paid ? "paid" : "free") : "unknown",
      costLabel: rich ? (setting.paid ? "Paid" : "Free") : "Not listed",
      deadline: setting.reg_ends_at,
      themes: (item.themes || []).map((theme) => theme.name).filter(Boolean),
      url: setting.external_apply_url || pageUrl,
      sourceUrl: pageUrl,
      description: rich?.desc || rich?.tagline,
      travelNote: travelNote(item, rich),
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
          ? "No upcoming India/online hackathons."
          : `${events.length} upcoming hackathons.`,
    },
    review: [],
  }
}

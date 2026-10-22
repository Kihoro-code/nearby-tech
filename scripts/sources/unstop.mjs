import { fetchJson, stripHtml, truncate } from "../lib/http.mjs"

const API =
  "https://unstop.com/api/public/opportunity/search-result?opportunity=hackathons&oppstatus=open"

export const source = {
  id: "unstop",
  name: "Unstop",
  url: "https://unstop.com",
}

function currencySymbol(code) {
  if (code === "fa-dollar") return "$"
  if (code === "fa-euro") return "€"
  return "₹"
}

function prizeLabel(prizes = []) {
  const cash = prizes
    .filter((prize) => Number(prize.cash) > 0)
    .slice(0, 2)
    .map((prize) => {
      const value = Number(prize.cash).toLocaleString("en-IN")
      return `${currencySymbol(prize.currency)}${value}`
    })
  if (cash.length > 0) return cash.join(" · ")
  const rank = prizes.find((prize) => prize.rank)?.rank
  return rank || undefined
}

function travelNote(item) {
  const city = item.address_with_country_logo?.city
  if (item.address_with_country_logo?.state !== "Maharashtra") return undefined
  if (city === "Nashik") return undefined
  const description = stripHtml(item.details || "")
  if (/\bround\s*1\b[^.]{0,100}\bonline\b/i.test(description)) {
    return "Round 1 online"
  }
  return "Check if round 1 is online"
}

function isRelevantHackathon(item) {
  const title = item.title || ""
  if (
    /\b(ctf|capture the flag|competitive programming|cp contest|quiz|math-o|circuit debugging|escape room|puzzle|cybersecurity challenge|spot the vulnerability)\b/i.test(
      title
    )
  ) {
    return false
  }
  if (/\bdesign\b[^.]{0,40}\bcompetition\b/i.test(title)) return false
  return true
}

export async function fetchUnstop() {
  const first = await fetchJson(`${API}&per_page=100&page=1`, {
    timeout: 30000,
  })
  const total = Number(first?.data?.total) || 0
  const items = [...(first?.data?.data || [])]
  const pages = Math.max(1, Math.ceil(total / 100))

  for (let page = 2; page <= pages; page += 1) {
    const next = await fetchJson(`${API}&per_page=100&page=${page}`, {
      timeout: 30000,
    })
    items.push(...(next?.data?.data || []))
  }

  const unique = new Map()
  for (const item of items) {
    if (item?.id) unique.set(item.id, item)
  }

  const now = Date.now()
  const events = []
  const review = []

  for (const item of unique.values()) {
    if (!item.regn_open) continue
    if (item.regnRequirements?.reg_status && item.regnRequirements.reg_status !== "STARTED") {
      continue
    }
    if (!item.end_date) continue
    if (new Date(item.end_date).getTime() < now) continue
    if (!isRelevantHackathon(item)) continue

    const location = item.address_with_country_logo
    const mode =
      item.region === "online"
        ? "online"
        : item.region === "hybrid"
          ? "hybrid"
          : "in-person"

    if (mode !== "online" && !location?.city) {
      review.push({
        id: `unstop:location:${item.id}`,
        sourceId: source.id,
        sourceName: source.name,
        eventName: item.title,
        url: item.seo_url || item.short_url,
        reason: "Offline/hybrid listing has no city, so it cannot be placed.",
        snippet: item.organisation?.name,
        detectedAt: new Date(now).toISOString(),
      })
      continue
    }

    const country = location?.country?.name
    if (mode !== "online" && country && country !== "India") continue

    const themes = [
      ...(item.workfunction || []).map((entry) => entry.name),
      ...(item.tags || []).map((tag) =>
        typeof tag === "string" ? tag : tag?.name
      ),
    ].filter(Boolean)

    const servicesFee = item.payment_services?.[0]?.amount
    const cost = item.isPaid ? "paid" : "free"

    events.push({
      sourceId: source.id,
      sourceEventId: item.id,
      name: item.title,
      type: /\b(ideathon|innovathon)\b/i.test(item.title) ? "ideathon" : "hackathon",
      mode,
      start: item.start_date || item.end_date,
      end: item.end_date,
      city: location?.city,
      state: location?.state,
      country,
      venue: location?.address,
      cost,
      costLabel: item.isPaid
        ? servicesFee
          ? `₹${Number(servicesFee).toLocaleString("en-IN")}`
          : "Paid"
        : "Free",
      host: item.organisation?.name,
      prize: prizeLabel(item.prizes),
      deadline: item.regnRequirements?.end_regn_dt,
      themes,
      url: item.seo_url || item.short_url,
      sourceUrl: item.seo_url || item.short_url,
      description: truncate(stripHtml(item.details || ""), 700),
      travelNote: travelNote(item),
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
          ? "No open hackathons in the feed."
          : `${events.length} open hackathons.`,
    },
    review,
  }
}

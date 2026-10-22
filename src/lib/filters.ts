import { formatMonthYear, monthKey } from "./format"
import type { EventType, TechEvent } from "./types"

export type TypeFilter = "all" | EventType
export type ModeFilter = "all" | "in-person" | "online"
export type CostFilter = "all" | "free"

export interface Filters {
  query: string
  type: TypeFilter
  mode: ModeFilter
  cost: CostFilter
}

export const DEFAULT_FILTERS: Filters = {
  query: "",
  type: "all",
  mode: "all",
  cost: "all",
}

export function hasActiveFilters(filters: Filters): boolean {
  return (
    filters.query.trim() !== "" ||
    filters.type !== "all" ||
    filters.mode !== "all" ||
    filters.cost !== "all"
  )
}

export function matchesFilters(event: TechEvent, filters: Filters): boolean {
  const query = filters.query.trim().toLowerCase()
  if (query) {
    const haystack = [
      event.name,
      event.city,
      event.venue,
      event.host,
      event.state,
      ...(event.themes ?? []),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()

    if (!haystack.includes(query)) return false
  }

  if (filters.type !== "all" && event.type !== filters.type) return false

  if (filters.mode === "in-person" && event.mode === "online") return false
  if (filters.mode === "online" && event.mode === "in-person") return false

  if (filters.cost === "free" && event.cost !== "free") return false

  return true
}

export function applyFilters(
  events: TechEvent[],
  filters: Filters
): TechEvent[] {
  return events.filter((event) => matchesFilters(event, filters))
}

export interface MonthGroup {
  key: string
  label: string
  events: TechEvent[]
}

export function groupByMonth(events: TechEvent[]): MonthGroup[] {
  const groups = new Map<string, MonthGroup>()

  for (const event of events) {
    const key = monthKey(event.start)
    const existing = groups.get(key)
    if (existing) {
      existing.events.push(event)
    } else {
      groups.set(key, {
        key,
        label: formatMonthYear(event.start),
        events: [event],
      })
    }
  }

  return [...groups.values()]
}

export function countByType(events: TechEvent[]): Record<EventType, number> {
  return events.reduce(
    (counts, event) => {
      counts[event.type] += 1
      return counts
    },
    { hackathon: 0, ideathon: 0, meetup: 0, workshop: 0 }
  )
}

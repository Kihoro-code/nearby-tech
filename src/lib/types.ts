export type EventType = "hackathon" | "ideathon" | "meetup" | "workshop"

export type EventMode = "in-person" | "online" | "hybrid"

export type EventLane = "nashik" | "maharashtra" | "online"

export type EventStatus = "active" | "archived" | "delisted" | "closed" | "review"

export type CostType = "free" | "paid" | "unknown"

export type LinkStatus =
  | "ok"
  | "blocked"
  | "source-only"
  | "error"
  | "unchecked"

export interface TechEvent {
  id: string
  name: string
  type: EventType
  mode: EventMode
  lane: EventLane
  start: string
  end?: string
  deadline?: string
  city?: string
  state?: string
  country?: string
  venue?: string
  cost: CostType
  costLabel?: string
  host?: string
  prize?: string
  themes?: string[]
  url: string
  sourceUrl?: string
  sources?: string[]
  sourceIds?: string[]
  description?: string
  travelNote?: string
  firstSeen: string
  lastVerified?: string
  status: EventStatus
  manual?: boolean
  linkStatus?: LinkStatus
  stale?: boolean
  archiveNote?: string
}

export interface EventsFile {
  generatedAt: string
  windowDays: number
  events: TechEvent[]
}

export interface SourceHealth {
  id: string
  name: string
  url: string
  status: "ok" | "error" | "unknown"
  events: number
  rows?: number
  lastChecked?: string | null
  lastSuccess?: string | null
  message?: string
}

export interface SourcesFile {
  generatedAt: string
  sources: SourceHealth[]
}

export interface ReviewItem {
  id: string
  sourceId: string
  sourceName: string
  eventName: string
  url: string
  reason: string
  snippet?: string | null
  detectedAt: string
}

export interface ReviewFile {
  generatedAt: string
  items: ReviewItem[]
}

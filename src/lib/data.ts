import eventsJson from "../../data/events.json"
import reviewJson from "../../data/review.json"
import sourcesJson from "../../data/sources.json"

import type { EventsFile, ReviewFile, SourcesFile, TechEvent } from "./types"

const eventsFile = eventsJson as unknown as EventsFile
const sourcesFile = sourcesJson as unknown as SourcesFile
const reviewFile = reviewJson as unknown as ReviewFile

export const generatedAt = eventsFile.generatedAt
export const windowDays = eventsFile.windowDays
export const allEvents = eventsFile.events
export const activeEvents = allEvents.filter((event) => event.status === "active")
export const archivedEvents = allEvents.filter(
  (event) => event.status === "archived" || event.status === "delisted"
)
export const sources = sourcesFile.sources
export const reviewItems = reviewFile.items

export const eventById = new Map<string, TechEvent>(
  allEvents.map((event) => [event.id, event])
)

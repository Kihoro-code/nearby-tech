import { useEffect, useMemo, useState } from "react"

import type { TechEvent } from "./types"

const LAST_VISIT_KEY = "nearby-tech:last-visit"
const MARK_VISIT_AFTER_MS = 8_000

function readLastVisit(): string | null {
  try {
    return window.localStorage.getItem(LAST_VISIT_KEY)
  } catch {
    return null
  }
}

export function useNewEventIds(events: TechEvent[]): ReadonlySet<string> {
  const [lastVisit] = useState<string | null>(readLastVisit)

  const newIds = useMemo(() => {
    if (!lastVisit) return new Set<string>()
    const cutoff = new Date(lastVisit).getTime()
    if (Number.isNaN(cutoff)) return new Set<string>()

    return new Set(
      events
        .filter((event) => new Date(event.firstSeen).getTime() > cutoff)
        .map((event) => event.id)
    )
  }, [events, lastVisit])

  useEffect(() => {
    const markVisit = () => {
      try {
        window.localStorage.setItem(LAST_VISIT_KEY, new Date().toISOString())
      } catch {
        // Storage can be unavailable in private windows; badges are optional.
      }
    }

    const timeout = window.setTimeout(markVisit, MARK_VISIT_AFTER_MS)
    window.addEventListener("pagehide", markVisit)

    return () => {
      window.clearTimeout(timeout)
      window.removeEventListener("pagehide", markVisit)
    }
  }, [])

  return newIds
}

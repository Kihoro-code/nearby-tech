import { useState } from "react"
import { ChevronDown, ChevronUp } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { groupByMonth } from "@/lib/filters"
import type { TechEvent } from "@/lib/types"
import { EventCard } from "./event-card"

export function LaneSection({
  index,
  title,
  description,
  events,
  newIds,
  onSelect,
  filtered,
  limit,
  emptyMessage,
  accentClass,
}: {
  index: string
  title: string
  description: string
  events: TechEvent[]
  newIds: ReadonlySet<string>
  onSelect: (event: TechEvent) => void
  filtered: boolean
  limit?: number
  emptyMessage: string
  accentClass: string
}) {
  const [expanded, setExpanded] = useState(false)
  const collapsible = typeof limit === "number" && events.length > limit
  const visibleEvents =
    collapsible && !expanded ? events.slice(0, limit) : events
  const groups = groupByMonth(visibleEvents)

  return (
    <section
      aria-labelledby={`lane-${index}`}
      className="scroll-mt-24 pt-8 first:pt-6 sm:pt-10"
    >
      <div className="mb-4 flex items-start justify-between gap-4 border-b border-border/60 pb-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className="mt-1 font-mono text-[11px] text-muted-foreground/70">
            {index}
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span
                className={`size-1.5 shrink-0 rounded-full ${accentClass}`}
                aria-hidden="true"
              />
              <h2
                id={`lane-${index}`}
                className="text-xl font-semibold tracking-[-0.025em] sm:text-2xl"
              >
                {title}
              </h2>
            </div>
            <p className="mt-1 max-w-xl text-xs leading-relaxed text-muted-foreground sm:text-[13px]">
              {description}
            </p>
          </div>
        </div>

        <Badge variant="secondary" className="mt-0.5 shrink-0 tabular-nums">
          {events.length}
        </Badge>
      </div>

      {events.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/80 bg-muted/20 px-4 py-6 text-sm text-muted-foreground">
          {filtered
            ? "Nothing matches these filters here. Try clearing one."
            : emptyMessage}
        </div>
      ) : (
        <>
          {groups.map((group) => (
            <div key={group.key} className="mb-6 last:mb-0">
              <div className="mb-2.5 flex items-center gap-2.5">
                <h3 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  {group.label}
                </h3>
                <span className="h-px flex-1 bg-border/50" aria-hidden="true" />
                <span className="text-[10px] tabular-nums text-muted-foreground/70">
                  {group.events.length}
                </span>
              </div>

              <div className="grid gap-2.5 lg:grid-cols-2">
                {group.events.map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    isNew={newIds.has(event.id)}
                    onSelect={onSelect}
                  />
                ))}
              </div>
            </div>
          ))}

          {collapsible ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setExpanded((value) => !value)}
              className="mt-1 gap-1.5 text-xs"
            >
              {expanded ? (
                <>
                  Show fewer
                  <ChevronUp className="size-3.5" aria-hidden="true" />
                </>
              ) : (
                <>
                  Show all {events.length}
                  <ChevronDown className="size-3.5" aria-hidden="true" />
                </>
              )}
            </Button>
          ) : null}
        </>
      )}
    </section>
  )
}

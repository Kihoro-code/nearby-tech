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
      className="scroll-mt-28 pt-10 first:pt-6 sm:pt-12"
    >
      <div className="mb-5 flex items-start justify-between gap-4 border-b-[3px] border-foreground pb-3">
        <div className="flex min-w-0 items-start gap-3">
          <span
            className={`mt-0.5 grid size-10 shrink-0 place-items-center rounded-lg border-2 border-foreground font-heading text-xs font-extrabold text-ink shadow-brutal-sm ${accentClass}`}
            aria-hidden="true"
          >
            {index}
          </span>
          <div className="min-w-0">
            <h2
              id={`lane-${index}`}
              className="font-heading text-3xl leading-[0.9] font-extrabold uppercase tracking-[-0.04em] sm:text-4xl"
            >
              {title}
            </h2>
            <p className="mt-2 max-w-xl text-xs leading-relaxed font-medium text-muted-foreground sm:text-[13px]">
              {description}
            </p>
          </div>
        </div>

        <Badge
          variant="outline"
          className="mt-0.5 h-9 min-w-9 shrink-0 justify-center rounded-lg border-2 bg-card px-2 font-heading text-base font-extrabold tabular-nums text-foreground"
        >
          {events.length}
        </Badge>
      </div>

      {events.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-foreground bg-card/60 px-4 py-6 text-sm font-medium text-foreground/60 shadow-brutal-sm">
          {filtered
            ? "Nothing matches these filters here. Try clearing one."
            : emptyMessage}
        </div>
      ) : (
        <>
          {groups.map((group) => (
            <div key={group.key} className="mb-7 last:mb-0">
              <div className="mb-3 flex items-center gap-2.5">
                <h3 className="font-heading text-[11px] font-extrabold uppercase tracking-[0.16em]">
                  {group.label}
                </h3>
                <span
                  className="h-[2px] flex-1 bg-foreground/25"
                  aria-hidden="true"
                />
                <span className="rounded border-2 border-foreground bg-card px-1.5 py-0.5 text-[9px] font-bold tabular-nums shadow-[1px_1px_0_var(--ink-shadow)]">
                  {group.events.length}
                </span>
              </div>

              <div className="grid gap-3 lg:grid-cols-2">
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
              className="mt-2 gap-1.5 text-[10px] font-bold uppercase tracking-[0.04em]"
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

import type { KeyboardEvent, ReactNode } from "react"
import {
  ArrowUpRight,
  CalendarClock,
  IndianRupee,
  Info,
  Trophy,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import {
  deadlineLabel,
  deadlineTone,
  formatDay,
  formatMonthShort,
  formatWeekday,
  isOngoing,
} from "@/lib/format"
import type { TechEvent } from "@/lib/types"
import { ModeBadge, NewBadge, TypeBadge } from "./event-badges"

type ChipTone = "default" | "free" | "prize" | "soon" | "closed"

const CHIP_TONES: Record<ChipTone, string> = {
  default: "border-border/60 bg-muted/40 text-muted-foreground",
  free: "border-emerald-300/60 bg-emerald-50 text-emerald-800 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-300",
  prize:
    "border-amber-300/60 bg-amber-50 text-amber-900 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-200",
  soon: "border-rose-300/60 bg-rose-50 text-rose-700 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-300",
  closed: "border-border/60 bg-muted/40 text-muted-foreground",
}

function MetaChip({
  icon: Icon,
  children,
  tone = "default",
}: {
  icon: LucideIcon
  children: ReactNode
  tone?: ChipTone
}) {
  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center gap-1 rounded-md border px-1.5 py-0.5 text-[11px] font-medium",
        CHIP_TONES[tone]
      )}
    >
      <Icon className="size-3 shrink-0" aria-hidden="true" />
      <span className="truncate">{children}</span>
    </span>
  )
}

export function EventCard({
  event,
  isNew,
  onSelect,
}: {
  event: TechEvent
  isNew: boolean
  onSelect: (event: TechEvent) => void
}) {
  const ongoing = isOngoing(event.start, event.end)
  const cardDate = ongoing && event.end ? event.end : event.start
  const isHackathon = event.type === "hackathon" || event.type === "ideathon"
  const showCost = event.cost !== "unknown" || isHackathon

  const handleKeyDown = (keyboardEvent: KeyboardEvent<HTMLDivElement>) => {
    if (keyboardEvent.key === "Enter" || keyboardEvent.key === " ") {
      keyboardEvent.preventDefault()
      onSelect(event)
    }
  }

  return (
    <Card
      role="button"
      tabIndex={0}
      aria-label={`${event.name}, ${formatWeekday(event.start)} ${formatDay(
        event.start
      )} ${formatMonthShort(event.start)}`}
      onClick={() => onSelect(event)}
      onKeyDown={handleKeyDown}
      className="group cursor-pointer gap-0 py-0 shadow-none transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md hover:ring-primary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3.5">
          <div className="flex w-12 shrink-0 flex-col items-center justify-center rounded-xl border border-border/70 bg-muted/40 py-2 sm:w-[3.25rem]">
            <span className="text-[9px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
              {ongoing ? "until" : formatWeekday(cardDate)}
            </span>
            <span className="mt-0.5 text-xl font-semibold leading-none tracking-tight">
              {formatDay(cardDate)}
            </span>
            <span className="mt-1 text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
              {formatMonthShort(cardDate)}
            </span>
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <TypeBadge type={event.type} />
              {isNew ? <NewBadge /> : null}
              <ModeBadge mode={event.mode} className="sm:ml-auto" />
            </div>

            <h3 className="mt-2 line-clamp-2 text-[0.95rem] font-semibold leading-snug tracking-[-0.01em] text-foreground transition-colors group-hover:text-primary">
              {event.name}
            </h3>

            <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
              {[event.host, event.city].filter(Boolean).join(" · ")}
            </p>

            <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
              {event.deadline ? (
                <MetaChip
                  icon={CalendarClock}
                  tone={
                    deadlineTone(event.deadline) === "closed"
                      ? "closed"
                      : deadlineTone(event.deadline) === "soon"
                        ? "soon"
                        : "default"
                  }
                >
                  {deadlineLabel(event.deadline)}
                </MetaChip>
              ) : isHackathon ? (
                <MetaChip icon={CalendarClock}>Deadline not listed</MetaChip>
              ) : null}

              {showCost ? (
                <MetaChip
                  icon={IndianRupee}
                  tone={event.cost === "free" ? "free" : "default"}
                >
                  {event.cost === "free"
                    ? "Free"
                    : event.cost === "unknown"
                      ? "Cost not listed"
                      : event.costLabel || "Paid"}
                </MetaChip>
              ) : null}

              {isHackathon && event.prize ? (
                <MetaChip icon={Trophy} tone="prize">
                  {event.prize}
                </MetaChip>
              ) : null}
            </div>

            {event.travelNote ? (
              <p className="mt-2 flex items-start gap-1 text-[11px] leading-snug text-muted-foreground">
                <Info className="mt-px size-3 shrink-0" aria-hidden="true" />
                <span className="line-clamp-2">{event.travelNote}</span>
              </p>
            ) : null}
          </div>

          <ArrowUpRight
            className="mt-1 size-4 shrink-0 text-muted-foreground/50 transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary"
            aria-hidden="true"
          />
        </div>
      </CardContent>
    </Card>
  )
}

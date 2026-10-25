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
  default: "bg-card text-foreground",
  free: "bg-mint text-ink",
  prize: "bg-sun text-ink",
  soon: "bg-hot text-ink",
  closed: "bg-secondary text-muted-foreground",
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
        "inline-flex max-w-full items-center gap-1 rounded-md border-[1.5px] border-foreground px-1.5 py-1 text-[9px] font-bold uppercase tracking-[0.02em] shadow-[1px_1px_0_var(--ink-shadow)]",
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
      className="group cursor-pointer gap-0 border-2 border-foreground bg-card py-0 shadow-brutal transition-[transform,box-shadow] duration-150 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-brutal-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:translate-x-[1px] active:translate-y-[1px] active:shadow-brutal-sm"
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3.5">
          <div className="flex w-14 shrink-0 flex-col items-center justify-center rounded-lg border-2 border-foreground bg-sun py-2 text-ink shadow-brutal-sm">
            <span className="text-[8px] font-bold uppercase tracking-[0.12em] text-ink/65">
              {ongoing ? "until" : formatWeekday(cardDate)}
            </span>
            <span className="mt-0.5 font-heading text-2xl leading-none font-extrabold tracking-[-0.05em]">
              {formatDay(cardDate)}
            </span>
            <span className="mt-1 text-[9px] font-bold uppercase tracking-[0.14em] text-ink/70">
              {formatMonthShort(cardDate)}
            </span>
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <TypeBadge type={event.type} />
              {isNew ? <NewBadge /> : null}
              <ModeBadge mode={event.mode} className="sm:ml-auto" />
            </div>

            <h3 className="mt-3 line-clamp-2 font-heading text-[1.05rem] leading-[1.1] font-bold tracking-[-0.02em] text-foreground decoration-2 underline-offset-4 group-hover:underline">
              {event.name}
            </h3>

            <p className="mt-1.5 line-clamp-1 text-[10px] font-bold uppercase tracking-[0.04em] text-muted-foreground">
              {[event.host, event.city].filter(Boolean).join(" · ")}
            </p>

            <div className="mt-3 flex flex-wrap items-center gap-1.5">
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
              <p className="mt-2.5 flex items-start gap-1.5 border-l-2 border-foreground/25 pl-2 text-[10px] leading-snug font-medium text-muted-foreground">
                <Info className="mt-px size-3 shrink-0" aria-hidden="true" />
                <span className="line-clamp-2">{event.travelNote}</span>
              </p>
            ) : null}
          </div>

          <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-md border-2 border-foreground bg-card shadow-brutal-sm transition-[transform,background-color,color] group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:bg-primary group-hover:text-primary-foreground">
            <ArrowUpRight className="size-4" aria-hidden="true" />
          </span>
        </div>
      </CardContent>
    </Card>
  )
}

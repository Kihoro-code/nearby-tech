import {
  AlertCircle,
  CalendarClock,
  CheckCircle2,
  Clock3,
  Compass,
  ExternalLink,
  IndianRupee,
  MapPin,
  PenLine,
  Trophy,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import type { ReactNode } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { sources } from "@/lib/data"
import {
  dateKey,
  deadlineLabel,
  formatDateLong,
  formatDateShort,
  formatTime,
  hasKnownTime,
  relativeTime,
} from "@/lib/format"
import type { SourceHealth, TechEvent } from "@/lib/types"
import { ModeBadge, NewBadge, TypeBadge, ArchiveStatusBadge } from "./event-badges"

const LANE_COPY: Record<TechEvent["lane"], string> = {
  nashik:
    "Nashik district, plus roughly 45 minutes of travel. No long trip required.",
  maharashtra: "In Maharashtra. Worth the trip for the right room.",
  online:
    "No travel required. Hackathons from anywhere; meetups and workshops only at IST-friendly hours.",
}

function whenLabel(event: TechEvent): string {
  const startTime = hasKnownTime(event.start) ? formatTime(event.start) : null
  const endTime =
    event.end && hasKnownTime(event.end) ? formatTime(event.end) : null

  if (!event.end) {
    return `${formatDateLong(event.start)}${startTime ? ` · ${startTime}` : ""}`
  }

  if (event.start === event.end) {
    return formatDateLong(event.start)
  }

  if (dateKey(event.start) === dateKey(event.end)) {
    return `${formatDateLong(event.start)}${
      startTime ? ` · ${startTime}` : ""
    }${endTime ? ` – ${endTime}` : ""}`
  }

  return `${formatDateLong(event.start)}${
    startTime ? `, ${startTime}` : ""
  } – ${formatDateLong(event.end)}${endTime ? `, ${endTime}` : ""}`
}

function Fact({
  icon: Icon,
  label,
  children,
}: {
  icon: LucideIcon
  label: string
  children: ReactNode
}) {
  return (
    <div className="flex gap-3">
      <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-md border-2 border-foreground bg-sun text-ink shadow-brutal-sm">
        <Icon className="size-3.5" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <dt className="text-[9px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
          {label}
        </dt>
        <dd className="mt-1 text-sm font-medium leading-relaxed">{children}</dd>
      </div>
    </div>
  )
}

export function EventDetailSheet({
  event,
  open,
  onOpenChange,
  isNew,
}: {
  event: TechEvent | null
  open: boolean
  onOpenChange: (open: boolean) => void
  isNew: boolean
}) {
  if (!event) return null

  const isHackathon = event.type === "hackathon" || event.type === "ideathon"
  const place = [event.venue, event.city, event.state]
    .filter(Boolean)
    .filter((value, index, values) => values.indexOf(value) === index)
    .join(" · ")

  const sourceLinks = [...new Set(event.sources ?? [])]
    .map((id) => sources.find((source) => source.id === id))
    .filter((source): source is SourceHealth => Boolean(source))

  const openLabel = isHackathon ? "Open application" : "View event"
  const linkNote = (() => {
    if (event.linkStatus === "error") return "Event link failed; needs a human check."
    if (event.linkStatus === "source-only") {
      return "Event link did not resolve; the source page did."
    }
    if (event.linkStatus === "blocked") {
      return "The site blocks automated checks, but the URL is valid."
    }
    if (event.linkStatus === "ok" && event.lastVerified) {
      return `Link checked ${relativeTime(event.lastVerified)}.`
    }
    return "Link not checked yet."
  })()

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 p-0 data-[side=right]:w-full data-[side=right]:sm:max-w-lg"
      >
        <div className="min-h-0 flex-1 overflow-y-auto p-5 pb-7">
          <SheetHeader className="gap-3 p-0 pr-9">
            <div className="flex flex-wrap items-center gap-1.5">
              <TypeBadge type={event.type} />
              {isNew ? <NewBadge /> : null}
              <ModeBadge mode={event.mode} />
              {event.manual ? (
                <Badge
                  variant="outline"
                  className="gap-1 bg-card text-muted-foreground"
                >
                  <PenLine aria-hidden="true" />
                  Added by you
                </Badge>
              ) : null}
              {event.status === "archived" ||
              event.status === "delisted" ||
              event.status === "closed" ? (
                <ArchiveStatusBadge status={event.status} />
              ) : null}
            </div>

            <SheetTitle className="text-[1.8rem] leading-[0.95] font-extrabold tracking-[-0.04em] sm:text-3xl">
              {event.name}
            </SheetTitle>

            <SheetDescription className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
              {[event.host, event.city].filter(Boolean).join(" · ")}
            </SheetDescription>
          </SheetHeader>

          <Separator className="my-5" />

          <dl className="grid gap-4">
            <Fact icon={CalendarClock} label="When">
              {whenLabel(event)}
            </Fact>

            <Fact icon={MapPin} label="Where">
              {event.mode === "online"
                ? "Online"
                : place || "Location not listed"}
              {event.mode === "hybrid" ? " · Hybrid" : ""}
            </Fact>

            <Fact icon={IndianRupee} label="Cost">
              {event.cost === "free"
                ? "Free"
                : event.cost === "unknown"
                  ? "Not listed"
                  : event.costLabel || "Paid"}
            </Fact>

            {isHackathon ? (
              <Fact icon={Clock3} label="Registration deadline">
                {event.deadline ? (
                  <span>
                    {formatDateShort(event.deadline)} ·{" "}
                    <span
                      className={cn(
                        deadlineLabel(event.deadline) === "Closed" &&
                          "text-muted-foreground"
                      )}
                    >
                      {deadlineLabel(event.deadline)}
                    </span>
                  </span>
                ) : (
                  "Not listed"
                )}
              </Fact>
            ) : null}

            {isHackathon ? (
              <Fact icon={Trophy} label="Prize">
                {event.prize || "Not listed"}
              </Fact>
            ) : null}
          </dl>

          <div className="mt-6 rounded-xl border-2 border-foreground bg-sun p-3.5 text-ink shadow-brutal-sm">
            <p className="flex items-center gap-1.5 font-heading text-[11px] font-extrabold uppercase tracking-[0.1em]">
              <Compass className="size-3.5" aria-hidden="true" />
              Why it&apos;s here
            </p>
            <p className="mt-1.5 text-xs leading-relaxed font-medium text-ink/75">
              {LANE_COPY[event.lane]}
            </p>
            {event.travelNote ? (
              <p className="mt-1.5 text-xs font-bold text-ink/85">
                {event.travelNote}.
              </p>
            ) : null}
          </div>

          {event.description ? (
            <>
              <Separator className="my-5" />
              <h3 className="font-heading text-[11px] font-extrabold uppercase tracking-[0.14em] text-muted-foreground">
                About
              </h3>
              <p className="mt-2 whitespace-pre-line text-sm leading-relaxed font-medium text-foreground/70">
                {event.description}
              </p>
            </>
          ) : null}

          {event.themes?.length ? (
            <div className="mt-5 flex flex-wrap gap-1.5">
              {event.themes.map((theme) => (
                <Badge key={theme} variant="secondary" className="font-bold">
                  {theme}
                </Badge>
              ))}
            </div>
          ) : null}

          <Separator className="my-5" />

          <div className="flex flex-col gap-2 rounded-lg border-2 border-foreground bg-card p-3 text-[10px] font-medium text-muted-foreground shadow-[1.5px_1.5px_0_var(--ink-shadow)]">
            <p className="flex items-center gap-1.5">
              {event.linkStatus === "error" ||
              event.linkStatus === "source-only" ? (
                <AlertCircle className="size-3.5 text-rose-500" aria-hidden="true" />
              ) : event.linkStatus === "blocked" ? (
                <AlertCircle
                  className="size-3.5 text-amber-600 dark:text-amber-400"
                  aria-hidden="true"
                />
              ) : event.linkStatus === "ok" ? (
                <CheckCircle2
                  className="size-3.5 text-emerald-600 dark:text-emerald-400"
                  aria-hidden="true"
                />
              ) : (
                <Clock3 className="size-3.5" aria-hidden="true" />
              )}
              {linkNote}
            </p>
            {event.stale ? (
              <p className="flex items-center gap-1.5 font-bold text-rose-600 dark:text-rose-400">
                <AlertCircle className="size-3.5" aria-hidden="true" />
                Source is temporarily unavailable; showing last good data.
              </p>
            ) : null}
          </div>

          {sourceLinks.length ? (
            <div className="mt-4">
              <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                Found on
              </p>
              <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1.5">
                {sourceLinks.map((source) => (
                  <a
                    key={source.id}
                    href={source.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-bold underline decoration-2 underline-offset-4 hover:text-primary"
                  >
                    {source.name}
                    <ExternalLink className="size-3" aria-hidden="true" />
                  </a>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        <SheetFooter className="border-t-[3px] border-foreground bg-card p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <Button asChild className="w-full">
            <a href={event.url} target="_blank" rel="noreferrer">
              {openLabel}
              <ExternalLink className="size-3.5" aria-hidden="true" />
            </a>
          </Button>
          {event.sourceUrl && event.sourceUrl !== event.url ? (
            <Button asChild variant="outline" className="w-full">
              <a href={event.sourceUrl} target="_blank" rel="noreferrer">
                View source page
              </a>
            </Button>
          ) : null}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

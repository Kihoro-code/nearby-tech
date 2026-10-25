import {
  AlertTriangle,
  Archive,
  CheckCircle2,
  Database,
  ExternalLink,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"

import { ArchiveStatusBadge } from "@/components/event-badges"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import { formatDateShort, relativeTime } from "@/lib/format"
import type { ReviewItem, SourceHealth, TechEvent } from "@/lib/types"

export type StatusTab = "sources" | "review" | "past"

const STATUS_META = {
  ok: {
    label: "Healthy",
    dot: "bg-emerald-500",
    badge: "bg-mint text-ink",
  },
  error: {
    label: "Failed",
    dot: "bg-rose-500",
    badge: "bg-hot text-ink",
  },
  unknown: {
    label: "Unknown",
    dot: "bg-amber-500",
    badge: "bg-sun text-ink",
  },
} as const

function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon
  title: string
  description: string
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-foreground bg-card/60 px-5 py-10 text-center shadow-brutal-sm">
      <Icon className="size-6 text-foreground/45" aria-hidden="true" />
      <p className="mt-2 font-heading text-sm font-extrabold uppercase tracking-[0.02em]">
        {title}
      </p>
      <p className="mt-1 max-w-sm text-xs leading-relaxed font-medium text-muted-foreground">
        {description}
      </p>
    </div>
  )
}

function SourceRow({ source }: { source: SourceHealth }) {
  const meta = STATUS_META[source.status]

  return (
    <div className="flex gap-3 rounded-xl border-2 border-foreground bg-card p-3 shadow-[2px_2px_0_var(--ink-shadow)]">
      <span
        className={cn(
          "mt-1.5 size-2.5 shrink-0 rounded-full border-2 border-foreground",
          meta.dot
        )}
        aria-hidden="true"
      />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
          <div className="min-w-0">
            {source.url ? (
              <a
                href={source.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 font-heading text-sm font-extrabold underline-offset-4 hover:underline"
              >
                {source.name}
                <ExternalLink
                  className="size-3 text-foreground/45"
                  aria-hidden="true"
                />
              </a>
            ) : (
              <span className="font-heading text-sm font-extrabold">
                {source.name}
              </span>
            )}
          </div>
          <span
            className={cn(
              "rounded border-2 border-foreground px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-[0.08em] shadow-[1px_1px_0_var(--ink-shadow)]",
              meta.badge
            )}
          >
            {meta.label}
          </span>
        </div>

        <p className="mt-1 text-xs leading-relaxed font-medium text-muted-foreground">
          {source.message || "No status message."}
        </p>

        <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[9px] font-bold uppercase tracking-[0.03em] text-muted-foreground/80">
          <span>
            {source.events} active
            {typeof source.rows === "number" ? ` · ${source.rows} scanned` : ""}
          </span>
          <span aria-hidden="true">·</span>
          <span>
            {source.lastChecked
              ? `Checked ${relativeTime(source.lastChecked)}`
              : "Not checked yet"}
          </span>
          {source.status === "error" && source.lastSuccess ? (
            <>
              <span aria-hidden="true">·</span>
              <span>
                Last successful check {relativeTime(source.lastSuccess)}
              </span>
            </>
          ) : null}
        </div>
      </div>
    </div>
  )
}

function ReviewRow({
  item,
  sourceName,
}: {
  item: ReviewItem
  sourceName: string
}) {
  return (
    <div className="rounded-xl border-2 border-foreground bg-card p-3 shadow-[2px_2px_0_var(--ink-shadow)]">
      <div className="flex flex-wrap items-center gap-1.5">
        <Badge variant="outline" className="gap-1 bg-hot text-ink">
          {sourceName}
        </Badge>
        <span className="text-[9px] font-bold uppercase tracking-[0.04em] text-muted-foreground/80">
          Detected {relativeTime(item.detectedAt)}
        </span>
      </div>
      <p className="mt-2 font-heading text-sm leading-tight font-extrabold">
        {item.eventName}
      </p>
      <p className="mt-1 text-xs leading-relaxed font-medium text-muted-foreground">
        {item.reason}
      </p>
      {item.url ? (
        <a
          href={item.url}
          target="_blank"
          rel="noreferrer"
          className="mt-2 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.04em] underline decoration-2 underline-offset-4 hover:text-primary"
        >
          Open page
          <ExternalLink className="size-3" aria-hidden="true" />
        </a>
      ) : null}
    </div>
  )
}

export function StatusDialog({
  open,
  onOpenChange,
  tab,
  onTabChange,
  sources,
  reviewItems,
  archivedEvents,
  onSelect,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  tab: StatusTab
  onTabChange: (tab: StatusTab) => void
  sources: SourceHealth[]
  reviewItems: ReviewItem[]
  archivedEvents: TechEvent[]
  onSelect: (event: TechEvent) => void
}) {
  const healthy = sources.filter((source) => source.status === "ok").length
  const failed = sources.filter((source) => source.status === "error")
  const failedWithEvents = failed.filter((source) => source.events > 0)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] w-full max-w-2xl flex-col gap-0 overflow-hidden p-0">
        <div className="px-5 pt-5 pr-12 pb-3">
          <DialogHeader>
            <DialogTitle className="font-heading text-2xl font-extrabold uppercase tracking-[-0.03em]">
              Radar status
            </DialogTitle>
            <DialogDescription>
              Source health, parser review, and events that have left the radar.
            </DialogDescription>
          </DialogHeader>
        </div>

        <Tabs
          value={tab}
          onValueChange={(value) => onTabChange(value as StatusTab)}
          className="flex min-h-0 flex-1 flex-col gap-0"
        >
          <div className="px-5">
            <TabsList className="w-full">
              <TabsTrigger value="sources">
                <Database aria-hidden="true" />
                Sources
              </TabsTrigger>
              <TabsTrigger value="review">
                <AlertTriangle aria-hidden="true" />
                Review
                {reviewItems.length ? (
                  <span className="rounded-sm border-2 border-foreground bg-sun px-1 text-[9px] font-bold tabular-nums text-ink">
                    {reviewItems.length}
                  </span>
                ) : null}
              </TabsTrigger>
              <TabsTrigger value="past">
                <Archive aria-hidden="true" />
                Archive
                {archivedEvents.length ? (
                  <span className="rounded-sm border-2 border-foreground bg-card px-1 text-[9px] font-bold tabular-nums text-foreground">
                    {archivedEvents.length}
                  </span>
                ) : null}
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
            <TabsContent value="sources" className="mt-0">
              <div className="mb-3 rounded-xl border-2 border-foreground bg-sun p-3 text-ink shadow-brutal-sm">
                <p className="flex items-center gap-2 font-heading text-sm font-extrabold uppercase tracking-[0.02em]">
                  <span
                    className={cn(
                      "size-2.5 rounded-full border-2 border-ink",
                      failedWithEvents.length
                        ? "bg-rose-500"
                        : failed.length
                          ? "bg-amber-500"
                          : "bg-emerald-500"
                    )}
                    aria-hidden="true"
                  />
                  {healthy}/{sources.length} sources healthy
                </p>
                <p className="mt-1 text-xs leading-relaxed font-medium text-ink/70">
                  {failed.length
                    ? failedWithEvents.length
                      ? `${failedWithEvents.length} source${
                          failedWithEvents.length === 1 ? "" : "s"
                        } failed on the last refresh, so their last good events are still on the page.`
                      : failed.length === 1
                        ? "A source couldn't be reached on the last refresh. It has no upcoming events to show right now."
                        : "Some sources couldn't be reached on the last refresh. They have no upcoming events to show right now."
                    : "Every source responded on the last refresh. Links are re-checked on each run."}
                </p>
              </div>

              <div className="flex flex-col gap-2">
                {sources.map((source) => (
                  <SourceRow key={source.id} source={source} />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="review" className="mt-0">
              <p className="mb-3 text-xs leading-relaxed font-medium text-muted-foreground">
                Pages the parsers could not read. Nothing is guessed here — the
                event stays out until the source or parser is fixed.
              </p>
              {reviewItems.length ? (
                <div className="flex flex-col gap-2">
                  {reviewItems.map((item) => (
                    <ReviewRow
                      key={item.id}
                      item={item}
                      sourceName={
                        sources.find((source) => source.id === item.sourceId)
                          ?.name || item.sourceName
                      }
                    />
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={CheckCircle2}
                  title="Nothing needs review"
                  description="Every page the radar read was understood. New failures will show up here after a refresh."
                />
              )}
            </TabsContent>

            <TabsContent value="past" className="mt-0">
              <p className="mb-3 text-xs leading-relaxed font-medium text-muted-foreground">
                Past, closed, and delisted events stay here for a year, so you
                can still find a page you meant to open.
              </p>
              {archivedEvents.length ? (
                <div className="flex flex-col gap-2">
                  {archivedEvents.map((event) => (
                    <button
                      key={event.id}
                      type="button"
                      onClick={() => {
                        onSelect(event)
                        onOpenChange(false)
                      }}
                      className="flex w-full items-start gap-3 rounded-lg border-2 border-foreground bg-card px-3 py-2.5 text-left shadow-[2px_2px_0_var(--ink-shadow)] transition-[transform,box-shadow,background-color] hover:-translate-y-0.5 hover:bg-secondary hover:shadow-brutal-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                    >
                      <span className="w-14 shrink-0 pt-0.5 font-heading text-[10px] font-extrabold uppercase tracking-[0.04em] text-muted-foreground">
                        {formatDateShort(event.start)}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="line-clamp-1 text-xs font-bold">
                          {event.name}
                        </span>
                        <span className="mt-1 flex flex-wrap items-center gap-1.5">
                          <ArchiveStatusBadge
                            status={
                              event.status === "delisted"
                                ? "delisted"
                                : event.status === "closed"
                                  ? "closed"
                                  : "archived"
                            }
                          />
                          <span className="text-[9px] font-bold uppercase tracking-[0.03em] text-muted-foreground/80">
                            {event.archiveNote || "Past event"}
                          </span>
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={Archive}
                  title="Nothing in the archive yet"
                  description="Events land here when they pass, close, or disappear from their source. For now, the radar is all ahead of you."
                />
              )}
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

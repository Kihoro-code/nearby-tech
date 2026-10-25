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
    text: "text-emerald-700 dark:text-emerald-300",
  },
  error: {
    label: "Failed",
    dot: "bg-rose-500",
    text: "text-rose-700 dark:text-rose-300",
  },
  unknown: {
    label: "Unknown",
    dot: "bg-amber-500",
    text: "text-amber-700 dark:text-amber-300",
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
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/80 bg-muted/20 px-5 py-10 text-center">
      <Icon className="size-5 text-muted-foreground/70" aria-hidden="true" />
      <p className="mt-2 text-sm font-medium">{title}</p>
      <p className="mt-1 max-w-sm text-xs leading-relaxed text-muted-foreground">
        {description}
      </p>
    </div>
  )
}

function SourceRow({ source }: { source: SourceHealth }) {
  const meta = STATUS_META[source.status]

  return (
    <div className="flex gap-3 rounded-xl border border-border/70 bg-card p-3">
      <span
        className={cn("mt-1.5 size-2 shrink-0 rounded-full", meta.dot)}
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
                className="inline-flex items-center gap-1 text-sm font-medium underline-offset-4 hover:underline"
              >
                {source.name}
                <ExternalLink className="size-3 text-muted-foreground" aria-hidden="true" />
              </a>
            ) : (
              <span className="text-sm font-medium">{source.name}</span>
            )}
          </div>
          <span className={cn("text-[10px] font-medium uppercase tracking-[0.1em]", meta.text)}>
            {meta.label}
          </span>
        </div>

        <p className="mt-0.5 text-xs text-muted-foreground">
          {source.message || "No status message."}
        </p>

        <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] text-muted-foreground/80">
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
    <div className="rounded-xl border border-amber-300/60 bg-amber-50/60 p-3 dark:border-amber-400/20 dark:bg-amber-400/[0.06]">
      <div className="flex flex-wrap items-center gap-1.5">
        <Badge variant="outline" className="border-amber-300/60 bg-background/60 text-[10px] text-amber-900 dark:border-amber-400/20 dark:text-amber-200">
          {sourceName}
        </Badge>
        <span className="text-[10px] text-muted-foreground">
          Detected {relativeTime(item.detectedAt)}
        </span>
      </div>
      <p className="mt-1.5 text-sm font-medium leading-snug">{item.eventName}</p>
      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
        {item.reason}
      </p>
      {item.url ? (
        <a
          href={item.url}
          target="_blank"
          rel="noreferrer"
          className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium text-foreground underline-offset-4 hover:underline"
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
            <DialogTitle className="text-base">Radar status</DialogTitle>
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
                  <span className="rounded-full bg-amber-500/15 px-1.5 text-[10px] tabular-nums text-amber-800 dark:text-amber-200">
                    {reviewItems.length}
                  </span>
                ) : null}
              </TabsTrigger>
              <TabsTrigger value="past">
                <Archive aria-hidden="true" />
                Archive
                {archivedEvents.length ? (
                  <span className="rounded-full bg-muted px-1.5 text-[10px] tabular-nums text-muted-foreground">
                    {archivedEvents.length}
                  </span>
                ) : null}
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
            <TabsContent value="sources" className="mt-0">
              <div className="mb-3 rounded-xl border border-border/70 bg-muted/30 p-3">
                <p className="flex items-center gap-2 text-sm font-medium">
                  <span
                    className={cn(
                      "size-2 rounded-full",
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
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
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
              <p className="mb-3 text-xs leading-relaxed text-muted-foreground">
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
              <p className="mb-3 text-xs leading-relaxed text-muted-foreground">
                Past, closed, and delisted events stay here for a year, so you
                can still find a page you meant to open.
              </p>
              {archivedEvents.length ? (
                <div className="flex flex-col gap-1.5">
                  {archivedEvents.map((event) => (
                    <button
                      key={event.id}
                      type="button"
                      onClick={() => {
                        onSelect(event)
                        onOpenChange(false)
                      }}
                      className="flex w-full items-start gap-3 rounded-lg border border-border/60 bg-card px-3 py-2.5 text-left transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <span className="w-12 shrink-0 pt-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                        {formatDateShort(event.start)}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="line-clamp-1 text-xs font-medium">
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
                          <span className="text-[10px] text-muted-foreground">
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

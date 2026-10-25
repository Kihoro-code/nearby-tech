import { AlertTriangle, Archive, Database, Radar } from "lucide-react"

import { Button } from "@/components/ui/button"
import { generatedAt, windowDays } from "@/lib/data"
import { relativeTime } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { SourceHealth } from "@/lib/types"
import type { StatusTab } from "./status-dialog"

export function SiteFooter({
  sources,
  reviewCount,
  archivedCount,
  onOpenStatus,
}: {
  sources: SourceHealth[]
  reviewCount: number
  archivedCount: number
  onOpenStatus: (tab: StatusTab) => void
}) {
  const healthy = sources.filter((source) => source.status === "ok").length
  const impactfulErrors = sources.filter(
    (source) => source.status === "error" && source.events > 0
  ).length
  const quietErrors = sources.some(
    (source) => source.status === "error" && source.events === 0
  )

  return (
    <footer className="mt-14 border-t border-border/60 bg-muted/20">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="grid size-7 place-items-center rounded-lg bg-primary text-primary-foreground">
                <Radar className="size-4" aria-hidden="true" />
              </span>
              <span className="text-sm font-semibold tracking-tight">
                Nearby Tech
              </span>
            </div>
            <p className="mt-2 max-w-sm text-xs leading-relaxed text-muted-foreground">
              A personal radar, refreshed daily at 07:00 IST. No accounts, no
              feeds, no noise — just things worth showing up for.
            </p>
            <p className="mt-1.5 text-[10px] text-muted-foreground/70">
              Updated {relativeTime(generatedAt)} · {windowDays}-day window
            </p>
          </div>

          <div className="flex flex-wrap items-start gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenStatus("sources")}
              className="gap-1.5 bg-background/60 text-xs"
            >
              <Database className="size-3.5" aria-hidden="true" />
              Source health
              <span
                className={cn(
                  "ml-0.5 size-1.5 rounded-full",
                  impactfulErrors
                    ? "bg-rose-500"
                    : quietErrors
                      ? "bg-amber-500"
                      : "bg-emerald-500"
                )}
                aria-label={`${healthy} of ${sources.length} sources healthy`}
              />
            </Button>

            {reviewCount ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onOpenStatus("review")}
                className="gap-1.5 border-amber-300/70 bg-amber-50/60 text-xs text-amber-900 dark:border-amber-400/25 dark:bg-amber-400/[0.08] dark:text-amber-200"
              >
                <AlertTriangle className="size-3.5" aria-hidden="true" />
                Review
                <span className="tabular-nums">{reviewCount}</span>
              </Button>
            ) : null}

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onOpenStatus("past")}
              className="gap-1.5 text-xs text-muted-foreground"
            >
              <Archive className="size-3.5" aria-hidden="true" />
              Archive
              <span className="tabular-nums">{archivedCount}</span>
            </Button>
          </div>
        </div>

        <div className="mt-7 flex flex-col gap-2 border-t border-border/60 pt-4 text-[10px] text-muted-foreground/80 sm:flex-row sm:items-center sm:justify-between">
          <p>
            Built for one person with too many tabs. Manual additions live in{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-[10px]">
              data/manual.json
            </code>
            .
          </p>
          <p>Nashik · Maharashtra · Online</p>
        </div>
      </div>
    </footer>
  )
}

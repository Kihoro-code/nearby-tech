import { AlertTriangle, Archive, Database, Radar } from "lucide-react"
import type { ReactNode } from "react"

import { generatedAt, windowDays } from "@/lib/data"
import { relativeTime } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { SourceHealth } from "@/lib/types"
import type { StatusTab } from "./status-dialog"

function FooterButton({
  onClick,
  children,
  tone = "outline",
}: {
  onClick: () => void
  children: ReactNode
  tone?: "outline" | "solid" | "quiet"
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex h-8 items-center gap-1.5 rounded-md border-2 border-[#fff7e6] px-3 text-[10px] font-bold uppercase tracking-[0.04em] transition-[transform,box-shadow,background-color,color] hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffd84d] focus-visible:ring-offset-2 focus-visible:ring-offset-[#15120f] active:translate-y-[1px] active:shadow-none",
        tone === "solid" &&
          "bg-[#fff7e6] text-ink shadow-[2px_2px_0_#ff4f87]",
        tone === "outline" &&
          "bg-transparent text-[#fff7e6] shadow-[2px_2px_0_#ffd84d] hover:bg-[#fff7e6] hover:text-ink",
        tone === "quiet" &&
          "border-transparent bg-transparent text-[#fff7e6]/65 shadow-none hover:border-[#fff7e6] hover:text-[#fff7e6]"
      )}
    >
      {children}
    </button>
  )
}

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
    <footer className="mt-16 border-t-[3px] border-foreground bg-ink text-[#fff7e6]">
      <div className="mx-auto max-w-6xl px-4 py-9 sm:px-6">
        <div className="flex flex-col gap-7 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="grid size-9 place-items-center rounded-lg border-2 border-[#fff7e6] bg-sun text-ink shadow-[2px_2px_0_#ff4f87]">
                <Radar className="size-4" aria-hidden="true" />
              </span>
              <span className="font-heading text-base font-extrabold tracking-[-0.02em]">
                Nearby Tech
              </span>
              <span className="rounded-sm border-2 border-[#fff7e6]/40 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-[0.14em] text-[#fff7e6]/65">
                Est. for one
              </span>
            </div>
            <p className="mt-3 max-w-sm text-xs leading-relaxed font-medium text-[#fff7e6]/65">
              A personal radar, refreshed daily at 07:00 IST. No accounts, no
              feeds, no noise — just things worth showing up for.
            </p>
            <p className="mt-2 text-[9px] font-bold uppercase tracking-[0.08em] text-[#fff7e6]/55">
              Updated {relativeTime(generatedAt)} · {windowDays}-day window
            </p>
          </div>

          <div className="flex flex-wrap items-start gap-2">
            <FooterButton
              tone="solid"
              onClick={() => onOpenStatus("sources")}
            >
              <Database className="size-3.5" aria-hidden="true" />
              Source health
              <span
                className={cn(
                  "ml-0.5 size-2 rounded-full border border-ink",
                  impactfulErrors
                    ? "bg-rose-500"
                    : quietErrors
                      ? "bg-amber-500"
                      : "bg-emerald-500"
                )}
                aria-label={`${healthy} of ${sources.length} sources healthy`}
              />
            </FooterButton>

            {reviewCount ? (
              <FooterButton
                tone="outline"
                onClick={() => onOpenStatus("review")}
              >
                <AlertTriangle className="size-3.5" aria-hidden="true" />
                Review
                <span className="rounded-sm border border-[#fff7e6]/40 bg-[#fff7e6]/10 px-1 tabular-nums">
                  {reviewCount}
                </span>
              </FooterButton>
            ) : null}

            <FooterButton
              tone="quiet"
              onClick={() => onOpenStatus("past")}
            >
              <Archive className="size-3.5" aria-hidden="true" />
              Archive
              <span className="tabular-nums">{archivedCount}</span>
            </FooterButton>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-2 border-t-2 border-[#fff7e6]/20 pt-4 text-[9px] font-bold uppercase tracking-[0.05em] text-[#fff7e6]/55 sm:flex-row sm:items-center sm:justify-between">
          <p>
            Built for one person with too many tabs. Manual additions live in{" "}
            <code className="rounded-sm border border-[#fff7e6]/30 bg-[#fff7e6] px-1.5 py-0.5 font-mono text-[9px] normal-case tracking-normal text-ink">
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

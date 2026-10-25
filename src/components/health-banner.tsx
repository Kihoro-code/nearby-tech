import { AlertTriangle } from "lucide-react"

import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { ReviewItem, SourceHealth } from "@/lib/types"
import type { StatusTab } from "./status-dialog"

export function HealthBanner({
  sources,
  reviewItems,
  onOpenStatus,
}: {
  sources: SourceHealth[]
  reviewItems: ReviewItem[]
  onOpenStatus: (tab: StatusTab) => void
}) {
  const failed = sources.filter((source) => source.status === "error")
  const healthy = sources.filter((source) => source.status === "ok").length
  // A source with no active events has no last-good data to protect. Keep it
  // visible in Source health, but don't put a banner above the radar for it.
  const impactful = failed.filter((source) => source.events > 0)
  const showSourceFailure =
    impactful.length > 0 || (failed.length > 0 && healthy === 0)

  if (!showSourceFailure && !reviewItems.length) return null

  const hasFailure = showSourceFailure
  const title = hasFailure
    ? healthy === 0
      ? "All sources are down — showing the last saved radar"
      : `${failed.length} source${
          failed.length === 1 ? "" : "s"
        } down — last good data is still showing`
    : `${reviewItems.length} page${reviewItems.length === 1 ? "" : "s"} need a human look`
  const description = hasFailure
    ? healthy === 0
      ? "No source responded on the last refresh. The page is using the last saved data."
      : `The rest of the radar refreshed normally. ${
          reviewItems.length
            ? `${reviewItems.length} parser item${
                reviewItems.length === 1 ? "" : "s"
              } also need review.`
            : ""
        }`
    : "A source page changed in a way the parser did not understand. Nothing was guessed."

  return (
    <Alert
      className={cn(
        "mt-4 text-ink",
        hasFailure ? "bg-hot" : "bg-sun"
      )}
    >
      <AlertTriangle aria-hidden="true" />
      <AlertTitle className="text-[15px] leading-tight">{title}</AlertTitle>
      <AlertDescription className="text-xs font-medium text-ink/70">
        {description}
      </AlertDescription>
      <AlertAction>
        <Button
          type="button"
          variant="outline"
          size="xs"
          onClick={() => onOpenStatus(hasFailure ? "sources" : "review")}
          className="h-8 border-foreground bg-card px-2.5 text-[9px] font-bold uppercase tracking-[0.04em] text-foreground hover:bg-secondary"
        >
          Open status
        </Button>
      </AlertAction>
    </Alert>
  )
}

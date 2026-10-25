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

  const shownFailures = impactful.length > 0 ? impactful : failed
  const hasFailure = showSourceFailure
  const title = hasFailure
    ? healthy === 0
      ? "All sources are down — showing the last saved radar"
      : `${shownFailures.length} source${
          shownFailures.length === 1 ? "" : "s"
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
        "mt-4",
        hasFailure
          ? "border-rose-300/70 bg-rose-50/70 text-rose-950 dark:border-rose-400/25 dark:bg-rose-400/[0.07] dark:text-rose-100"
          : "border-amber-300/70 bg-amber-50/70 text-amber-950 dark:border-amber-400/25 dark:bg-amber-400/[0.07] dark:text-amber-100"
      )}
    >
      <AlertTriangle aria-hidden="true" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription
        className={cn(
          hasFailure
            ? "text-rose-800/80 dark:text-rose-200/80"
            : "text-amber-800/80 dark:text-amber-200/80"
        )}
      >
        {description}
      </AlertDescription>
      <AlertAction>
        <Button
          type="button"
          variant="outline"
          size="xs"
          onClick={() => onOpenStatus(hasFailure ? "sources" : "review")}
          className="border-current/20 bg-background/60 text-current hover:bg-background/90"
        >
          Open status
        </Button>
      </AlertAction>
    </Alert>
  )
}

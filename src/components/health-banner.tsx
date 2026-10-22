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
  if (!failed.length && !reviewItems.length) return null

  const hasFailure = failed.length > 0
  const title = hasFailure
    ? `${failed.length} source${failed.length === 1 ? "" : "s"} down — last good data is still showing`
    : `${reviewItems.length} page${reviewItems.length === 1 ? "" : "s"} need a human look`
  const description = hasFailure
    ? `The rest of the radar refreshed normally. ${
        reviewItems.length
          ? `${reviewItems.length} parser item${reviewItems.length === 1 ? "" : "s"} also need review.`
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

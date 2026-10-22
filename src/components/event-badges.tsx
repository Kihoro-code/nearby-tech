import {
  Archive,
  Code2,
  EyeOff,
  Globe,
  Lightbulb,
  MapPin,
  Sparkles,
  Users,
  Video,
  Wrench,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { EventMode, EventType } from "@/lib/types"

interface TypeMeta {
  label: string
  icon: LucideIcon
  className: string
}

const TYPE_META: Record<EventType, TypeMeta> = {
  hackathon: {
    label: "Hackathon",
    icon: Code2,
    className:
      "border-amber-300/80 bg-amber-100/80 text-amber-950 dark:border-amber-400/30 dark:bg-amber-400/15 dark:text-amber-200",
  },
  ideathon: {
    label: "Ideathon",
    icon: Lightbulb,
    className:
      "border-rose-300/80 bg-rose-100/80 text-rose-950 dark:border-rose-400/30 dark:bg-rose-400/15 dark:text-rose-200",
  },
  meetup: {
    label: "Meetup",
    icon: Users,
    className:
      "border-teal-300/80 bg-teal-100/80 text-teal-950 dark:border-teal-400/30 dark:bg-teal-400/15 dark:text-teal-200",
  },
  workshop: {
    label: "Workshop",
    icon: Wrench,
    className:
      "border-sky-300/80 bg-sky-100/80 text-sky-950 dark:border-sky-400/30 dark:bg-sky-400/15 dark:text-sky-200",
  },
}

const MODE_META: Record<
  EventMode,
  { label: string; icon: LucideIcon }
> = {
  "in-person": { label: "In person", icon: MapPin },
  online: { label: "Online", icon: Video },
  hybrid: { label: "Hybrid", icon: Globe },
}

export function TypeBadge({
  type,
  className,
}: {
  type: EventType
  className?: string
}) {
  const meta = TYPE_META[type]
  const Icon = meta.icon

  return (
    <Badge
      variant="outline"
      className={cn("gap-1 border px-2 py-0.5 font-medium", meta.className, className)}
    >
      <Icon aria-hidden="true" />
      {meta.label}
    </Badge>
  )
}

export function ModeBadge({
  mode,
  className,
}: {
  mode: EventMode
  className?: string
}) {
  const meta = MODE_META[mode]
  const Icon = meta.icon

  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-1 border-border/70 bg-background/60 px-2 py-0.5 text-muted-foreground",
        className
      )}
    >
      <Icon aria-hidden="true" />
      {meta.label}
    </Badge>
  )
}

export function NewBadge({ className }: { className?: string }) {
  return (
    <Badge
      className={cn(
        "gap-1 border-transparent bg-primary px-2 py-0.5 text-primary-foreground",
        className
      )}
    >
      <Sparkles aria-hidden="true" />
      New
    </Badge>
  )
}

export function ArchiveStatusBadge({
  status,
  className,
}: {
  status: "archived" | "delisted"
  className?: string
}) {
  const archived = status === "archived"
  const Icon = archived ? Archive : EyeOff

  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-1 px-2 py-0.5 text-muted-foreground",
        archived
          ? "border-border/70 bg-muted/50"
          : "border-amber-300/60 bg-amber-50 text-amber-900 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-200",
        className
      )}
    >
      <Icon aria-hidden="true" />
      {archived ? "Past" : "Delisted"}
    </Badge>
  )
}

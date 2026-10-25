import {
  Archive,
  Ban,
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
    className: "border-foreground bg-sun text-ink",
  },
  ideathon: {
    label: "Ideathon",
    icon: Lightbulb,
    className: "border-foreground bg-hot text-ink",
  },
  meetup: {
    label: "Meetup",
    icon: Users,
    className: "border-foreground bg-mint text-ink",
  },
  workshop: {
    label: "Workshop",
    icon: Wrench,
    className: "border-foreground bg-sky text-ink",
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
      className={cn("gap-1", meta.className, className)}
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
      className={cn("gap-1 bg-card text-foreground", className)}
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
        "-rotate-2 gap-1 border-foreground bg-sun px-2 text-ink shadow-brutal-sm",
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
  status: "archived" | "delisted" | "closed"
  className?: string
}) {
  const archived = status === "archived"
  const closed = status === "closed"
  const Icon = archived ? Archive : closed ? Ban : EyeOff

  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-1",
        archived || closed
          ? "border-foreground bg-secondary text-muted-foreground"
          : "border-foreground bg-hot text-ink",
        className
      )}
    >
      <Icon aria-hidden="true" />
      {archived ? "Past" : closed ? "Closed" : "Delisted"}
    </Badge>
  )
}

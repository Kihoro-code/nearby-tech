import { CircleDollarSign, Search, X } from "lucide-react"
import type { ReactNode } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import {
  DEFAULT_FILTERS,
  hasActiveFilters,
  type Filters,
  type ModeFilter,
  type TypeFilter,
} from "@/lib/filters"

const TYPE_OPTIONS: { value: TypeFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "hackathon", label: "Hackathons" },
  { value: "ideathon", label: "Ideathons" },
  { value: "meetup", label: "Meetups" },
  { value: "workshop", label: "Workshops" },
]

const MODE_OPTIONS: { value: ModeFilter; label: string }[] = [
  { value: "all", label: "Anywhere" },
  { value: "in-person", label: "In person" },
  { value: "online", label: "Online" },
]

function FilterPill({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <Button
      type="button"
      size="xs"
      variant={active ? "default" : "outline"}
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "h-7 shrink-0 rounded-full px-2.5 text-[11px] font-medium",
        !active && "border-border/70 bg-background/60 text-muted-foreground"
      )}
    >
      {children}
    </Button>
  )
}

export function FilterBar({
  filters,
  onChange,
  resultCount,
  totalCount,
}: {
  filters: Filters
  onChange: (filters: Filters) => void
  resultCount: number
  totalCount: number
}) {
  const active = hasActiveFilters(filters)

  return (
    <section className="sticky top-0 z-30 -mx-4 border-b border-border/60 bg-background/85 px-4 py-3 shadow-sm backdrop-blur-md sm:mx-0 sm:rounded-2xl sm:border sm:px-3">
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center gap-2">
          <div className="relative min-w-0 flex-1">
            <Search
              className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              type="search"
              value={filters.query}
              onChange={(changeEvent) =>
                onChange({ ...filters, query: changeEvent.target.value })
              }
              placeholder="Search events, cities, hosts…"
              aria-label="Search events"
              className="h-9 bg-background pr-8 pl-8 text-sm [&::-webkit-search-cancel-button]:hidden"
            />
            {filters.query ? (
              <button
                type="button"
                onClick={() => onChange({ ...filters, query: "" })}
                aria-label="Clear search"
                className="absolute top-1/2 right-2 grid size-5 -translate-y-1/2 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <X className="size-3" aria-hidden="true" />
              </button>
            ) : null}
          </div>

          <Button
            type="button"
            size="sm"
            variant={filters.cost === "free" ? "default" : "outline"}
            aria-pressed={filters.cost === "free"}
            onClick={() =>
              onChange({
                ...filters,
                cost: filters.cost === "free" ? "all" : "free",
              })
            }
            className={cn(
              "h-9 shrink-0 gap-1.5 rounded-lg px-2.5 text-xs",
              filters.cost !== "free" &&
                "border-border/70 bg-background text-muted-foreground"
            )}
          >
            <CircleDollarSign className="size-3.5" aria-hidden="true" />
            Free only
          </Button>

          {active ? (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => onChange(DEFAULT_FILTERS)}
              className="h-9 shrink-0 px-2 text-xs text-muted-foreground"
            >
              Reset
            </Button>
          ) : null}
        </div>

        <div className="relative">
          <div className="filter-scroll -mx-1 flex items-center gap-1 overflow-x-auto px-1 pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <span className="shrink-0 pr-1 text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
              Type
            </span>
            {TYPE_OPTIONS.map((option) => (
              <FilterPill
                key={option.value}
                active={filters.type === option.value}
                onClick={() => onChange({ ...filters, type: option.value })}
              >
                {option.label}
              </FilterPill>
            ))}

            <span className="mx-1 h-4 w-px shrink-0 bg-border/70" />

            <span className="shrink-0 pr-1 text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
              Where
            </span>
            {MODE_OPTIONS.map((option) => (
              <FilterPill
                key={option.value}
                active={filters.mode === option.value}
                onClick={() => onChange({ ...filters, mode: option.value })}
              >
                {option.label}
              </FilterPill>
            ))}

            <span className="ml-auto hidden shrink-0 pl-3 text-[11px] text-muted-foreground sm:block">
              {resultCount} of {totalCount}
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}

import { CircleDollarSign, Search, X } from "lucide-react"
import type { ReactNode } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
      className="h-8 shrink-0 rounded-md px-2.5 text-[10px] font-bold uppercase tracking-[0.03em]"
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
    <section className="sticky top-0 z-30 -mx-4 border-y-2 border-foreground bg-card px-4 py-3 sm:mx-0 sm:rounded-2xl sm:border-2 sm:px-3 sm:shadow-brutal">
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center gap-2">
          <div className="relative min-w-0 flex-1">
            <Search
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-foreground/60"
              aria-hidden="true"
            />
            <Input
              id="event-search"
              name="event-search"
              type="search"
              value={filters.query}
              onChange={(changeEvent) =>
                onChange({ ...filters, query: changeEvent.target.value })
              }
              placeholder="Search events, cities, hosts…"
              aria-label="Search events"
              className="h-10 pr-9 pl-10 text-sm [&::-webkit-search-cancel-button]:hidden"
            />
            {filters.query ? (
              <button
                type="button"
                onClick={() => onChange({ ...filters, query: "" })}
                aria-label="Clear search"
                className="absolute top-1/2 right-2 grid size-6 -translate-y-1/2 place-items-center rounded-md border-2 border-transparent text-foreground/60 transition-colors hover:border-foreground hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <X className="size-3.5" aria-hidden="true" />
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
            className="h-10 shrink-0 gap-1.5 rounded-lg px-2.5 text-[10px] font-bold uppercase tracking-[0.03em]"
          >
            <CircleDollarSign className="size-3.5" aria-hidden="true" />
            Free only
          </Button>

          <span className="hidden shrink-0 rounded-md border-2 border-foreground bg-foreground px-2 py-1 text-[9px] font-bold uppercase tracking-[0.08em] text-background sm:block">
            {resultCount} of {totalCount}
          </span>

          {active ? (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => onChange(DEFAULT_FILTERS)}
              className="h-10 shrink-0 px-2 text-[10px] font-bold uppercase tracking-[0.04em] text-foreground/60"
            >
              Reset
            </Button>
          ) : null}
        </div>

        <div className="relative">
          <div className="filter-scroll -mx-1 flex items-center gap-1.5 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <span className="shrink-0 pr-0.5 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
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

            <span
              className="mx-1 h-5 w-[2px] shrink-0 bg-foreground/25"
              aria-hidden="true"
            />

            <span className="shrink-0 pr-0.5 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
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
          </div>
        </div>
      </div>
    </section>
  )
}

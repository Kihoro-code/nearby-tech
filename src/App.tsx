import { useMemo, useState } from "react"

import { EventDetailSheet } from "@/components/event-detail-sheet"
import { FilterBar } from "@/components/filter-bar"
import { HealthBanner } from "@/components/health-banner"
import { LaneSection } from "@/components/lane-section"
import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"
import { StatusDialog, type StatusTab } from "@/components/status-dialog"
import {
  activeEvents,
  archivedEvents,
  reviewItems,
  sources,
} from "@/lib/data"
import {
  applyFilters,
  DEFAULT_FILTERS,
  hasActiveFilters,
  type Filters,
} from "@/lib/filters"
import { useNewEventIds } from "@/lib/use-new-events"
import { useTheme } from "@/lib/use-theme"
import type { TechEvent } from "@/lib/types"

export default function App() {
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS)
  const [selectedEvent, setSelectedEvent] = useState<TechEvent | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [statusOpen, setStatusOpen] = useState(false)
  const [statusTab, setStatusTab] = useState<StatusTab>("sources")

  const newIds = useNewEventIds(activeEvents)
  const filtered = hasActiveFilters(filters)
  const { theme, toggleTheme } = useTheme()

  const filteredEvents = useMemo(
    () => applyFilters(activeEvents, filters),
    [filters]
  )

  const lanes = useMemo(
    () => ({
      nashik: filteredEvents.filter((event) => event.lane === "nashik"),
      maharashtra: filteredEvents.filter(
        (event) => event.lane === "maharashtra"
      ),
      online: filteredEvents.filter((event) => event.lane === "online"),
    }),
    [filteredEvents]
  )

  const nashikCount = activeEvents.filter(
    (event) => event.lane === "nashik"
  ).length
  const onlineCount = activeEvents.filter(
    (event) => event.lane === "online"
  ).length

  const openStatus = (tab: StatusTab) => {
    setStatusTab(tab)
    setStatusOpen(true)
  }

  const openEvent = (event: TechEvent) => {
    setSelectedEvent(event)
    setDetailOpen(true)
  }

  return (
    <div id="top" className="min-h-screen">
      <SiteHeader
        upcoming={activeEvents.length}
        nashik={nashikCount}
        online={onlineCount}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      <main className="mx-auto max-w-6xl px-4 pt-4 pb-4 sm:px-6 sm:pt-5">
        <FilterBar
          filters={filters}
          onChange={setFilters}
          resultCount={filteredEvents.length}
          totalCount={activeEvents.length}
        />

        <HealthBanner
          sources={sources}
          reviewItems={reviewItems}
          onOpenStatus={openStatus}
        />

        <div id="radar" className="scroll-mt-24">
          <div className="flex flex-wrap items-center justify-between gap-2 pt-6">
            <p className="text-[11px] text-muted-foreground">
              Hackathons and ideathons first, then meetups and workshops.
              Grouped by month, across the next 90 days.
            </p>
            <p className="text-[11px] text-muted-foreground/70">
              {filtered ? `${filteredEvents.length} matching` : "All lanes"}
            </p>
          </div>

          <LaneSection
            index="01"
            title="Nashik"
            description="Nashik district and about 45 minutes around it. The easy yes."
            events={lanes.nashik}
            newIds={newIds}
            onSelect={openEvent}
            filtered={filtered}
            emptyMessage="No local events in the next 90 days. The watchlist is still running."
            accentClass="bg-emerald-500"
          />

          <LaneSection
            index="02"
            title="Maharashtra"
            description="Across the state. Worth the trip when round 1 is online."
            events={lanes.maharashtra}
            newIds={newIds}
            onSelect={openEvent}
            filtered={filtered}
            emptyMessage="No Maharashtra hackathons in the window right now."
            accentClass="bg-amber-500"
          />

          <LaneSection
            index="03"
            title="Online"
            description="Hackathons from anywhere, plus meetups and workshops at IST-friendly hours."
            events={lanes.online}
            newIds={newIds}
            onSelect={openEvent}
            filtered={filtered}
            limit={12}
            emptyMessage="Nothing online in the window right now."
            accentClass="bg-sky-500"
          />
        </div>
      </main>

      <SiteFooter
        sources={sources}
        reviewCount={reviewItems.length}
        archivedCount={archivedEvents.length}
        onOpenStatus={openStatus}
      />

      <EventDetailSheet
        event={selectedEvent}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        isNew={selectedEvent ? newIds.has(selectedEvent.id) : false}
      />

      <StatusDialog
        open={statusOpen}
        onOpenChange={setStatusOpen}
        tab={statusTab}
        onTabChange={setStatusTab}
        sources={sources}
        reviewItems={reviewItems}
        archivedEvents={archivedEvents}
        onSelect={openEvent}
      />
    </div>
  )
}

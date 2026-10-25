import { ArrowDown, Globe, MapPin, Moon, Radar, Sun } from "lucide-react"
import type { LucideIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { generatedAt } from "@/lib/data"
import { relativeTime } from "@/lib/format"
import type { Theme } from "@/lib/theme"

function Stat({
  value,
  label,
  icon: Icon,
  iconClass,
}: {
  value: number
  label: string
  icon: LucideIcon
  iconClass: string
}) {
  return (
    <div className="min-w-0 px-2.5 first:pl-0 last:pr-0">
      <Icon className={`size-4 ${iconClass}`} aria-hidden="true" />
      <span className="mt-2 block font-heading text-3xl leading-none font-extrabold tabular-nums tracking-[-0.05em] sm:text-4xl">
        {value}
      </span>
      <span className="mt-1 block text-[9px] font-bold uppercase leading-tight tracking-[0.12em] text-muted-foreground">
        {label}
      </span>
    </div>
  )
}

export function SiteHeader({
  upcoming,
  nashik,
  online,
  theme,
  onToggleTheme,
}: {
  upcoming: number
  nashik: number
  online: number
  theme: Theme
  onToggleTheme: () => void
}) {
  return (
    <header className="relative overflow-hidden border-b-[3px] border-foreground bg-background">
      <div
        className="pointer-events-none absolute -top-24 -left-28 size-72 rounded-full bg-hot sm:size-96 lg:size-[28rem]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -right-32 -bottom-36 size-80 rounded-[42%_58%_61%_39%/45%_38%_62%_55%] bg-grape sm:size-[26rem]"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex items-center justify-between gap-3 py-5">
          <a
            href="#top"
            className="flex min-w-0 items-center gap-3 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 focus-visible:ring-offset-background"
            aria-label="Nearby Tech, back to top"
          >
            <span className="grid size-11 shrink-0 place-items-center rounded-xl border-2 border-foreground bg-foreground text-background shadow-brutal-sm">
              <Radar className="size-5" aria-hidden="true" />
            </span>
            <span className="flex min-w-0 flex-col items-start leading-none">
              <span className="font-heading text-lg font-extrabold tracking-[-0.03em]">
                Nearby Tech
              </span>
              <span className="mt-1 inline-block -rotate-2 border-2 border-foreground bg-card px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-[0.18em] shadow-[1.5px_1.5px_0_var(--ink-shadow)]">
                Nashik radar
              </span>
            </span>
          </a>

          <div className="flex shrink-0 items-center gap-2 text-[9px] font-bold uppercase tracking-[0.08em]">
            <span className="hidden items-center gap-1 rounded-md border-2 border-foreground bg-card px-2 py-1.5 shadow-brutal-sm sm:inline-flex">
              <MapPin className="size-3" aria-hidden="true" />
              Nashik, MH
            </span>
            <span className="flex items-center gap-1.5 rounded-md border-2 border-foreground bg-card px-2 py-1.5 shadow-brutal-sm">
              <span
                className="size-2 rounded-full border border-foreground bg-emerald-500"
                aria-hidden="true"
              />
              <span className="hidden min-[380px]:inline">Updated&nbsp;</span>
              {relativeTime(generatedAt)}
            </span>
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              onClick={onToggleTheme}
              aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
              title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
              className="bg-card"
            >
              {theme === "dark" ? (
                <Sun className="size-3.5" aria-hidden="true" />
              ) : (
                <Moon className="size-3.5" aria-hidden="true" />
              )}
            </Button>
          </div>
        </div>

        <div className="grid gap-10 pt-8 pb-12 sm:pt-10 sm:pb-16 lg:grid-cols-[1.35fr_0.85fr] lg:items-end lg:gap-12">
          <div className="min-w-0">
            <p className="inline-flex -rotate-1 items-center border-2 border-foreground bg-foreground px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.18em] text-background shadow-brutal-sm">
              A personal radar for people who build
            </p>
            <h1 className="mt-5 max-w-3xl text-[clamp(2.7rem,8vw,5.75rem)] leading-[0.9] font-extrabold tracking-[-0.055em]">
              The good stuff,
              <br />
              <span className="mt-2 inline-block border-2 border-foreground bg-primary px-2.5 pb-1 text-primary-foreground shadow-brutal [box-decoration-break:clone]">
                within reach.
              </span>
            </h1>
            <p className="mt-6 max-w-xl text-sm font-medium leading-relaxed text-foreground/75 sm:text-base">
              Hackathons, ideathons, meetups, and workshops around Nashik,
              across Maharashtra, and online — checked daily so you can stop
              refreshing five tabs.
            </p>
          </div>

          <div className="relative min-w-0 lg:mb-2">
            <div className="rounded-2xl border-[3px] border-foreground bg-card p-4 shadow-brutal-lg sm:rotate-[1deg] sm:p-5">
              <div className="flex items-center justify-between gap-3 border-b-2 border-foreground pb-3">
                <span className="font-heading text-sm font-extrabold uppercase tracking-[0.1em]">
                  Radar snapshot
                </span>
                <span className="rounded-md border-2 border-foreground bg-sun px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-[0.1em] text-ink shadow-[1.5px_1.5px_0_var(--ink-shadow)]">
                  Live
                </span>
              </div>
              <div className="mt-3 grid grid-cols-3 divide-x-2 divide-foreground">
                <Stat
                  value={upcoming}
                  label="Upcoming"
                  icon={Radar}
                  iconClass="text-hot"
                />
                <Stat
                  value={nashik}
                  label="In Nashik"
                  icon={MapPin}
                  iconClass="text-emerald-600 dark:text-emerald-400"
                />
                <Stat
                  value={online}
                  label="Online"
                  icon={Globe}
                  iconClass="text-grape dark:text-[#b9a2ff]"
                />
              </div>
              <Button
                asChild
                className="mt-4 w-full bg-foreground text-background hover:bg-foreground/90"
              >
                <a href="#radar">
                  Browse the radar
                  <ArrowDown className="size-4" aria-hidden="true" />
                </a>
              </Button>
            </div>
            <span className="absolute -top-3 right-2 -rotate-3 border-2 border-foreground bg-sun px-2 py-1 text-[8px] font-bold uppercase tracking-[0.12em] text-ink shadow-brutal-sm sm:right-4">
              No feeds. No noise.
            </span>
          </div>
        </div>
      </div>
    </header>
  )
}

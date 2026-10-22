import { ArrowDown, MapPin, Moon, Radar, Sun } from "lucide-react"

import { Button } from "@/components/ui/button"
import { generatedAt } from "@/lib/data"
import { relativeTime } from "@/lib/format"
import type { Theme } from "@/lib/theme"

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="inline-flex items-baseline gap-1.5 rounded-full border border-border/70 bg-background/60 px-3 py-1.5 backdrop-blur-sm">
      <span className="text-sm font-semibold tabular-nums tracking-tight">
        {value}
      </span>
      <span className="text-[11px] text-muted-foreground">{label}</span>
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
    <header className="relative overflow-hidden border-b border-border/60">
      <div className="hero-grid pointer-events-none absolute inset-0" aria-hidden="true" />
      <div
        className="pointer-events-none absolute -top-32 right-[-10%] size-[28rem] rounded-full bg-primary/10 blur-3xl"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex items-center justify-between py-5">
          <a
            href="#top"
            className="flex items-center gap-2.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Nearby Tech, back to top"
          >
            <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <Radar className="size-[18px]" aria-hidden="true" />
            </span>
            <span className="flex flex-col leading-none">
              <span className="text-sm font-semibold tracking-[-0.01em]">
                Nearby Tech
              </span>
              <span className="mt-1 text-[9px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                Nashik radar
              </span>
            </span>
          </a>

          <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
            <span className="hidden items-center gap-1 sm:inline-flex">
              <MapPin className="size-3" aria-hidden="true" />
              Nashik, MH
            </span>
            <span className="hidden h-3 w-px bg-border sm:block" aria-hidden="true" />
            <span className="flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
              Updated {relativeTime(generatedAt)}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={onToggleTheme}
              aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
              title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
              className="-mr-1 rounded-full text-muted-foreground hover:text-foreground"
            >
              {theme === "dark" ? (
                <Sun className="size-3.5" aria-hidden="true" />
              ) : (
                <Moon className="size-3.5" aria-hidden="true" />
              )}
            </Button>
          </div>
        </div>

        <div className="max-w-3xl pt-6 pb-10 sm:pt-9 sm:pb-14">
          <p className="eyebrow">A personal radar for people who build</p>
          <h1 className="mt-4 text-balance text-4xl leading-[1.02] font-semibold tracking-[-0.045em] sm:text-6xl">
            The good stuff,
            <br />
            <span className="text-primary">within reach.</span>
          </h1>
          <p className="mt-5 max-w-xl text-pretty text-sm leading-relaxed text-muted-foreground sm:text-base">
            Hackathons, ideathons, meetups, and workshops around Nashik, across
            Maharashtra, and online — checked daily so you can stop refreshing
            five tabs.
          </p>

          <div className="mt-7 flex flex-wrap items-center gap-2">
            <Stat value={upcoming} label="upcoming" />
            <Stat value={nashik} label="in Nashik" />
            <Stat value={online} label="online" />
            <a
              href="#radar"
              className="ml-1 inline-flex items-center gap-1 rounded-full px-2 py-1.5 text-[11px] font-medium text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
            >
              Browse the radar
              <ArrowDown className="size-3" aria-hidden="true" />
            </a>
          </div>
        </div>
      </div>
    </header>
  )
}

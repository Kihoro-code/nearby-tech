const IST = "Asia/Kolkata"
const DAY_MS = 86_400_000

interface IstParts {
  year: string
  month: string
  day: string
}

function istParts(iso: string): IstParts {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: IST,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(iso))

  return {
    year: parts.find((part) => part.type === "year")?.value ?? "0000",
    month: parts.find((part) => part.type === "month")?.value ?? "00",
    day: parts.find((part) => part.type === "day")?.value ?? "00",
  }
}

function formatter(
  options: Intl.DateTimeFormatOptions,
  locale = "en-IN"
) {
  return new Intl.DateTimeFormat(locale, { timeZone: IST, ...options })
}

const shortMonth = formatter({ month: "short" })
const longMonth = formatter({ month: "long" })
const monthYear = formatter({ month: "long", year: "numeric" })
const weekday = formatter({ weekday: "short" })
const longWeekday = formatter({ weekday: "long" })
const time = formatter({ hour: "numeric", minute: "2-digit", hour12: true })

export function dateKey(iso: string): string {
  const { year, month, day } = istParts(iso)
  return `${year}-${month}-${day}`
}

export function monthKey(iso: string): string {
  const { year, month } = istParts(iso)
  return `${year}-${month}`
}

export function formatDay(iso: string): string {
  return String(Number(istParts(iso).day))
}

export function formatMonthShort(iso: string): string {
  return shortMonth.format(new Date(iso)).toUpperCase()
}

export function formatMonthLong(iso: string): string {
  return longMonth.format(new Date(iso))
}

export function formatMonthYear(iso: string): string {
  return monthYear.format(new Date(iso))
}

export function formatWeekday(iso: string): string {
  return weekday.format(new Date(iso))
}

export function formatWeekdayLong(iso: string): string {
  return longWeekday.format(new Date(iso))
}

export function formatTime(iso: string): string {
  return time.format(new Date(iso)).replace(" ", "\u00a0")
}

export function hasKnownTime(iso: string): boolean {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: IST,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date(iso))

  const hour = parts.find((part) => part.type === "hour")?.value
  const minute = parts.find((part) => part.type === "minute")?.value
  return !(hour === "00" && minute === "00")
}

export function formatDateShort(iso: string): string {
  const parts = istParts(iso)
  const now = istParts(new Date().toISOString())
  const month = shortMonth.format(new Date(iso))
  return parts.year === now.year
    ? `${Number(parts.day)} ${month}`
    : `${Number(parts.day)} ${month} ${parts.year}`
}

export function formatDateLong(iso: string): string {
  const parts = istParts(iso)
  return `${longWeekday.format(new Date(iso))}, ${Number(parts.day)} ${longMonth.format(
    new Date(iso)
  )} ${parts.year}`
}

export function formatDateRange(start: string, end?: string): string {
  if (!end) return formatDateShort(start)
  const from = istParts(start)
  const to = istParts(end)

  if (from.year !== to.year) {
    return `${Number(from.day)} ${shortMonth.format(new Date(start))} ${
      from.year
    } – ${Number(to.day)} ${shortMonth.format(new Date(end))} ${to.year}`
  }
  if (from.month !== to.month) {
    return `${Number(from.day)} ${shortMonth.format(
      new Date(start)
    )} – ${Number(to.day)} ${shortMonth.format(new Date(end))}`
  }
  if (from.day !== to.day) {
    return `${Number(from.day)}–${Number(to.day)} ${shortMonth.format(
      new Date(start)
    )}`
  }
  return formatDateShort(start)
}

export function isOngoing(start: string, end?: string): boolean {
  if (!end) return false
  const now = Date.now()
  return new Date(start).getTime() <= now && new Date(end).getTime() >= now
}

export function displayDate(event: { start: string; end?: string }): string {
  return isOngoing(event.start, event.end) && event.end ? event.end : event.start
}

export function isToday(iso: string): boolean {
  return dateKey(iso) === dateKey(new Date().toISOString())
}

export function isTomorrow(iso: string): boolean {
  return dateKey(iso) === dateKey(new Date(Date.now() + DAY_MS).toISOString())
}

export function relativeTime(iso: string): string {
  const diff = Math.max(0, Date.now() - new Date(iso).getTime())
  const minutes = Math.floor(diff / 60_000)
  if (minutes < 1) return "just now"
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return formatDateShort(iso)
}

export function deadlineLabel(deadline: string): string {
  if (new Date(deadline).getTime() < Date.now()) return "Closed"
  if (isToday(deadline)) return "Closes today"
  if (isTomorrow(deadline)) return "Closes tomorrow"

  const days = Math.max(
    2,
    Math.ceil((new Date(deadline).getTime() - Date.now()) / DAY_MS)
  )
  return `Closes in ${days} days`
}

export function deadlineTone(deadline: string): "closed" | "soon" | "normal" {
  if (new Date(deadline).getTime() < Date.now()) return "closed"
  if (new Date(deadline).getTime() - Date.now() <= 3 * DAY_MS) return "soon"
  return "normal"
}

export function eventDateLabel(event: {
  start: string
  end?: string
}): string | null {
  if (isOngoing(event.start, event.end) && event.end) {
    return `Until ${formatDateShort(event.end)}`
  }
  if (isToday(event.start)) return "Today"
  if (isTomorrow(event.start)) return "Tomorrow"
  return null
}

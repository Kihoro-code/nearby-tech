export const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000

const pad = (n) => String(n).padStart(2, "0")

export function istParts(date = new Date()) {
  const source = date instanceof Date ? date : new Date(date)
  const d = new Date(source.getTime() + IST_OFFSET_MS)
  return {
    year: d.getUTCFullYear(),
    month: d.getUTCMonth() + 1,
    day: d.getUTCDate(),
    hour: d.getUTCHours(),
    minute: d.getUTCMinutes(),
  }
}

export function istDateKey(date) {
  const p = istParts(date)
  return `${p.year}-${pad(p.month)}-${pad(p.day)}`
}

export function startOfTodayIST() {
  const p = istParts()
  return new Date(Date.UTC(p.year, p.month - 1, p.day) - IST_OFFSET_MS)
}

export function addDays(date, days) {
  return new Date(date.getTime() + days * 86400000)
}

export function toISO(value) {
  if (!value) return undefined
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return undefined
  return date.toISOString()
}

const MONTHS = {
  jan: 0,
  january: 0,
  feb: 1,
  february: 1,
  mar: 2,
  march: 2,
  apr: 3,
  april: 3,
  may: 4,
  jun: 5,
  june: 5,
  jul: 6,
  july: 6,
  aug: 7,
  august: 7,
  sep: 8,
  sept: 8,
  september: 8,
  oct: 9,
  october: 9,
  nov: 10,
  november: 10,
  dec: 11,
  december: 11,
}

// "April 18, 2026" / "18 April 2026" / "Sep 15, 2026"
export function parseLongDate(value) {
  if (!value) return undefined
  const text = String(value).replace(/\s+/g, " ").trim()
  let match = text.match(/([A-Za-z]+)\s+(\d{1,2}),?\s+(\d{4})/)
  let monthName
  let day
  let year
  if (match) {
    monthName = match[1].toLowerCase()
    day = Number(match[2])
    year = Number(match[3])
  } else {
    match = text.match(/(\d{1,2})\s+([A-Za-z]+),?\s+(\d{4})/)
    if (!match) return undefined
    day = Number(match[1])
    monthName = match[2].toLowerCase()
    year = Number(match[3])
  }
  const month = MONTHS[monthName]
  if (month === undefined) return undefined
  return new Date(Date.UTC(year, month, day, 0, 0, 0) - IST_OFFSET_MS)
}

// "18/04/2026" (day/month/year)
export function parseDMY(value) {
  if (!value) return undefined
  const match = String(value).match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/)
  if (!match) return undefined
  const day = Number(match[1])
  const month = Number(match[2]) - 1
  const year = Number(match[3])
  return new Date(Date.UTC(year, month, day, 0, 0, 0) - IST_OFFSET_MS)
}

// "20261024T190000" with a TZID of Asia/Kolkata (IST assumed)
export function parseICSDate(value) {
  if (!value) return undefined
  const match = String(value).match(/(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})/)
  if (!match) return undefined
  const [, year, month, day, hour, minute, second] = match
  return new Date(
    `${year}-${month}-${day}T${hour}:${minute}:${second}+05:30`
  )
}

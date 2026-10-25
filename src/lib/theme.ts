export type Theme = "light" | "dark"

const THEME_KEY = "nearby-tech:theme"

export function hasStoredTheme(): boolean {
  try {
    const stored = window.localStorage.getItem(THEME_KEY)
    return stored === "light" || stored === "dark"
  } catch {
    return false
  }
}

export function getPreferredTheme(): Theme {
  try {
    const stored = window.localStorage.getItem(THEME_KEY)
    if (stored === "light" || stored === "dark") return stored
  } catch {
    // Fall through to the system preference.
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light"
}

export function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle("dark", theme === "dark")
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", theme === "dark" ? "#17121f" : "#ffd84d")
}

export function storeTheme(theme: Theme) {
  try {
    window.localStorage.setItem(THEME_KEY, theme)
  } catch {
    // Storage can be unavailable in private windows; the toggle still works.
  }
}

import { useCallback, useEffect, useState } from "react"

import {
  applyTheme,
  getPreferredTheme,
  hasStoredTheme,
  storeTheme,
  type Theme,
} from "./theme"

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(getPreferredTheme)
  const [followsSystem, setFollowsSystem] = useState(() => !hasStoredTheme())

  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  useEffect(() => {
    if (!followsSystem) return

    const media = window.matchMedia("(prefers-color-scheme: dark)")
    const handleChange = () => {
      const next: Theme = media.matches ? "dark" : "light"
      applyTheme(next)
      setTheme(next)
    }

    media.addEventListener("change", handleChange)
    return () => media.removeEventListener("change", handleChange)
  }, [followsSystem])

  const toggleTheme = useCallback(() => {
    const next: Theme = theme === "dark" ? "light" : "dark"
    setFollowsSystem(false)
    setTheme(next)
    applyTheme(next)
    storeTheme(next)
  }, [theme])

  return { theme, followsSystem, toggleTheme }
}

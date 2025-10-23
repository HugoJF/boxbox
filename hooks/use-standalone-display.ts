import { useEffect, useState } from "react"

export function useStandaloneDisplay() {
  const [isStandalone, setIsStandalone] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined") {
      return
    }

    const mediaQuery = window.matchMedia("(display-mode: standalone)")

    const updateStandalone = () => {
      const isIosStandalone = (window.navigator as any).standalone === true
      setIsStandalone(isIosStandalone || mediaQuery.matches)
    }

    updateStandalone()

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", updateStandalone)
    } else if ((mediaQuery as any).addListener) {
      ;(mediaQuery as any).addListener(updateStandalone)
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener("change", updateStandalone)
      } else if ((mediaQuery as any).removeListener) {
        ;(mediaQuery as any).removeListener(updateStandalone)
      }
    }
  }, [])

  return isStandalone
}

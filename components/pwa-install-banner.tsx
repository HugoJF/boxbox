"use client"

import { useEffect, useState } from "react"
import { Download, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useStandaloneDisplay } from "@/hooks/use-standalone-display"

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>
}

export function PWAInstallBanner() {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null)
  const isStandalone = useStandaloneDisplay()
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined") {
      return
    }

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault()
      setInstallEvent(event as BeforeInstallPromptEvent)
      setIsVisible(true)
    }

    const handleAppInstalled = () => {
      setInstallEvent(null)
      setIsVisible(false)
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
    window.addEventListener("appinstalled", handleAppInstalled)

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
      window.removeEventListener("appinstalled", handleAppInstalled)
    }
  }, [])

  const handleInstall = async () => {
    if (!installEvent) return

    try {
      await installEvent.prompt()
      await installEvent.userChoice
    } finally {
      setIsVisible(false)
      setInstallEvent(null)
    }
  }

  if (isStandalone || !isVisible || !installEvent) {
    return null
  }

  return (
    <div className="fixed inset-x-0 bottom-4 z-50 flex justify-center px-4">
      <div className="flex w-full max-w-md items-center gap-3 rounded-xl border border-border/80 bg-background/95 p-4 shadow-lg backdrop-blur">
        <div className="flex flex-1 flex-col">
          <span className="text-sm font-semibold">Install boxbox.</span>
          <span className="text-xs text-muted-foreground">Install the app on this device for offline access.</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="icon"
            variant="ghost"
            className="h-9 w-9"
            onClick={() => setIsVisible(false)}
            aria-label="Dismiss install"
          >
            <X className="h-4 w-4" />
          </Button>
          <Button size="sm" className="gap-2" onClick={handleInstall}>
            <Download className="h-4 w-4" />
            Install
          </Button>
        </div>
      </div>
    </div>
  )
}

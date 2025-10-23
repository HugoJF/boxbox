"use client"

import type { PropsWithChildren } from "react"
import { useEffect, useState } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

import { PWAInstallBanner } from "@/components/pwa-install-banner"

export function Providers({ children }: PropsWithChildren) {
  const [queryClient] = useState(() => new QueryClient())

  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return
    }

    const registerServiceWorker = async () => {
      try {
        await navigator.serviceWorker.register("/sw.js", { scope: "/" })
      } catch (error) {
        if (process.env.NODE_ENV !== "production") {
          console.error("[PWA] Service worker registration failed:", error)
        }
      }
    }

    registerServiceWorker()
  }, [])

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <PWAInstallBanner />
    </QueryClientProvider>
  )
}

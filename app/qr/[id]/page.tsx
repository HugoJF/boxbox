"use client"

import { useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"

import { Button } from "@/components/ui/button"
import { QRCodeDisplay } from "@/components/qr-code-display"
import { boxQueryOptions } from "@/lib/api"
import { toast } from "sonner"

export default function QRCodePage() {
  const params = useParams()
  const router = useRouter()
  const boxId = params.id as string

  const baseBoxQuery = boxQueryOptions(boxId)

  const { data: box, isPending } = useQuery({
    ...baseBoxQuery,
    queryFn: async () => {
      const result = await baseBoxQuery.queryFn?.()
      return result ?? undefined
    },
    onError: (err) => {
      if ((err as Error).message.includes("404")) {
        router.push("/")
        return
      }
      toast.error("Failed to load box")
    },
  })

  const qrUrl = useMemo(() => {
    if (typeof window === "undefined" || !boxId) return ""
    return `${window.location.origin}/box/${boxId}`
  }, [boxId])

  if (isPending || !box) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">Loading box…</div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 print:hidden">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Button size="icon" variant="ghost" onClick={() => router.push(`/box/${boxId}`)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-semibold">QR Code</h1>
          </div>
        </div>
      </header>

      <main className="container px-4 py-8 max-w-2xl">
        <QRCodeDisplay box={box} qrUrl={qrUrl} />
      </main>

      <style jsx global>{`
        @media print {
          body {
            background: #ffffff !important;
            color: #000000 !important;
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
          html {
            background: #ffffff !important;
          }
          @page {
            margin: 2cm;
          }
        }
      `}</style>
    </div>
  )
}

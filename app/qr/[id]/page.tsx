"use client"

import { useEffect, useRef, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Download, Printer } from "lucide-react"
import { Button } from "@/components/ui/button"
import QRCode from "qrcode"
import type { Box } from "@/lib/db/schema"
import { toast } from "sonner"

export default function QRCodePage() {
  const params = useParams()
  const router = useRouter()
  const boxId = params.id as string
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [box, setBox] = useState<Box | null>(null)
  const [qrUrl, setQrUrl] = useState("")

  useEffect(() => {
    fetchBox()
  }, [boxId])

  const fetchBox = async () => {
    try {
      const res = await fetch(`/api/boxes/${boxId}`)
      if (!res.ok) {
        router.push("/")
        return
      }
      const data = await res.json()
      setBox(data)

      // Generate QR code URL
      const url = `${window.location.origin}/box/${boxId}`
      setQrUrl(url)

      // Generate QR code
      if (canvasRef.current) {
        await QRCode.toCanvas(canvasRef.current, url, {
          width: 400,
          margin: 2,
          color: {
            dark: "#000000",
            light: "#FFFFFF",
          },
        })
      }
    } catch (error) {
      console.error("[v0] Error fetching box:", error)
      toast.error("Failed to load box")
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const handleDownload = () => {
    if (!canvasRef.current) return

    const link = document.createElement("a")
    link.download = `${box?.name || "box"}-qr-code.png`
    link.href = canvasRef.current.toDataURL()
    link.click()
  }

  if (!box) {
    return null
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
          <div className="flex gap-2">
            <Button size="icon" variant="ghost" onClick={handleDownload}>
              <Download className="h-5 w-5" />
            </Button>
            <Button size="icon" variant="ghost" onClick={handlePrint}>
              <Printer className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container px-4 py-8 max-w-2xl">
        <div className="flex flex-col items-center gap-6 print:gap-8">
          <div className={`p-4 rounded-lg ${box.color} print:hidden`}>
            <div className="h-12 w-12" />
          </div>

          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">{box.name}</h2>
            {box.description && <p className="text-muted-foreground">{box.description}</p>}
          </div>

          <div className="bg-white p-8 rounded-lg shadow-lg print:shadow-none">
            <canvas ref={canvasRef} className="max-w-full h-auto" />
          </div>

          <div className="text-center text-sm text-muted-foreground max-w-md">
            <p className="mb-2">Scan this QR code to quickly access this box's inventory</p>
            <p className="font-mono text-xs break-all">{qrUrl}</p>
          </div>

          <div className="flex gap-3 print:hidden">
            <Button size="lg" onClick={handleDownload} variant="outline" className="gap-2 bg-transparent">
              <Download className="h-5 w-5" />
              Download
            </Button>
            <Button size="lg" onClick={handlePrint} className="gap-2">
              <Printer className="h-5 w-5" />
              Print
            </Button>
          </div>
        </div>
      </main>

      <style jsx global>{`
        @media print {
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
          @page {
            margin: 2cm;
          }
        }
      `}</style>
    </div>
  )
}

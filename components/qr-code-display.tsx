"use client"

import { useEffect, useRef } from "react"
import { Download, Printer } from "lucide-react"
import QRCode from "qrcode"

import { Button } from "@/components/ui/button"
import type { Box } from "@/lib/db/schema"
import { toast } from "sonner"

interface QRCodeDisplayProps {
  box: Box
  qrUrl: string
}

export function QRCodeDisplay({ box, qrUrl }: QRCodeDisplayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const renderQRCode = async () => {
      if (!canvasRef.current || !qrUrl) return
      try {
        await QRCode.toCanvas(canvasRef.current, qrUrl, {
          width: 400,
          margin: 2,
          color: {
            dark: "#000000",
            light: "#FFFFFF",
          },
        })
      } catch (error) {
        console.error("[v0] Error generating QR code:", error)
        toast.error("Failed to generate QR code")
      }
    }

    void renderQRCode()
  }, [qrUrl])

  const handleDownload = () => {
    if (!canvasRef.current) return

    const link = document.createElement("a")
    link.download = `${box.name || "box"}-qr-code.png`
    link.href = canvasRef.current.toDataURL()
    link.click()
  }

  const handlePrint = () => {
    window.print()
  }

  return (
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
        <p className="mb-2">Scan this QR code to quickly access this box&apos;s inventory</p>
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
  )
}

import { NextResponse } from "next/server"
import QRCode from "qrcode"

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const url = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/box/${id}`

    const qrCodeDataUrl = await QRCode.toDataURL(url, {
      width: 512,
      margin: 2,
      color: {
        dark: "#000000",
        light: "#FFFFFF",
      },
    })

    return NextResponse.json({ qrCode: qrCodeDataUrl, url })
  } catch (error) {
    console.error("[v0] Error generating QR code:", error)
    return NextResponse.json({ error: "Failed to generate QR code" }, { status: 500 })
  }
}

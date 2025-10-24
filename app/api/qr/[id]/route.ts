import { NextResponse } from "next/server"
import QRCode from "qrcode"

import { authenticateRequest } from "@/lib/auth/server"

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await authenticateRequest(request)
  if ("response" in authResult) {
    return authResult.response
  }

  try {
    const { id } = await params
    const url = `${process.env.NEXT_PUBLIC_APP_URL}/box/${id}`

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
    console.error("Error generating QR code:", error)
    return NextResponse.json({ error: "Failed to generate QR code" }, { status: 500 })
  }
}

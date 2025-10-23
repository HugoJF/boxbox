import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'
import { Providers } from './providers'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "BoxBox",
  description: "Organize and track every item across your storage boxes.",
  applicationName: "BoxBox",
  manifest: "/manifest.webmanifest",
  themeColor: "#2563eb",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "BoxBox",
  },
  icons: {
    icon: [
      { url: "/icons/pwa-icon.svg", type: "image/svg+xml" },
      { url: "/placeholder-logo.png", type: "image/png", sizes: "512x512" },
    ],
    apple: "/placeholder-logo.png",
    shortcut: "/icons/pwa-icon.svg",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans antialiased`}>
        <Providers>{children}</Providers>
        <Analytics />
      </body>
    </html>
  )
}

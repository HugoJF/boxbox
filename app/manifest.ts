import type { MetadataRoute } from "next"

const ACCENT_COLOR = "#2563eb"
const BACKGROUND_COLOR = "#0f172a"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "BoxBox",
    short_name: "BoxBox",
    description: "Organize and track every item across your storage boxes.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: BACKGROUND_COLOR,
    theme_color: ACCENT_COLOR,
    icons: [
      {
        src: "/icons/pwa-icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any maskable",
      },
      {
        src: "/placeholder-logo.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
  }
}

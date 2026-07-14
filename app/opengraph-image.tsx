import { ImageResponse } from "next/og"

import { SITE } from "@/lib/constants"

export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default function OpengraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "80px",
        background: "#0C100E",
        color: "#F2F5F2",
        fontFamily: "sans-serif",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          fontSize: 40,
          fontWeight: 800,
          marginBottom: 40,
        }}
      >
        <div
          style={{
            display: "flex",
            width: 56,
            height: 56,
            borderRadius: 14,
            background: "#BEE83E",
            color: "#0C100E",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 32,
          }}
        >
          R
        </div>
        {SITE.name}
      </div>
      <div
        style={{
          display: "flex",
          fontSize: 56,
          fontWeight: 800,
          maxWidth: 900,
          lineHeight: 1.15,
        }}
      >
        Um novo app de mobilidade está chegando.
      </div>
      <div
        style={{
          display: "flex",
          fontSize: 28,
          color: "#9AA69E",
          marginTop: 24,
          maxWidth: 820,
        }}
      >
        Cadastre seu interesse e acompanhe de perto essa construção.
      </div>
    </div>,
    size
  )
}

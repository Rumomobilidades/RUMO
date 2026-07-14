import type { Metadata } from "next"
import { Inter, Geist_Mono } from "next/font/google"

import { SITE } from "@/lib/constants"
import { QueryProvider } from "@/providers/query-provider"
import { AnalyticsProvider } from "@/providers/analytics-provider"
import { Toaster } from "@/components/ui/sonner"

import "./globals.css"

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: SITE.title,
    template: `%s · ${SITE.name}`,
  },
  description: SITE.description,
  applicationName: SITE.name,
  keywords: [
    "RUMO",
    "mobilidade urbana",
    "aplicativo de corridas",
    "motorista de aplicativo",
    "lista de espera",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: SITE.locale,
    url: SITE.url,
    siteName: SITE.name,
    title: SITE.title,
    description: SITE.description,
  },
  twitter: {
    card: "summary_large_image",
    title: SITE.title,
    description: SITE.description,
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${inter.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col">
        <QueryProvider>
          {children}
          <Toaster />
        </QueryProvider>
        <AnalyticsProvider />
      </body>
    </html>
  )
}

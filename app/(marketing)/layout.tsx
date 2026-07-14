import { Navbar } from "@/components/navbar/navbar"
import { Footer } from "@/components/footer/footer"
import { OrganizationJsonLd } from "@/components/shared/json-ld"

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <OrganizationJsonLd />
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  )
}

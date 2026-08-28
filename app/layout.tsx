import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import { WhatsAppFloater } from "@/components/whatsapp-floater";

export const metadata: Metadata = {
  metadataBase: new URL("https://11i.co"),
  title: { default: "11i Maps | Multi-Location Local SEO & Listings Management", template: "%s | 11i Maps" },
  description: "Manage business listings, reviews, location data and local SEO content from one dependable platform.",
  alternates: { canonical: "/" },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 } },
  openGraph: { type: "website", locale: "en_IN", url: "https://11i.co", siteName: "11i Maps", title: "11i Maps | Local visibility, managed", description: "Accurate listings, stronger reviews and useful local content for multi-location businesses.", images: [{ url: "/og.png", width: 1200, height: 630, alt: "11i Maps — Local visibility, managed" }] },
  twitter: { card: "summary_large_image", title: "11i Maps | Local visibility, managed", description: "Accurate listings, stronger reviews and useful local content for multi-location businesses.", images: ["/og.png"] },
};
const organization = { "@context": "https://schema.org", "@type": "Organization", name: "11i Maps", url: "https://11i.co", logo: "https://11i.co/11i-maps-logo.png", email: "hi@11i.co", contactPoint: [{ "@type": "ContactPoint", telephone: "+91-9885111101", contactType: "sales", availableLanguage: ["English"] }] };
const website = { "@context": "https://schema.org", "@type": "WebSite", name: "11i Maps", url: "https://11i.co", description: "Multi-location local SEO, listings management and review workflows." };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en" suppressHydrationWarning><body>{children}<WhatsAppFloater /><Script id="organization-schema" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organization) }} /><Script id="website-schema" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(website) }} /></body></html>; }

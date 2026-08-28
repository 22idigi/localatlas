import "./globals.css";
import { WhatsAppFloater } from "@/components/whatsapp-floater";
import type { Metadata } from "next";
export const metadata: Metadata = { metadataBase: new URL("https://11i.co"), title: { default: "11i Maps | Multi-Location Local SEO & Listings Management", template: "%s | 11i Maps" }, description: "Manage business listings, reviews, location data and local SEO content from one dependable platform.", alternates: { canonical: "/" }, openGraph: { type: "website", siteName: "11i Maps", title: "11i Maps | Local visibility, managed", description: "Accurate listings, stronger reviews and useful local content for multi-location businesses." } };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en" suppressHydrationWarning><body>{children}<WhatsAppFloater /></body></html>; }

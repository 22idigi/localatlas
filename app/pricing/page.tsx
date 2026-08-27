import PricingCards from "./pricing-cards";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
export const metadata = { title: "Pricing", description: "Location-based pricing for 11i Maps listings management, review workflows and local SEO." };
export default function PricingPage() { return <><SiteHeader /><main className="min-h-screen bg-slate-950 px-6 py-16 text-white"><div className="mx-auto max-w-6xl"><div className="mx-auto max-w-2xl text-center"><p className="text-sm font-bold uppercase tracking-[.14em] text-blue-300">Simple, location-based pricing</p><h1 className="mt-3 text-4xl font-semibold tracking-tight">Start clean. Scale without chaos.</h1><p className="mt-4 text-slate-300">Every plan helps you keep location data accurate, respond to feedback and create content that supports local demand.</p></div><PricingCards /></div></main><SiteFooter /></>; }

"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronDown, Menu, X } from "lucide-react";
import { useState } from "react";

const services = [
  { href: "/solutions", label: "Map listing platform", description: "One source of truth for every location." },
  { href: "/services", label: "Managed local SEO", description: "A hands-on team for listings and content." },
  { href: "/blog/local-seo-audit-checklist", label: "Location audit", description: "Find the highest-impact local gaps." },
  { href: "/blog/google-business-profile-optimisation", label: "Google Business Profile", description: "Improve your most important profile." },
];
const industries = [
  ["/industries/banks-financial-services", "Banks & financial services"],
  ["/industries/franchises", "Franchises"],
  ["/industries/hospitals-healthcare", "Hospitals & healthcare"],
  ["/industries/clinics", "Clinics"],
  ["/industries/retail-ecommerce", "Retail & ecommerce"],
  ["/industries/automotive", "Automotive"],
] as const;

function DesktopMenu({ label, children }: { label: string; children: React.ReactNode }) {
  return <details className="group relative"><summary className="flex cursor-pointer list-none items-center gap-1 text-sm font-medium text-slate-600 transition hover:text-blue-700">{label}<ChevronDown className="h-3.5 w-3.5 transition group-open:rotate-180" /></summary><div className="absolute left-1/2 top-8 hidden w-[min(92vw,38rem)] -translate-x-1/2 pt-3 group-open:block"><div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-xl shadow-slate-900/10">{children}</div></div></details>;
}

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  return <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/90 backdrop-blur"><nav className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5"><Link href="/" className="flex items-center gap-2.5" aria-label="11i Maps home"><Image src="/11i-maps-logo.png" alt="11i Maps" width={124} height={52} className="h-11 w-auto object-contain" priority /></Link><div className="hidden items-center gap-7 md:flex"><Link href="/solutions" className="text-sm font-medium text-slate-600 transition hover:text-blue-700">Platform</Link><DesktopMenu label="Services"><div className="grid gap-1 sm:grid-cols-2">{services.map((service) => <Link key={service.href} href={service.href} className="rounded-xl p-3 transition hover:bg-blue-50"><span className="block text-sm font-semibold text-slate-900">{service.label}</span><span className="mt-1 block text-xs leading-5 text-slate-500">{service.description}</span></Link>)}</div></DesktopMenu><DesktopMenu label="Industries"><div className="grid gap-1 sm:grid-cols-2">{industries.map(([href, label]) => <Link key={href} href={href} className="rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-blue-50 hover:text-blue-700">{label}</Link>)}<Link href="/industries" className="rounded-xl px-3 py-2.5 text-sm font-semibold text-blue-700 hover:bg-blue-50">All industries →</Link></div></DesktopMenu><Link href="/blog" className="text-sm font-medium text-slate-600 transition hover:text-blue-700">Resources</Link><Link href="/pricing" className="text-sm font-medium text-slate-600 transition hover:text-blue-700">Pricing</Link></div><div className="hidden items-center gap-3 md:flex"><Link href="/login" className="px-3 text-sm font-semibold text-slate-700">Sign in</Link><Link href="/contact" className="rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800">Talk to an expert</Link></div><button className="md:hidden" onClick={() => setOpen(!open)} aria-expanded={open} aria-label="Toggle navigation">{open ? <X /> : <Menu />}</button></nav>{open && <div className="border-t border-slate-100 bg-white px-5 py-4 md:hidden"><div className="space-y-1"><Link onClick={() => setOpen(false)} className="block rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50" href="/solutions">Platform</Link><p className="px-3 pt-3 text-xs font-bold uppercase tracking-wider text-slate-400">Services</p>{services.map((service) => <Link onClick={() => setOpen(false)} className="block rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-blue-50" key={service.href} href={service.href}>{service.label}</Link>)}<p className="px-3 pt-3 text-xs font-bold uppercase tracking-wider text-slate-400">Industries</p>{industries.map(([href, label]) => <Link onClick={() => setOpen(false)} className="block rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-blue-50" key={href} href={href}>{label}</Link>)}<Link onClick={() => setOpen(false)} className="block rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50" href="/blog">Resources</Link><Link onClick={() => setOpen(false)} className="block rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50" href="/pricing">Pricing</Link><Link onClick={() => setOpen(false)} className="mt-2 block rounded-lg bg-blue-700 px-3 py-2.5 text-center text-sm font-semibold text-white" href="/contact">Talk to an expert</Link></div></div>}</header>;
}

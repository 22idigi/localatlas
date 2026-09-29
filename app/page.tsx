import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BadgeCheck, Bot, CheckCircle2, MapPinned, MessageSquareHeart, Sparkles } from "lucide-react";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

const proof = ["Location data & map listings", "Review workflows with human control", "Local SEO & answer-ready content"];
const capabilities = [
  { icon: MapPinned, title: "Listing control", copy: "Give every location one approved source of truth for hours, addresses, phone numbers, services, URLs and media." },
  { icon: MessageSquareHeart, title: "Review intelligence", copy: "Draft thoughtful responses quickly, while keeping sensitive feedback under human approval." },
  { icon: Bot, title: "Content that earns attention", copy: "Plan answer-ready local guides that support your services, locations and conversion pages." },
];

function PresenceCard() {
  return <article className="relative map-float rounded-2xl border border-blue-100 bg-white p-6 shadow-2xl shadow-blue-200/60">
    <Image src="/local-visibility-hero.png" alt="Map visibility analytics and local listing signals" width={1600} height={900} sizes="(min-width: 1024px) 18rem, 1px" className="absolute -right-12 -top-16 -z-10 hidden w-72 rounded-2xl opacity-35 mix-blend-multiply lg:block" />
    <p className="text-xs font-semibold uppercase tracking-[.16em] text-slate-400">Presence overview</p>
    <h2 className="mt-2 text-2xl font-semibold">One approved location record</h2>
    <p className="mt-3 text-sm leading-6 text-slate-600">Control core business information, review work and publishing status without pretending every directory works the same way.</p>
    <ul className="mt-6 space-y-3 text-sm font-medium text-slate-700"><li className="flex items-center gap-2"><MapPinned className="h-4 w-4 text-blue-700" />22+ managed destinations</li><li className="flex items-center gap-2"><MessageSquareHeart className="h-4 w-4 text-blue-700" />One customer-feedback workflow</li><li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-600" />Human approval for sensitive changes</li></ul>
    <p className="mt-7 rounded-lg bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">Platform connections are verified before publishing.</p>
  </article>;
}

export default function HomePage() {
  return <><SiteHeader /><main>
    <section className="relative overflow-hidden bg-[linear-gradient(115deg,#eff6ff_0%,#fff_49%,#e0e7ff_100%)]">
      <div className="absolute -right-32 top-10 h-80 w-80 rounded-full bg-blue-300/30 blur-3xl" />
      <div className="relative mx-auto grid max-w-7xl gap-12 px-5 py-20 lg:grid-cols-[1.1fr_.9fr] lg:py-28">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white px-3 py-1.5 text-xs font-semibold text-blue-800"><Sparkles className="h-3.5 w-3.5" /> Local presence, under control</p>
          <h1 className="mt-6 max-w-3xl text-5xl font-semibold tracking-[-.05em] text-slate-950 sm:text-6xl">Be the business customers can <span className="text-blue-700">find, trust, and choose.</span></h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">11i Maps gives multi-location businesses and agencies one calm workspace for maps, listings, reviews, media and local content—so the facts customers see stay accurate.</p>
          <div className="mt-8 flex flex-wrap gap-3"><Link href="/local-visibility-audit" className="inline-flex items-center gap-2 rounded-lg bg-blue-700 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-800">Get a free visibility score <ArrowRight className="h-4 w-4" /></Link><Link href="/contact" className="rounded-lg border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-800 hover:border-blue-300 hover:text-blue-700">Book a discovery call</Link></div>
          <div className="mt-10 flex flex-wrap gap-x-5 gap-y-3 text-sm font-medium text-slate-600">{proof.map((item) => <span key={item} className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-600" />{item}</span>)}</div>
        </div>
        <PresenceCard />
      </div>
    </section>
    <section className="mx-auto max-w-7xl px-5 py-20"><div className="max-w-2xl"><p className="text-sm font-bold uppercase tracking-[.14em] text-blue-700">Built for real local operations</p><h2 className="mt-3 text-3xl font-semibold tracking-tight">Everything important, connected to the next action.</h2></div><div className="mt-10 grid gap-5 md:grid-cols-3">{capabilities.map(({ icon: Icon, title, copy }) => <div key={title} className="rounded-2xl border border-slate-200 p-6 transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl hover:shadow-slate-100"><Icon className="h-6 w-6 text-blue-700" /><h3 className="mt-6 text-lg font-semibold">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{copy}</p></div>)}</div></section>
    <section className="bg-slate-950 px-5 py-20 text-white"><div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[.9fr_1.1fr]"><div><p className="text-sm font-bold uppercase tracking-[.14em] text-blue-300">From listings to local growth</p><h2 className="mt-3 text-3xl font-semibold tracking-tight">A system your team can actually maintain.</h2><p className="mt-5 leading-7 text-slate-300">11i combines the discipline of local listings management with the clarity of a practical content and review workflow.</p><Link href="/services" className="mt-7 inline-flex items-center gap-2 text-sm font-semibold text-blue-300">Explore managed services <ArrowRight className="h-4 w-4" /></Link></div><div className="grid gap-4 sm:grid-cols-3">{[["01", "Audit", "Find inaccuracies, gaps, duplicates and ownership risks."], ["02", "Optimise", "Improve the location information customers use to choose."], ["03", "Grow", "Build reviews, content and reporting into your routine."]].map(([number, title, copy]) => <div className="rounded-xl border border-white/10 bg-white/5 p-5" key={number}><p className="text-sm font-bold text-blue-300">{number}</p><h3 className="mt-8 font-semibold">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-400">{copy}</p></div>)}</div></div></section>
    <section className="mx-auto max-w-4xl px-5 py-20 text-center"><BadgeCheck className="mx-auto h-8 w-8 text-blue-700" /><h2 className="mt-4 text-3xl font-semibold tracking-tight">Ready to make local visibility feel manageable?</h2><p className="mx-auto mt-4 max-w-xl text-slate-600">Start with a free readiness score and a clear plan for the listings, customer feedback and content that matter most.</p><Link href="/local-visibility-audit" className="mt-7 inline-flex rounded-lg bg-blue-700 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-800">Score my local visibility</Link></section>
  </main><SiteFooter /></>;
}

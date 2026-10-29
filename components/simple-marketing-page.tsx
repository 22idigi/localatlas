import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export function SimpleMarketingPage({ eyebrow, title, intro, sections, cta }: { eyebrow: string; title: string; intro: string; sections: { title: string; body: string }[]; cta?: { label: string; href: string } }) {
  const ctaClassName = "mt-8 inline-block rounded-lg bg-blue-700 px-5 py-3 text-sm font-semibold text-white";
  return <><SiteHeader /><main><section className="bg-slate-50 px-5 py-20"><div className="mx-auto max-w-4xl"><p className="text-sm font-bold uppercase tracking-[.15em] text-blue-700">{eyebrow}</p><h1 className="mt-3 text-5xl font-semibold tracking-tight">{title}</h1><p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">{intro}</p>{cta && (cta.href.startsWith("mailto:") ? <a href={cta.href} className={ctaClassName}>{cta.label}</a> : <Link href={cta.href} className={ctaClassName}>{cta.label}</Link>)}</div></section><section className="mx-auto max-w-4xl space-y-5 px-5 py-16">{sections.map((section) => <article key={section.title} className="rounded-2xl border border-slate-200 p-6"><h2 className="text-xl font-semibold">{section.title}</h2><p className="mt-3 leading-7 text-slate-600">{section.body}</p></article>)}</section></main><SiteFooter /></>;
}

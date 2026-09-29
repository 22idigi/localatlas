import type { Metadata } from "next";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { VisibilityAudit } from "./audit";

export const metadata: Metadata = {
  title: "Free Local Visibility Audit",
  description: "Score your local listings, reviews, location pages and measurement workflow in under three minutes, then get a practical priority plan.",
  alternates: { canonical: "/local-visibility-audit" },
};

export default function LocalVisibilityAuditPage() {
  return <><SiteHeader /><main className="bg-slate-50"><section className="mx-auto max-w-4xl px-5 pb-12 pt-16 text-center"><p className="text-sm font-bold uppercase tracking-[.15em] text-blue-700">Free · no login required</p><h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">Is your local presence ready to grow?</h1><p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-slate-600">Get an honest readiness score across the six foundations that turn map visibility into calls, visits and qualified enquiries.</p></section><section className="mx-auto max-w-6xl px-5 pb-20"><VisibilityAudit /></section></main><SiteFooter /></>;
}

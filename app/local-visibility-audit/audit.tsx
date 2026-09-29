"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, CheckCircle2, Circle } from "lucide-react";

const checks = [
  ["ownership", "Every location profile is claimed and owned by the business."],
  ["nap", "Names, addresses and phone numbers match across core directories."],
  ["hours", "Opening hours and holiday hours are reviewed every month."],
  ["reviews", "New reviews receive a considered response within two business days."],
  ["pages", "Each location has a useful, indexable page with services and contact actions."],
  ["measurement", "Calls, directions, website visits and enquiries are measured by location."],
] as const;

export function VisibilityAudit() {
  const [answers, setAnswers] = useState<Record<string, boolean>>({});
  const completed = Object.keys(answers).length;
  const score = useMemo(() => Math.round((Object.values(answers).filter(Boolean).length / checks.length) * 100), [answers]);
  const recommendation = score >= 80 ? "Protect consistency and focus on local conversion." : score >= 50 ? "Fix operating gaps before scaling content." : "Start with ownership, accuracy and measurement.";
  const whatsapp = `https://wa.me/919885111101?text=${encodeURIComponent(`Hello 11i Maps, my local visibility readiness score is ${score}/100. I would like a practical improvement plan.`)}`;

  return <div className="grid gap-8 lg:grid-cols-[1.15fr_.85fr]">
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <p className="text-sm font-semibold text-slate-500">Answer six operational checks</p>
      <div className="mt-6 space-y-5">{checks.map(([key, label], index) => <fieldset key={key} className="border-b border-slate-100 pb-5 last:border-0"><legend className="flex gap-3 font-medium text-slate-900"><span className="text-blue-700">{index + 1}.</span>{label}</legend><div className="mt-3 flex gap-2"><button onClick={() => setAnswers((current) => ({ ...current, [key]: true }))} className={`rounded-lg px-4 py-2 text-sm font-semibold ${answers[key] === true ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>Yes</button><button onClick={() => setAnswers((current) => ({ ...current, [key]: false }))} className={`rounded-lg px-4 py-2 text-sm font-semibold ${answers[key] === false ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>Not yet</button></div></fieldset>)}</div>
    </section>
    <aside className="h-fit rounded-2xl bg-slate-950 p-7 text-white lg:sticky lg:top-28">
      <p className="text-sm font-semibold uppercase tracking-[.14em] text-blue-300">Your readiness score</p>
      <p className="mt-4 text-6xl font-semibold">{completed === checks.length ? score : "—"}<span className="text-2xl text-slate-400">/100</span></p>
      <p className="mt-4 leading-7 text-slate-300">{completed === checks.length ? recommendation : `Complete ${checks.length - completed} more ${checks.length - completed === 1 ? "check" : "checks"} for your priority plan.`}</p>
      <div className="mt-6 space-y-3 text-sm">{checks.map(([key, label]) => <div className="flex gap-2" key={key}>{answers[key] === true ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" /> : <Circle className="mt-0.5 h-4 w-4 shrink-0 text-slate-600" />}<span className={answers[key] === true ? "text-slate-300" : "text-slate-500"}>{label}</span></div>)}</div>
      {completed === checks.length && <a href={whatsapp} target="_blank" rel="noreferrer" className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-500 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-400">Get my improvement plan <ArrowRight className="h-4 w-4" /></a>}
      <Link href="/blog/local-seo-audit-checklist" className="mt-4 block text-center text-sm font-semibold text-blue-300">Read the complete audit checklist</Link>
    </aside>
  </div>;
}

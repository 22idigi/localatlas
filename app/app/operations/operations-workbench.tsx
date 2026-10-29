"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Check, ClipboardCheck, Eye, Gauge, Loader2, MapPinned, MessageSquareText, RotateCcw, ShieldCheck, Sparkles } from "lucide-react";

type Approval = {
  id: string;
  authorName: string | null;
  rating: number;
  body: string | null;
  response: string | null;
  publishedAt: string;
  locationName: string;
  platform: string;
};

type Activity = { id: string; action: string; entityType: string; createdAt: string };
type Counts = { auditRuns: number; openTasks: number; completedTasks: number; connectedProfiles: number; selectedProperties: number };

const stages = [
  { label: "Diagnose", detail: "Profile audits", icon: Gauge, count: "auditRuns" as const, href: "/app/locations" },
  { label: "Plan", detail: "Open priorities", icon: ClipboardCheck, count: "openTasks" as const, href: "/app/tasks" },
  { label: "Execute", detail: "Connected profiles", icon: MapPinned, count: "connectedProfiles" as const, href: "/app/integrations" },
  { label: "Measure", detail: "GSC properties", icon: Eye, count: "selectedProperties" as const, href: "/app/search-console" },
  { label: "Improve", detail: "Tasks completed", icon: RotateCcw, count: "completedTasks" as const, href: "/app/tasks" },
];

export default function OperationsWorkbench({ canApprove, counts, initialApprovals, activity }: { canApprove: boolean; counts: Counts; initialApprovals: Approval[]; activity: Activity[] }) {
  const [approvals, setApprovals] = useState(initialApprovals);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function decide(id: string, decision: "APPROVE_DRAFT" | "IGNORE") {
    setBusy(id); setError(null);
    const response = await fetch(`/api/reviews/${id}/decision`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decision }),
    });
    const result = await response.json();
    setBusy(null);
    if (!response.ok) return setError(result.error ?? "Unable to save this decision.");
    setApprovals((current) => current.filter((approval) => approval.id !== id));
  }

  return <main className="mx-auto max-w-7xl px-5 py-8 md:px-8 md:py-10">
    <header className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm font-semibold text-blue-700">Operating system</p><h1 className="mt-1 text-3xl font-semibold tracking-tight">Diagnose. Plan. Execute. Measure. Improve.</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">A control layer for repeatable local SEO work. Counts come from this workspace; external publishing appears only after an approved provider connection succeeds.</p></div><Link href="/app/tasks" className="inline-flex items-center gap-2 rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800">Open priorities <ArrowRight className="h-4 w-4" /></Link></header>

    <section className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">{stages.map(({ label, detail, icon: Icon, count, href }, index) => <Link href={href} key={label} className="relative rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200"><div className="flex items-center justify-between"><span className="grid h-9 w-9 place-items-center rounded-xl bg-blue-50 text-blue-700"><Icon className="h-4 w-4" /></span><span className="text-xs font-semibold text-slate-400">0{index + 1}</span></div><p className="mt-5 text-2xl font-semibold">{counts[count]}</p><h2 className="mt-1 text-sm font-semibold">{label}</h2><p className="mt-1 text-xs text-slate-500">{detail}</p></Link>)}</section>

    {error && <p className="mt-5 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-900">{error}</p>}
    <section className="mt-6 grid gap-5 xl:grid-cols-[1.15fr_.85fr]">
      <article className="rounded-2xl border border-slate-200 bg-white p-6"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-sm font-semibold text-blue-700">Approval inbox</p><h2 className="mt-1 text-xl font-semibold">Sensitive review replies</h2><p className="mt-1 text-sm text-slate-500">Low-rating AI drafts require a human decision. Approval means ready for provider delivery, not already posted.</p></div><span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">{approvals.length} waiting</span></div>
        <div className="mt-5 space-y-3">{approvals.map((review) => <div key={review.id} className="rounded-xl border border-slate-200 p-4"><div className="flex flex-wrap items-center justify-between gap-2"><p className="text-sm font-semibold">{review.locationName} · {review.platform.replaceAll("_", " ")}</p><span className="text-xs font-semibold text-amber-700">{review.rating}/5 stars</span></div><p className="mt-3 text-sm leading-6 text-slate-600">“{review.body ?? "No written review"}”</p><div className="mt-3 rounded-lg bg-slate-50 p-3"><p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Reply draft</p><p className="mt-1 text-sm leading-6 text-slate-700">{review.response ?? "Draft unavailable"}</p></div>{canApprove && <div className="mt-4 flex flex-wrap gap-2"><button onClick={() => decide(review.id, "APPROVE_DRAFT")} disabled={busy === review.id} className="inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-3 py-2 text-xs font-semibold text-white disabled:opacity-60">{busy === review.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}Approve draft</button><button onClick={() => decide(review.id, "IGNORE")} disabled={busy === review.id} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 disabled:opacity-60">Ignore</button></div>}</div>)}{!approvals.length && <div className="rounded-xl border border-dashed border-slate-300 px-5 py-10 text-center"><ShieldCheck className="mx-auto h-6 w-6 text-emerald-700" /><p className="mt-2 text-sm font-semibold">No sensitive replies are waiting</p><p className="mt-1 text-xs text-slate-500">Flagged AI drafts will appear here for review.</p></div>}</div>
      </article>
      <div className="space-y-5"><article className="rounded-2xl border border-slate-200 bg-white p-6"><p className="text-sm font-semibold text-blue-700">Active playbooks</p><h2 className="mt-1 text-xl font-semibold">One standard for every location</h2><div className="mt-5 space-y-3">{[
        [Sparkles, "Profile hygiene", "Audit gaps and rank the next fixes"],
        [MessageSquareText, "Review safety", "Draft by sentiment; hold sensitive replies"],
        [MapPinned, "Listing consistency", "Use one saved NAP source across profiles"],
        [Eye, "Search performance", "Measure clicks, impressions and opportunity"],
      ].map(([Icon, title, detail]) => { const PlaybookIcon = Icon as typeof Sparkles; return <div key={String(title)} className="flex gap-3 rounded-xl bg-slate-50 p-3"><PlaybookIcon className="mt-0.5 h-4 w-4 text-blue-700" /><div><p className="text-sm font-semibold">{String(title)}</p><p className="mt-1 text-xs leading-5 text-slate-500">{String(detail)}</p></div></div>; })}</div></article>
        <article className="rounded-2xl border border-slate-200 bg-white p-6"><p className="text-sm font-semibold text-blue-700">Audit trail</p><h2 className="mt-1 text-xl font-semibold">Recent decisions and changes</h2><div className="mt-4 divide-y divide-slate-100">{activity.map((item) => <div key={item.id} className="flex items-center justify-between gap-3 py-3"><div><p className="text-sm font-medium">{item.action.replaceAll(".", " ")}</p><p className="mt-1 text-xs text-slate-400">{item.entityType}</p></div><time className="text-xs text-slate-400">{new Date(item.createdAt).toLocaleDateString()}</time></div>)}{!activity.length && <p className="py-6 text-center text-sm text-slate-500">Actions will be recorded here.</p>}</div></article></div>
    </section>
  </main>;
}

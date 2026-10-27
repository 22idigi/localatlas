import Link from "next/link";
import { ArrowRight, CheckCircle2, CircleAlert, ClipboardCheck, MapPinned, PlugZap } from "lucide-react";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant";

export default async function ProductOverviewPage() {
  const tenant = await getTenantContext();
  if (!tenant) redirect("/login?callbackUrl=/app");
  const organizationId = tenant.organization.id;
  const [locations, connectedProfiles, openTasks, recentActivity] = await Promise.all([
    prisma.location.count({ where: { organizationId } }),
    prisma.mapPlatform.count({ where: { location: { organizationId }, syncState: "CONNECTED" } }),
    prisma.optimizationTask.count({ where: { organizationId, status: { in: ["OPEN", "IN_PROGRESS"] } } }),
    prisma.activityLog.findMany({ where: { organizationId }, orderBy: { createdAt: "desc" }, take: 5 }),
  ]);
  if (!locations) redirect("/app/onboarding");
  const cards = [
    [MapPinned, "Managed locations", locations, "/app/locations"],
    [PlugZap, "Connected profiles", connectedProfiles, "/app/integrations"],
    [ClipboardCheck, "Open optimisation tasks", openTasks, "/app/tasks"],
  ] as const;
  return <main className="mx-auto max-w-7xl px-5 py-8 md:px-8 md:py-10"><header className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm font-semibold text-blue-700">Executive overview</p><h1 className="mt-1 text-3xl font-semibold tracking-tight">Local operations, with honest data.</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Every metric below comes from your saved workspace records. Provider performance data stays unavailable until an approved connection is active.</p></div><Link href="/app/locations" className="inline-flex items-center gap-2 rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800">Manage locations <ArrowRight className="h-4 w-4" /></Link></header>
    <section className="mt-8 grid gap-4 md:grid-cols-3">{cards.map(([Icon, label, value, href]) => <Link href={href} key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200"><div className="flex items-center justify-between"><span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-blue-700"><Icon className="h-5 w-5" /></span><ArrowRight className="h-4 w-4 text-slate-400" /></div><p className="mt-6 text-3xl font-semibold">{value}</p><p className="mt-1 text-sm text-slate-500">{label}</p></Link>)}</section>
    <section className="mt-6 grid gap-5 lg:grid-cols-[1.15fr_.85fr]"><article className="rounded-2xl border border-slate-200 bg-white p-6"><h2 className="font-semibold">Recent workspace activity</h2><p className="mt-1 text-sm text-slate-500">A trace of important changes made inside this organisation.</p><div className="mt-5 divide-y divide-slate-100">{recentActivity.length ? recentActivity.map((item) => <div key={item.id} className="flex items-center justify-between gap-4 py-3"><div><p className="text-sm font-medium">{item.action.replaceAll(".", " ")}</p><p className="mt-1 text-xs text-slate-500">{item.entityType}{item.entityId ? ` · ${item.entityId.slice(-8)}` : ""}</p></div><time className="text-xs text-slate-400">{item.createdAt.toLocaleDateString()}</time></div>) : <div className="py-8 text-center text-sm text-slate-500">Activity will appear after you add a location or run an audit.</div>}</div></article>
      <article className="rounded-2xl border border-slate-200 bg-white p-6"><h2 className="font-semibold">Integration health</h2><div className="mt-5 space-y-3"><div className="flex gap-3 rounded-xl bg-emerald-50 p-4"><CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-700" /><div><p className="text-sm font-semibold text-emerald-950">Manual workspace is ready</p><p className="mt-1 text-xs leading-5 text-emerald-800">Locations, audits and tasks persist in your tenant.</p></div></div><div className="flex gap-3 rounded-xl bg-amber-50 p-4"><CircleAlert className="mt-0.5 h-5 w-5 text-amber-700" /><div><p className="text-sm font-semibold text-amber-950">Provider data is not assumed</p><p className="mt-1 text-xs leading-5 text-amber-800">Connect approved Google or partner credentials before live syncs appear.</p></div></div></div></article></section>
  </main>;
}

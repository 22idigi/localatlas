import Link from "next/link";
import { ArrowUpRight, BarChart3, MousePointerClick, RefreshCw, SearchCheck } from "lucide-react";
import { redirect } from "next/navigation";
import { getTenantContext } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { getSearchConsolePerformance, type SearchConsolePerformance } from "@/lib/google-search-console";

export const dynamic = "force-dynamic";

function number(value: number) { return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(value); }
function percent(value: number) { return new Intl.NumberFormat("en-IN", { style: "percent", maximumFractionDigits: 1 }).format(value); }

export default async function SearchConsolePage() {
  const tenant = await getTenantContext();
  if (!tenant) redirect("/login?callbackUrl=/app/search-console");
  const connection = await prisma.integrationConnection.findUnique({
    where: { organizationId_provider: { organizationId: tenant.organization.id, provider: "GOOGLE_SEARCH_CONSOLE" } },
    include: { searchConsoleProperties: { orderBy: [{ selected: "desc" }, { siteUrl: "asc" }] } },
  });
  if (!connection) return <main className="mx-auto max-w-5xl px-5 py-10 md:px-8"><div className="rounded-3xl border border-slate-200 bg-white p-8 text-center"><SearchCheck className="mx-auto h-9 w-9 text-blue-700" /><h1 className="mt-4 text-2xl font-semibold">Connect Google Search Console</h1><p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-600">One read-only Google consent discovers all Search Console properties available to that account. 11i Maps cannot edit your website or Search Console settings.</p><Link href="/api/integrations/google-search-console/connect" className="mt-6 inline-flex rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800">Connect Google Search Console</Link></div></main>;

  const selected = connection.searchConsoleProperties.find((property) => property.selected) ?? connection.searchConsoleProperties[0];
  let performance: SearchConsolePerformance | null = null;
  let error: string | null = null;
  if (selected) {
    try { performance = await getSearchConsolePerformance(connection.id, tenant.organization.id, selected.siteUrl); }
    catch (caught) { error = caught instanceof Error ? caught.message : "Search performance could not be loaded"; }
  }
  const maxImpressions = Math.max(...(performance?.daily.map((row) => row.impressions) ?? [1]), 1);
  const cards = performance ? [
    [MousePointerClick, "Clicks", number(performance.totals.clicks)],
    [BarChart3, "Impressions", number(performance.totals.impressions)],
    [SearchCheck, "Average CTR", percent(performance.totals.ctr)],
    [ArrowUpRight, "Average position", performance.totals.position.toFixed(1)],
  ] as const : [];
  return <main className="mx-auto max-w-7xl px-5 py-8 md:px-8 md:py-10">
    <header className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm font-semibold text-blue-700">Google Search Console</p><h1 className="mt-1 text-3xl font-semibold tracking-tight">Organic search performance</h1><p className="mt-2 text-sm text-slate-600">Final Google data for the previous 28 days. No estimated traffic is mixed in.</p></div><div className="flex gap-2"><form action="/api/integrations/google-search-console/sync" method="post"><button className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"><RefreshCw className="h-4 w-4" />Refresh properties</button></form><Link href="/api/integrations/google-search-console/connect" className="rounded-lg bg-blue-700 px-3.5 py-2.5 text-sm font-semibold text-white hover:bg-blue-800">Reconnect</Link></div></header>
    <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5"><form action="/api/integrations/google-search-console/select-property" method="post" className="flex flex-wrap items-end gap-3"><label className="min-w-0 flex-1 text-xs font-semibold text-slate-600">Search Console property<select name="propertyId" defaultValue={selected?.id} className="mt-2 block w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900">{connection.searchConsoleProperties.map((property) => <option key={property.id} value={property.id}>{property.siteUrl} · {property.permissionLevel}</option>)}</select></label><button className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold hover:bg-slate-50">Load property</button></form><p className="mt-3 text-xs text-slate-500">{connection.searchConsoleProperties.length} accessible {connection.searchConsoleProperties.length === 1 ? "property" : "properties"} discovered for {connection.externalAccountEmail ?? "this Google account"}.</p></section>
    {!selected && <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-950">Google returned no Search Console properties for this account. Add the account as a property owner or user, then refresh.</div>}
    {error && <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-900">Google could not load this property: {error}</div>}
    {performance && <><section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{cards.map(([Icon, label, value]) => <article key={label} className="rounded-2xl border border-slate-200 bg-white p-5"><Icon className="h-5 w-5 text-blue-700" /><p className="mt-5 text-3xl font-semibold">{value}</p><p className="mt-1 text-sm text-slate-500">{label}</p></article>)}</section>
      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6"><div className="flex items-center justify-between"><div><h2 className="font-semibold">Daily impressions</h2><p className="mt-1 text-xs text-slate-500">{performance.startDate} to {performance.endDate}</p></div></div><div className="mt-6 flex h-48 items-end gap-1" aria-label="Daily Search Console impressions chart">{performance.daily.map((row) => <div key={row.date} className="group relative flex min-w-0 flex-1 items-end" title={`${row.date}: ${number(row.impressions)} impressions, ${number(row.clicks)} clicks`}><div className="w-full rounded-t bg-blue-600/80 transition hover:bg-blue-700" style={{ height: `${Math.max(4, (row.impressions / maxImpressions) * 100)}%` }} /></div>)}</div></section>
      <section className="mt-6 grid gap-5 lg:grid-cols-2"><ResultTable title="Top queries" label="Query" rows={performance.queries.map((row) => ({ label: row.query || "(anonymised query)", ...row }))} /><ResultTable title="Top pages" label="Page" rows={performance.pages.map((row) => ({ label: row.page, ...row }))} /></section></>}
  </main>;
}

function ResultTable({ title, label, rows }: { title: string; label: string; rows: Array<{ label: string; clicks: number; impressions: number; position: number }> }) {
  return <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white"><div className="border-b border-slate-100 px-5 py-4"><h2 className="font-semibold">{title}</h2></div><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-xs text-slate-500"><tr><th className="px-5 py-3 font-medium">{label}</th><th className="px-3 py-3 text-right font-medium">Clicks</th><th className="px-3 py-3 text-right font-medium">Views</th><th className="px-5 py-3 text-right font-medium">Position</th></tr></thead><tbody className="divide-y divide-slate-100">{rows.map((row, index) => <tr key={`${row.label}-${index}`}><td className="max-w-72 truncate px-5 py-3 font-medium" title={row.label}>{row.label}</td><td className="px-3 py-3 text-right">{number(row.clicks)}</td><td className="px-3 py-3 text-right">{number(row.impressions)}</td><td className="px-5 py-3 text-right">{row.position.toFixed(1)}</td></tr>)}{!rows.length && <tr><td colSpan={4} className="px-5 py-8 text-center text-slate-500">No final data in this date range.</td></tr>}</tbody></table></div></article>;
}

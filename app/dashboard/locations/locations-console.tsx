"use client";

import { useState } from "react";
import { Building2, CheckCircle2, Loader2, RefreshCw, TriangleAlert } from "lucide-react";

type Location = { id: string; name: string; addressLine1: string; addressLine2: string | null; city: string; state: string; postalCode: string; country: string; phone: string; websiteUrl: string | null; primaryCategory: string | null; updatedAt: string; platforms: { id: string; type: string; syncState: "CONNECTED" | "PENDING" | "SYNCING" | "FAILED" | "DISCONNECTED"; lastSyncedAt: string | null; lastError: string | null }[] };
const fields = ["name", "addressLine1", "city", "state", "postalCode", "country", "phone", "websiteUrl", "primaryCategory"] as const;

export default function LocationsConsole({ locations: initial }: { locations: Location[] }) {
  const [locations, setLocations] = useState(initial); const [selected, setSelected] = useState(initial[0]?.id ?? "");
  const [saving, setSaving] = useState(false); const [notice, setNotice] = useState<string | null>(null);
  const location = locations.find((item) => item.id === selected);
  async function sync() {
    if (!location) return; setSaving(true); setNotice(null);
    const payload = Object.fromEntries(fields.map((f) => [f, (f === "websiteUrl" || f === "primaryCategory") && !location[f] ? null : location[f]]));
    const response = await fetch("/api/locations/bulk-sync", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ locationIds: [location.id], ...payload }) });
    const body = await response.json(); setSaving(false); setNotice(response.ok ? `Synced ${body.synced} directory profiles${body.failed ? `; ${body.failed} need attention` : ""}.` : body.error ?? "Unable to sync.");
  }
  function edit(key: keyof Location, value: string) { if (location) setLocations((all) => all.map((item) => item.id === location.id ? { ...item, [key]: value } : item)); }
  if (!location) return <main className="grid min-h-screen place-items-center text-zinc-500">Add your first location to begin.</main>;
  const healthy = location.platforms.filter((p) => p.syncState === "CONNECTED").length;
  return <main className="min-h-screen bg-zinc-50 px-5 py-8 text-zinc-950 dark:bg-[#09090b] dark:text-zinc-50 md:px-10">
    <div className="mx-auto max-w-7xl"><header className="mb-8 flex flex-wrap items-end justify-between gap-4"><div><p className="mb-2 text-xs font-semibold uppercase tracking-[.18em] text-indigo-500">Locations</p><h1 className="text-3xl font-semibold tracking-tight">Your business presence</h1><p className="mt-2 text-sm text-zinc-500">Manage the facts customers see everywhere.</p></div><button onClick={sync} disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-indigo-500 disabled:opacity-60">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}Sync all profiles</button></header>
      {notice && <p className="mb-5 rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm dark:border-zinc-800 dark:bg-zinc-900">{notice}</p>}
      <div className="grid gap-6 lg:grid-cols-[280px_1fr]"><aside className="rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-950">{locations.map((item) => <button key={item.id} onClick={() => setSelected(item.id)} className={`mb-1 w-full rounded-lg p-3 text-left ${selected === item.id ? "bg-indigo-50 dark:bg-indigo-950/40" : "hover:bg-zinc-50 dark:hover:bg-zinc-900"}`}><div className="flex items-center justify-between"><span className="font-medium">{item.name}</span><span className={`h-2 w-2 rounded-full ${item.platforms.some((p) => p.syncState === "FAILED") ? "bg-rose-500" : "bg-emerald-500"}`} /></div><p className="mt-1 truncate text-xs text-zinc-500">{item.city}, {item.state}</p></button>)}</aside>
        <section className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950"><div className="mb-6 flex flex-wrap justify-between gap-4"><div className="flex gap-3"><span className="grid h-10 w-10 place-items-center rounded-lg bg-indigo-100 text-indigo-600 dark:bg-indigo-950"><Building2 className="h-5 w-5" /></span><div><h2 className="font-semibold">{location.name}</h2><p className="text-sm text-zinc-500">{healthy}/{location.platforms.length} directories healthy</p></div></div><button onClick={sync} disabled={saving} className="text-sm font-medium text-indigo-600 hover:text-indigo-500">Save & sync changes</button></div>
          <div className="grid gap-x-5 gap-y-4 md:grid-cols-2">{fields.map((field) => <label key={field} className={field === "addressLine1" ? "md:col-span-2" : ""}><span className="mb-1.5 block text-xs font-medium capitalize text-zinc-500">{field.replace(/([A-Z])/g, " $1")}</span><input value={(location[field] as string | null) ?? ""} onChange={(e) => edit(field, e.target.value)} className="w-full rounded-lg border border-zinc-200 bg-transparent px-3 py-2 text-sm outline-none ring-indigo-500 focus:ring-2 dark:border-zinc-800" /></label>)}</div>
          <div className="mt-8 border-t border-zinc-100 pt-5 dark:border-zinc-900"><h3 className="mb-3 text-sm font-semibold">Directory sync status</h3><div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">{location.platforms.map((platform) => <div key={platform.id} className="rounded-lg border border-zinc-100 p-3 dark:border-zinc-900"><div className="flex items-center gap-2 text-sm font-medium">{platform.syncState === "FAILED" ? <TriangleAlert className="h-4 w-4 text-rose-500" /> : <CheckCircle2 className="h-4 w-4 text-emerald-500" />}{platform.type.replaceAll("_", " ")}</div><p className="mt-1 text-xs text-zinc-500">{platform.syncState === "FAILED" ? platform.lastError ?? "Needs attention" : platform.lastSyncedAt ? `Synced ${new Date(platform.lastSyncedAt).toLocaleString()}` : platform.syncState}</p></div>)}</div></div>
        </section></div></div></main>;
}

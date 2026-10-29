"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { CheckCircle2, ClipboardCheck, Loader2, MapPin, Plus, TriangleAlert } from "lucide-react";

type LocationItem = {
  id: string; name: string; addressLine1: string; city: string; state: string; postalCode: string; country: string; phone: string; websiteUrl: string | null; primaryCategory: string | null; createdAt: string; updatedAt: string;
  platforms: { type: string; syncState: string }[];
  _count: { media: number; reviews: number; tasks: number };
};
const availablePlatforms = ["GOOGLE", "BING", "APPLE", "META"] as const;
const emptyForm = { name: "", addressLine1: "", city: "", state: "", postalCode: "", country: "IN", phone: "", websiteUrl: "", primaryCategory: "", platforms: ["GOOGLE"] as string[] };

export default function LocationsManager({ initialLocations, canEdit }: { initialLocations: LocationItem[]; canEdit: boolean }) {
  const [locations, setLocations] = useState(initialLocations);
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(initialLocations.length === 0);
  const [busy, setBusy] = useState(false);
  const [auditing, setAuditing] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function submit(event: FormEvent) {
    event.preventDefault(); setBusy(true); setNotice(null);
    const response = await fetch("/api/locations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const result = await response.json(); setBusy(false);
    if (!response.ok) return setNotice({ type: "error", text: result.error ?? "Unable to add location." });
    setLocations((current) => [{ ...result.location, createdAt: result.location.createdAt, updatedAt: result.location.updatedAt, _count: { media: 0, reviews: 0, tasks: 0 } }, ...current]);
    setForm(emptyForm); setShowForm(false); setNotice({ type: "success", text: "Location saved in your workspace. Provider publishing remains off until authorised connections are configured." });
  }

  async function runAudit(locationId: string) {
    setAuditing(locationId); setNotice(null);
    const response = await fetch("/api/audits/run", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ locationId }) });
    const result = await response.json(); setAuditing(null);
    if (!response.ok) return setNotice({ type: "error", text: result.error ?? "Audit failed." });
    setLocations((current) => current.map((item) => item.id === locationId ? { ...item, _count: { ...item._count, tasks: item._count.tasks + result.tasksCreated } } : item));
    setNotice({ type: "success", text: `Audit complete: ${result.audit.score}/100 with ${result.tasksCreated} recommended actions. This is an 11i completeness score, not a Google ranking score.` });
  }

  return <main className="mx-auto max-w-7xl px-5 py-8 md:px-8 md:py-10"><header className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm font-semibold text-blue-700">Location directory</p><h1 className="mt-1 text-3xl font-semibold tracking-tight">One approved record for every location.</h1><p className="mt-2 text-sm text-slate-600">Manual records work now. External changes require an authorised provider connection and confirmation.</p></div>{canEdit && <button onClick={() => setShowForm((value) => !value)} className="inline-flex items-center gap-2 rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white"><Plus className="h-4 w-4" />Add location</button>}</header>
    {notice && <div className={`mt-5 flex items-start gap-2 rounded-xl px-4 py-3 text-sm ${notice.type === "success" ? "bg-emerald-50 text-emerald-900" : "bg-rose-50 text-rose-900"}`}>{notice.type === "success" ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> : <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />}{notice.text}</div>}
    {showForm && canEdit && <form onSubmit={submit} className="mt-6 rounded-2xl border border-blue-100 bg-white p-5 shadow-sm"><div className="mb-5"><h2 className="font-semibold">Add a manual business location</h2><p className="mt-1 text-xs text-slate-500">You can connect an authorised Google Business Profile after the core record is saved.</p></div><div className="grid gap-4 md:grid-cols-2">{([['name','Business name'],['addressLine1','Address line 1'],['city','City'],['state','State / region'],['postalCode','Postal code'],['country','Country code'],['phone','Phone'],['websiteUrl','Website URL'],['primaryCategory','Primary category']] as const).map(([key, label]) => <label key={key} className={key === "addressLine1" ? "md:col-span-2" : ""}><span className="mb-1.5 block text-xs font-medium text-slate-600">{label}</span><input required={!['websiteUrl','primaryCategory'].includes(key)} value={form[key]} onChange={(event) => setForm({ ...form, [key]: event.target.value })} className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" /></label>)}</div><fieldset className="mt-5"><legend className="text-xs font-medium text-slate-600">Directories to prepare (no publishing yet)</legend><div className="mt-2 flex flex-wrap gap-2">{availablePlatforms.map((platform) => <label key={platform} className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium"><input type="checkbox" checked={form.platforms.includes(platform)} onChange={(event) => setForm({ ...form, platforms: event.target.checked ? [...form.platforms, platform] : form.platforms.filter((item) => item !== platform) })} />{platform}</label>)}</div></fieldset><div className="mt-6 flex justify-end gap-3"><button type="button" onClick={() => setShowForm(false)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium">Cancel</button><button disabled={busy} className="inline-flex items-center gap-2 rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">{busy && <Loader2 className="h-4 w-4 animate-spin" />}Save location</button></div></form>}
    <section className="mt-6 grid gap-4 lg:grid-cols-2">{locations.map((location) => <article key={location.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-start justify-between gap-4"><div className="flex gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-700"><MapPin className="h-5 w-5" /></span><div><h2 className="font-semibold">{location.name}</h2><p className="mt-1 text-sm text-slate-500">{location.addressLine1}, {location.city}</p></div></div><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">{location.country}</span></div><dl className="mt-5 grid grid-cols-3 gap-2 text-center"><div className="rounded-lg bg-slate-50 p-3"><dt className="text-xs text-slate-500">Profiles</dt><dd className="mt-1 font-semibold">{location.platforms.length}</dd></div><div className="rounded-lg bg-slate-50 p-3"><dt className="text-xs text-slate-500">Media</dt><dd className="mt-1 font-semibold">{location._count.media}</dd></div><div className="rounded-lg bg-slate-50 p-3"><dt className="text-xs text-slate-500">Tasks</dt><dd className="mt-1 font-semibold">{location._count.tasks}</dd></div></dl><div className="mt-4 flex flex-wrap items-center justify-between gap-3"><p className="text-xs text-slate-500">{location.platforms.some((item) => item.syncState === "CONNECTED") ? "Authorised provider connected" : "Manual mode · no live provider sync"}</p>{canEdit && <button onClick={() => runAudit(location.id)} disabled={auditing === location.id} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:border-blue-300 hover:text-blue-700 disabled:opacity-60">{auditing === location.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ClipboardCheck className="h-3.5 w-3.5" />}Run profile audit</button>}</div></article>)}{!locations.length && !showForm && <div className="lg:col-span-2 rounded-2xl border border-dashed border-slate-300 p-12 text-center"><MapPin className="mx-auto h-6 w-6 text-slate-400" /><h2 className="mt-3 font-semibold">No locations yet</h2><p className="mt-2 text-sm text-slate-500">Add your first business location to start a truthful local profile audit.</p></div>}</section>
    <p className="mt-6 text-xs text-slate-500">Need help importing multiple locations? <Link href="mailto:hi@11i.co?subject=11i%20Maps%20bulk%20location%20import" className="font-semibold text-blue-700">Contact 11i onboarding</Link>.</p>
  </main>;
}

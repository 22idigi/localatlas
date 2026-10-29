"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, CloudUpload, Loader2, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";

type Listing = { id: string; title: string; account: string; address: string; phone: string | null; imported: boolean; syncState: string; lastReadAt: string | null; lastWrittenAt: string | null };

async function call(url: string, body?: unknown) {
  const response = await fetch(url, { method: "POST", headers: body ? { "Content-Type": "application/json" } : undefined, body: body ? JSON.stringify(body) : undefined });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error ?? "The request could not be completed");
  return payload;
}

export function ListingsManager({ listings }: { listings: Listing[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState(() => new Set(listings.filter((item) => !item.imported).map((item) => item.id)));
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const imported = useMemo(() => listings.filter((item) => item.imported), [listings]);
  async function run(label: string, task: () => Promise<unknown>, success: string) {
    setBusy(label); setMessage(null);
    try { await task(); setMessage(success); router.refresh(); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Action failed"); }
    finally { setBusy(null); }
  }
  return <section className="mt-7 space-y-4">
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4">
      <div><p className="text-sm font-semibold">{listings.length} Google listings discovered</p><p className="mt-1 text-xs text-slate-500">{imported.length} imported into your editable 11i workspace</p></div>
      <div className="flex flex-wrap gap-2">
        <button disabled={Boolean(busy)} onClick={() => run("refresh", () => call("/api/integrations/google-business-profile/sync"), "Google listings refreshed.")} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold hover:bg-slate-50 disabled:opacity-50">{busy === "refresh" ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}Refresh from Google</button>
        <button disabled={!selected.size || Boolean(busy)} onClick={() => run("import", () => call("/api/integrations/google-business-profile/import", { providerLocationIds: [...selected] }), `${selected.size} selected listings imported.`)} className="inline-flex items-center gap-2 rounded-lg bg-blue-700 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-800 disabled:opacity-50">{busy === "import" ? <Loader2 className="h-4 w-4 animate-spin" /> : <CloudUpload className="h-4 w-4" />}Import selected</button>
      </div>
    </div>
    {message && <div role="status" className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">{message}</div>}
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="hidden grid-cols-[36px_1.5fr_1fr_150px] gap-4 border-b bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 md:grid"><span /><span>Business listing</span><span>Google account</span><span>Status</span></div>
      {listings.map((item) => <article key={item.id} className="grid gap-3 border-b border-slate-100 px-4 py-4 last:border-0 md:grid-cols-[36px_1.5fr_1fr_150px] md:items-center md:gap-4">
        <input aria-label={`Select ${item.title}`} type="checkbox" disabled={item.imported} checked={item.imported || selected.has(item.id)} onChange={(event) => setSelected((current) => { const next = new Set(current); event.target.checked ? next.add(item.id) : next.delete(item.id); return next; })} className="h-4 w-4 rounded border-slate-300 text-blue-700" />
        <div><p className="font-semibold">{item.title}</p><p className="mt-1 text-xs leading-5 text-slate-500">{item.address || "Address not supplied by Google"}{item.phone ? ` · ${item.phone}` : ""}</p></div>
        <p className="text-xs text-slate-600">{item.account}</p>
        <div>{item.imported ? <><div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700"><CheckCircle2 className="h-4 w-4" />Editable</div><button disabled={Boolean(busy)} onClick={() => run(`push:${item.id}`, () => call(`/api/provider-locations/${item.id}/push`), `${item.title} was confirmed by Google.`)} className="mt-2 text-xs font-semibold text-blue-700 hover:underline">{busy === `push:${item.id}` ? "Publishing…" : "Publish changes"}</button></> : <span className="text-xs font-semibold text-amber-700">Ready to import</span>}</div>
      </article>)}
      {!listings.length && <div className="px-6 py-12 text-center"><p className="font-semibold">No manageable locations were returned.</p><p className="mt-2 text-sm text-slate-500">Check that this Google account is an owner or manager of at least one verified Business Profile.</p></div>}
    </div>
  </section>;
}

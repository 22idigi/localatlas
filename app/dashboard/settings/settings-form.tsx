"use client";

import { FormEvent, useState } from "react";
import { CheckCircle2, Loader2, TriangleAlert } from "lucide-react";

type Notice = { type: "success" | "error"; text: string };

export default function SettingsForm({ brandVoice, supportEmail }: { brandVoice: string; supportEmail: string }) {
  const [values, setValues] = useState({ brandVoice, supportEmail });
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);
  async function submit(event: FormEvent) {
    event.preventDefault(); setBusy(true); setNotice(null);
    const response = await fetch("/api/settings/profile", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(values) });
    const result = await response.json(); setBusy(false);
    setNotice(response.ok
      ? { type: "success", text: "Preferences saved." }
      : { type: "error", text: result.error ?? "Unable to save preferences." });
  }
  return <form onSubmit={submit} className="mt-8 max-w-2xl rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900"><label className="block text-sm font-medium">Brand voice<textarea required value={values.brandVoice} onChange={(event) => setValues({ ...values, brandVoice: event.target.value })} className="mt-2 min-h-24 w-full rounded-lg border border-zinc-200 bg-transparent p-3 text-sm dark:border-zinc-700" /></label><label className="mt-5 block text-sm font-medium">Support email<input value={values.supportEmail} onChange={(event) => setValues({ ...values, supportEmail: event.target.value })} type="email" className="mt-2 w-full rounded-lg border border-zinc-200 bg-transparent p-3 text-sm dark:border-zinc-700" /></label>{notice && <p role="status" className={`mt-4 flex items-center gap-2 text-sm ${notice.type === "success" ? "text-emerald-700" : "text-red-700"}`}>{notice.type === "success" ? <CheckCircle2 className="h-4 w-4" /> : <TriangleAlert className="h-4 w-4" />}{notice.text}</p>}<button disabled={busy} className="mt-6 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60">{busy && <Loader2 className="h-4 w-4 animate-spin" />}Save preferences</button></form>;
}

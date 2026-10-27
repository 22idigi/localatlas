"use client";

import { useState } from "react";
import { Check, CircleDot, Loader2 } from "lucide-react";

type Task = { id: string; title: string; reason: string; priority: string; effort: string; status: string; createdAt: string; updatedAt: string; dueAt: string | null; completedAt: string | null; location: { name: string } | null; finding: { source: string } | null };
const priorityStyles: Record<string, string> = { CRITICAL: "bg-rose-100 text-rose-800", HIGH_IMPACT: "bg-amber-100 text-amber-800", MEDIUM_IMPACT: "bg-blue-100 text-blue-800", MAINTENANCE: "bg-slate-100 text-slate-700" };

export default function TasksBoard({ initialTasks, canEdit }: { initialTasks: Task[]; canEdit: boolean }) {
  const [tasks, setTasks] = useState(initialTasks);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  async function complete(id: string) {
    setBusy(id); setError(null);
    const response = await fetch(`/api/tasks/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "COMPLETED" }) });
    const result = await response.json(); setBusy(null);
    if (!response.ok) return setError(result.error ?? "Unable to update task.");
    setTasks((current) => current.map((task) => task.id === id ? { ...task, status: "COMPLETED", completedAt: result.task.completedAt } : task));
  }
  const open = tasks.filter((task) => task.status !== "COMPLETED" && task.status !== "DISMISSED");
  const completed = tasks.filter((task) => task.status === "COMPLETED");
  return <main className="mx-auto max-w-6xl px-5 py-8 md:px-8 md:py-10"><header><p className="text-sm font-semibold text-blue-700">Optimisation plan</p><h1 className="mt-1 text-3xl font-semibold tracking-tight">Turn findings into accountable work.</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Tasks are generated only from saved audit findings. Expected effort is guidance, not a ranking or revenue promise.</p></header>{error && <p className="mt-5 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-900">{error}</p>}
    <section className="mt-8"><div className="flex items-center justify-between"><h2 className="font-semibold">Open tasks</h2><span className="text-sm text-slate-500">{open.length} remaining</span></div><div className="mt-3 space-y-3">{open.map((task) => <article key={task.id} className="rounded-2xl border border-slate-200 bg-white p-5"><div className="flex flex-wrap items-start justify-between gap-4"><div className="max-w-2xl"><div className="flex flex-wrap items-center gap-2"><span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${priorityStyles[task.priority] ?? priorityStyles.MAINTENANCE}`}>{task.priority.replaceAll("_", " ")}</span><span className="text-xs text-slate-500">{task.location?.name ?? "Organisation"} · {task.effort.toLowerCase()} effort</span></div><h3 className="mt-3 font-semibold">{task.title}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{task.reason}</p><p className="mt-2 text-xs text-slate-400">Source: {task.finding?.source ?? "Workspace task"}</p></div>{canEdit && <button onClick={() => complete(task.id)} disabled={busy === task.id} className="inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-3 py-2 text-xs font-semibold text-white disabled:opacity-60">{busy === task.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}Mark complete</button>}</div></article>)}{!open.length && <div className="rounded-2xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500"><CircleDot className="mx-auto mb-2 h-5 w-5" />Run a location audit to create evidence-based tasks.</div>}</div></section>
    {completed.length > 0 && <section className="mt-9"><h2 className="font-semibold">Completed</h2><div className="mt-3 divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white px-5">{completed.map((task) => <div key={task.id} className="flex items-center justify-between gap-4 py-4"><div><p className="text-sm font-medium text-slate-700">{task.title}</p><p className="mt-1 text-xs text-slate-500">{task.location?.name ?? "Organisation"}</p></div><Check className="h-4 w-4 text-emerald-700" /></div>)}</div></section>}
  </main>;
}

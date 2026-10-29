import Link from "next/link";
import { CheckCircle2, Circle, ExternalLink } from "lucide-react";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant";

export default async function OnboardingPage() {
  const tenant = await getTenantContext();
  if (!tenant) redirect("/login?callbackUrl=/app/onboarding");
  const [locations, connected] = await Promise.all([
    prisma.location.count({ where: { organizationId: tenant.organization.id } }),
    prisma.mapPlatform.count({ where: { location: { organizationId: tenant.organization.id }, syncState: "CONNECTED" } }),
  ]);
  const steps = [
    { title: "Account created", detail: "Your authenticated account is active.", done: true, href: null },
    { title: "Workspace created", detail: tenant.organization.name, done: true, href: null },
    { title: "Add a business location", detail: locations ? `${locations} location${locations === 1 ? "" : "s"} saved` : "Start in manual mode with approved business information.", done: locations > 0, href: "/app/locations" },
    { title: "Connect Google Business Profile", detail: connected ? `${connected} authorised profile${connected === 1 ? "" : "s"}` : "Requires approved Google Business Profile API credentials and account permission.", done: connected > 0, href: "/app/integrations" },
    { title: "Run the first audit", detail: "Create a documented profile-completeness score and tasks.", done: false, href: "/app/locations" },
  ];
  const progress = Math.round((steps.filter((step) => step.done).length / steps.length) * 100);
  return <main className="mx-auto max-w-4xl px-5 py-10"><p className="text-sm font-semibold text-blue-700">Workspace setup</p><h1 className="mt-1 text-3xl font-semibold tracking-tight">Get to a useful first result.</h1><p className="mt-2 text-sm text-slate-600">Manual mode is fully labelled. Provider operations stay unavailable until credentials and approvals are confirmed.</p><div className="mt-7 rounded-2xl border border-slate-200 bg-white p-6"><div className="flex items-center justify-between text-sm"><span className="font-semibold">Setup progress</span><span className="text-slate-500">{progress}%</span></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-blue-700" style={{ width: `${progress}%` }} /></div><ol className="mt-7 space-y-4">{steps.map((step, index) => <li key={step.title} className="flex gap-3 rounded-xl border border-slate-100 p-4">{step.done ? <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" /> : <Circle className="mt-0.5 h-5 w-5 shrink-0 text-slate-300" />}<div className="min-w-0 flex-1"><p className="text-sm font-semibold">{index + 1}. {step.title}</p><p className="mt-1 text-xs leading-5 text-slate-500">{step.detail}</p></div>{step.href && <Link href={step.href} className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700">Open <ExternalLink className="h-3 w-3" /></Link>}</li>)}</ol></div></main>;
}

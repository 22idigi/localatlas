import Link from "next/link";
import { CheckCircle2, CircleAlert, ExternalLink, LockKeyhole } from "lucide-react";
import { redirect } from "next/navigation";
import { getTenantContext } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";

export default async function IntegrationsPage() {
  const tenant = await getTenantContext();
  if (!tenant) redirect("/login?callbackUrl=/app/integrations");
  const gsc = await prisma.integrationConnection.findUnique({
    where: { organizationId_provider: { organizationId: tenant.organization.id, provider: "GOOGLE_SEARCH_CONSOLE" } },
    include: { _count: { select: { searchConsoleProperties: true } } },
  });
  const integrations = [
    { name: "Google Search Console", status: gsc ? `${gsc._count.searchConsoleProperties} properties discovered` : "Ready to connect", detail: gsc ? `Read-only search performance is connected${gsc.externalAccountEmail ? ` for ${gsc.externalAccountEmail}` : ""}.` : "Connect once to discover every Search Console property the chosen Google account can access, then select the property to report on.", ready: gsc?.status === "CONNECTED", href: gsc ? "/app/search-console" : "/api/integrations/google-search-console/connect", action: gsc ? "View performance" : "Connect Google" },
    { name: "Google Business Profile", status: "Requires approval", detail: "The adapter and tenant model are prepared. Live account discovery and publishing require a Google Cloud project approved for Business Profile APIs.", ready: false },
    { name: "Bing Places", status: "Partner access required", detail: "Microsoft sign-in is not proof of Bing Places publishing access. A supported partner contract or approved interface is required.", ready: false },
    { name: "Razorpay", status: process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET ? "Server credentials detected" : "Not configured", detail: "Checkout remains unavailable until plan IDs, webhook validation and a test subscription are verified.", ready: Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) },
    { name: "Manual workspace", status: "Available", detail: "Tenant-isolated locations, profile audits, optimisation tasks and activity logs are available without an external provider.", ready: true },
  ];
  return <main className="mx-auto max-w-5xl px-5 py-8 md:px-8 md:py-10"><header><p className="text-sm font-semibold text-blue-700">Integration health</p><h1 className="mt-1 text-3xl font-semibold tracking-tight">Connect only what is genuinely authorised.</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">11i Maps does not present demo or unavailable provider data as live. Credentials are encrypted server-side and never displayed here.</p></header><section className="mt-8 grid gap-4 md:grid-cols-2">{integrations.map((item) => <article key={item.name} className="rounded-2xl border border-slate-200 bg-white p-5"><div className="flex items-start justify-between gap-3"><div><h2 className="font-semibold">{item.name}</h2><p className={`mt-1 text-xs font-semibold ${item.ready ? "text-emerald-700" : "text-amber-700"}`}>{item.status}</p></div>{item.ready ? <CheckCircle2 className="h-5 w-5 text-emerald-700" /> : <CircleAlert className="h-5 w-5 text-amber-700" />}</div><p className="mt-4 text-sm leading-6 text-slate-600">{item.detail}</p>{item.href ? <Link href={item.href} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-700 px-3.5 py-2 text-xs font-semibold text-white hover:bg-blue-800">{item.action}<ExternalLink className="h-3.5 w-3.5" /></Link> : !item.ready && <div className="mt-4 flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500"><LockKeyhole className="h-3.5 w-3.5" />Disabled until prerequisites are verified</div>}</article>)}</section></main>;
}

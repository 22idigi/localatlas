import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant";

export const metadata: Metadata = { title: "Platform administration", robots: { index: false, follow: false } };
export default async function AdminPage() {
  const tenant = await getTenantContext();
  if (!tenant) redirect("/login?callbackUrl=/admin");
  if (!tenant.isPlatformAdmin) notFound();
  const [organizations, users, locations, failedSyncs] = await Promise.all([
    prisma.organization.count(), prisma.user.count(), prisma.location.count(), prisma.mapPlatform.count({ where: { syncState: "FAILED" } }),
  ]);
  return <main className="min-h-screen bg-slate-950 px-6 py-12 text-white"><div className="mx-auto max-w-6xl"><p className="text-sm font-semibold text-blue-300">11i internal administration</p><h1 className="mt-1 text-3xl font-semibold">Platform operations</h1><p className="mt-2 text-sm text-slate-400">Restricted by the PLATFORM_SUPER_ADMIN membership role.</p><section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[["Organisations", organizations], ["Users", users], ["Locations", locations], ["Failed syncs", failedSyncs]].map(([label, value]) => <div key={label} className="rounded-2xl border border-white/10 bg-white/5 p-5"><p className="text-3xl font-semibold">{value}</p><p className="mt-1 text-sm text-slate-400">{label}</p></div>)}</section></div></main>;
}

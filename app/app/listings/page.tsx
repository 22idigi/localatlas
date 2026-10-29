import Link from "next/link";
import { redirect } from "next/navigation";
import { CircleAlert, LockKeyhole, ShieldCheck } from "lucide-react";
import { getTenantContext } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { ListingsManager } from "./listings-manager";

export default async function ListingsPage() {
  const tenant = await getTenantContext();
  if (!tenant) redirect("/login?callbackUrl=/app/listings");
  const connection = await prisma.integrationConnection.findUnique({ where: { organizationId_provider: { organizationId: tenant.organization.id, provider: "GOOGLE_BUSINESS_PROFILE" } } });
  const remotes = connection ? await prisma.providerLocation.findMany({ where: { organizationId: tenant.organization.id, provider: "GOOGLE_BUSINESS_PROFILE" }, include: { providerAccount: true }, orderBy: [{ title: "asc" }] }) : [];
  const listings = remotes.map((item) => {
    const address = (item.address ?? {}) as Record<string, string | null>;
    return { id: item.id, title: item.title, account: item.providerAccount.displayName, address: [address.addressLine1, address.city, address.state, address.postalCode].filter(Boolean).join(", "), phone: item.phone, imported: Boolean(item.localLocationId), syncState: item.syncState, lastReadAt: item.lastReadAt?.toISOString() ?? null, lastWrittenAt: item.lastWrittenAt?.toISOString() ?? null };
  });
  return <main className="mx-auto max-w-6xl px-5 py-8 md:px-8 md:py-10">
    <header className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-sm font-semibold text-blue-700">Map listings</p><h1 className="mt-1 text-3xl font-semibold tracking-tight">Manage every authorised Google location.</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Connect once, choose the locations you serve, edit them in <Link href="/app/locations" className="font-semibold text-blue-700">Locations</Link>, then publish verified NAP changes back to Google.</p></div><div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800"><ShieldCheck className="h-4 w-4" />Encrypted OAuth · tenant isolated</div></header>
    {!connection ? <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50"><LockKeyhole className="h-5 w-5 text-blue-700" /></div><h2 className="mt-4 text-xl font-semibold">Connect Google Business Profile</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Use a Google account that owns or manages your profiles. For client work, the client can grant your agency account Manager access first. Google will show the exact permission before consent.</p><Link href="/api/integrations/google-business-profile/connect" className="mt-5 inline-flex rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800">Connect Google</Link></section> : connection.status === "PENDING_APPROVAL" ? <section className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-5"><div className="flex gap-3"><CircleAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" /><div><h2 className="font-semibold text-amber-950">Google API approval is pending</h2><p className="mt-1 text-sm leading-6 text-amber-900">Consent succeeded, but Google has not enabled Business Profile API access for this Cloud project yet. Your encrypted connection is retained and discovery can be retried after approval.</p></div></div></section> : <ListingsManager listings={listings} />}
  </main>;
}

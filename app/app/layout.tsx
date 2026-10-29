import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { BarChart3, ClipboardCheck, ListTree, LogOut, MapPinned, MessageSquareText, PlugZap, SearchCheck, Settings, Workflow } from "lucide-react";
import { getTenantContext } from "@/lib/tenant";

export const metadata: Metadata = { title: "Workspace", robots: { index: false, follow: false } };
const navigation = [
  [BarChart3, "Overview", "/app"],
  [Workflow, "Operations", "/app/operations"],
  [MapPinned, "Locations", "/app/locations"],
  [ListTree, "Map listings", "/app/listings"],
  [MessageSquareText, "Reviews", "/app/reviews"],
  [SearchCheck, "Search Console", "/app/search-console"],
  [ClipboardCheck, "Tasks", "/app/tasks"],
  [PlugZap, "Integrations", "/app/integrations"],
] as const;

export default async function ProductLayout({ children }: { children: React.ReactNode }) {
  const tenant = await getTenantContext();
  if (!tenant) redirect("/login?callbackUrl=/app");
  return <div className="min-h-screen bg-slate-50 text-slate-950">
    <aside className="fixed inset-y-0 hidden w-64 border-r border-slate-200 bg-white px-4 py-5 lg:block">
      <Link href="/app" className="flex items-center gap-3 px-2"><Image src="/11i-maps-logo.png" width={96} height={42} alt="11i Maps" className="h-9 w-auto object-contain" /></Link>
      <div className="mt-8 rounded-xl bg-slate-50 p-3"><p className="truncate text-sm font-semibold">{tenant.organization.name}</p><p className="mt-1 text-xs capitalize text-slate-500">{tenant.membership.role.toLowerCase().replaceAll("_", " ")}</p></div>
      <nav className="mt-6 space-y-1">{navigation.map(([Icon, label, href]) => <Link key={href} href={href} className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-blue-50 hover:text-blue-800"><Icon className="h-4 w-4" />{label}</Link>)}</nav>
      <div className="absolute inset-x-4 bottom-5 space-y-1"><Link href="/app/onboarding" className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-500 hover:bg-slate-50"><Settings className="h-4 w-4" />Workspace setup</Link><a href="/api/auth/signout" className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-500 hover:bg-slate-50"><LogOut className="h-4 w-4" />Sign out</a></div>
    </aside>
    <header className="border-b border-slate-200 bg-white px-4 py-3 lg:hidden"><div className="flex items-center justify-between"><Image src="/11i-maps-logo.png" width={78} height={34} alt="11i Maps" className="h-8 w-auto" /><span className="max-w-[55%] truncate text-xs font-medium text-slate-500">{tenant.organization.name}</span></div><nav className="mt-3 flex gap-1 overflow-x-auto">{navigation.map(([Icon, label, href]) => <Link key={href} href={href} className="flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-slate-600 hover:bg-blue-50"><Icon className="h-3.5 w-3.5" />{label}</Link>)}</nav></header>
    <div className="lg:pl-64">{children}</div>
  </div>;
}

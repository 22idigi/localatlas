import { getTenantContext } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import SettingsForm from "./settings-form";

export default async function SettingsPage() {
  const tenant = await getTenantContext();
  if (!tenant) return null;
  const user = await prisma.user.findUnique({ where: { id: tenant.user.id }, select: { brandVoice: true, supportEmail: true } });
  return <main className="px-6 py-8 md:px-10"><header><p className="text-sm text-zinc-500">Workspace settings</p><h1 className="mt-1 text-3xl font-semibold tracking-tight">Set the voice your customers hear.</h1></header><SettingsForm brandVoice={user?.brandVoice ?? "warm, helpful, and concise"} supportEmail={user?.supportEmail ?? ""} /></main>;
}

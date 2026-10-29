import { redirect } from "next/navigation";

// Keep the original URL working while the tenant-aware product lives at /app.
export default function LegacyDashboardPage() {
  redirect("/app");
}

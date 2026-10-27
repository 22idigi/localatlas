import type { Location, MapPlatform, Media } from "@prisma/client";

type AuditableLocation = Location & {
  platforms: Pick<MapPlatform, "syncState" | "externalLocationId">[];
  media: Pick<Media, "id">[];
};

export type AuditFindingInput = {
  code: string;
  title: string;
  detail: string;
  passed: boolean;
  weight: number;
  source: string;
  priority: "CRITICAL" | "HIGH_IMPACT" | "MEDIUM_IMPACT" | "MAINTENANCE";
  effort: "LOW" | "MEDIUM" | "HIGH";
};

export function evaluateProfile(location: AuditableLocation) {
  const fullAddress = Boolean(location.addressLine1 && location.city && location.state && location.postalCode && location.country);
  const checks: AuditFindingInput[] = [
    { code: "profile.name", title: "Business name", detail: "Use the verified real-world business name consistently.", passed: Boolean(location.name.trim()), weight: 10, source: "Manual location profile", priority: "CRITICAL", effort: "LOW" },
    { code: "profile.address", title: "Complete address", detail: "Add a complete address or explicitly configure the business as a service-area business.", passed: fullAddress, weight: 15, source: "Manual location profile", priority: "CRITICAL", effort: "LOW" },
    { code: "profile.phone", title: "Customer phone", detail: "Add a monitored local or primary customer-service phone number.", passed: location.phone.replace(/\D/g, "").length >= 7, weight: 10, source: "Manual location profile", priority: "HIGH_IMPACT", effort: "LOW" },
    { code: "profile.website", title: "Website URL", detail: "Link the location to its most relevant, indexable landing page.", passed: Boolean(location.websiteUrl), weight: 10, source: "Manual location profile", priority: "HIGH_IMPACT", effort: "LOW" },
    { code: "profile.category", title: "Primary category", detail: "Select the category that most accurately describes the location's core business.", passed: Boolean(location.primaryCategory), weight: 15, source: "Manual location profile", priority: "HIGH_IMPACT", effort: "MEDIUM" },
    { code: "profile.hours", title: "Operating hours", detail: "Add normal opening hours and maintain special hours for holidays.", passed: Boolean(location.hours && Object.keys(location.hours as object).length), weight: 15, source: "Manual location profile", priority: "HIGH_IMPACT", effort: "LOW" },
    { code: "profile.connection", title: "Authorised directory connection", detail: "Connect an authorised provider account before attempting to publish changes.", passed: location.platforms.some((platform) => platform.syncState === "CONNECTED" && platform.externalLocationId), weight: 10, source: "Connected provider metadata", priority: "HIGH_IMPACT", effort: "MEDIUM" },
    { code: "profile.media", title: "Location media", detail: "Add current, accurately labelled storefront, interior, team or service photos.", passed: location.media.length >= 3, weight: 15, source: "11i media library", priority: "MEDIUM_IMPACT", effort: "MEDIUM" },
  ];
  const score = checks.reduce((total, check) => total + (check.passed ? check.weight : 0), 0);
  return {
    score,
    inputCoverage: 100,
    methodologyVersion: "profile-v1",
    sourceSummary: {
      scoreType: "11i Maps profile completeness score",
      officialGoogleScore: false,
      inputs: ["Manual location profile", "Connected provider metadata", "11i media library"],
      unavailable: ["Google performance metrics", "licensed geo-grid rankings", "website Core Web Vitals"],
    },
    findings: checks,
  };
}

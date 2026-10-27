import { describe, expect, it } from "vitest";
import { evaluateProfile } from "./local-audit";

function location(overrides: Record<string, unknown> = {}) {
  return {
    id: "cm12345678901234567890123",
    userId: "cm12345678901234567890124",
    organizationId: "cm12345678901234567890125",
    name: "Example Clinic",
    addressLine1: "12 Main Road",
    addressLine2: null,
    city: "Hyderabad",
    state: "Telangana",
    postalCode: "500001",
    country: "IN",
    phone: "+91 98851 11101",
    websiteUrl: "https://example.com/hyderabad",
    primaryCategory: "Medical clinic",
    hours: { monday: [{ open: "09:00", close: "18:00" }] },
    createdAt: new Date("2026-10-01T00:00:00Z"),
    updatedAt: new Date("2026-10-01T00:00:00Z"),
    platforms: [{ syncState: "CONNECTED", externalLocationId: "locations/123" }],
    media: [{ id: "media-1" }, { id: "media-2" }, { id: "media-3" }],
    ...overrides,
  } as unknown as Parameters<typeof evaluateProfile>[0];
}

describe("evaluateProfile", () => {
  it("returns 100 only when every documented profile input passes", () => {
    const result = evaluateProfile(location());
    expect(result.score).toBe(100);
    expect(result.inputCoverage).toBe(100);
    expect(result.findings.every((finding) => finding.passed)).toBe(true);
  });

  it("creates failed findings from missing saved inputs without inventing provider data", () => {
    const result = evaluateProfile(location({ websiteUrl: null, primaryCategory: null, hours: null, platforms: [], media: [] }));
    expect(result.score).toBe(35);
    expect(result.findings.filter((finding) => !finding.passed).map((finding) => finding.code)).toEqual([
      "profile.website",
      "profile.category",
      "profile.hours",
      "profile.connection",
      "profile.media",
    ]);
  });

  it("labels the score as an 11i score and declares unavailable external sources", () => {
    const result = evaluateProfile(location());
    expect(result.sourceSummary.officialGoogleScore).toBe(false);
    expect(result.sourceSummary.unavailable).toContain("licensed geo-grid rankings");
    expect(result.methodologyVersion).toBe("profile-v1");
  });
});

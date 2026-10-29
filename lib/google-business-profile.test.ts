import { describe, expect, it } from "vitest";
import { canonicalToGooglePayload, normalizeGoogleLocation } from "./google-business-profile";

describe("Google Business Profile data mapping", () => {
  it("normalizes Google location data without inventing missing values", () => {
    const value = normalizeGoogleLocation({
      name: "locations/123",
      title: "11i Jubilee Hills",
      phoneNumbers: { primaryPhone: "+919885111101" },
      websiteUri: "https://11i.co",
      storefrontAddress: { addressLines: ["Road 36", "Jubilee Hills"], locality: "Hyderabad", administrativeArea: "Telangana", postalCode: "500033", regionCode: "IN" },
      categories: { primaryCategory: { name: "gcid:marketing_agency", displayName: "Marketing agency" } },
    });
    expect(value.externalLocationId).toBe("locations/123");
    expect(value.address).toEqual({ addressLine1: "Road 36", addressLine2: "Jubilee Hills", city: "Hyderabad", state: "Telangana", postalCode: "500033", country: "IN" });
    expect(value.primaryCategory).toBe("Marketing agency");
  });

  it("creates an explicit update mask for only supported canonical fields", () => {
    const { payload, updateMask } = canonicalToGooglePayload({ name: "11i", addressLine1: "Road 36", city: "Hyderabad", state: "Telangana", postalCode: "500033", country: "IN", phone: "+919885111101", websiteUrl: "https://11i.co" });
    expect(updateMask).toBe("title,storefrontAddress,phoneNumbers,websiteUri");
    expect(payload).toMatchObject({ title: "11i", phoneNumbers: { primaryPhone: "+919885111101" } });
  });
});

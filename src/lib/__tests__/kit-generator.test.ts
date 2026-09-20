import { describe, it, expect } from "vitest";
import { generatePressKitDoc, generateTechRiderDoc } from "../kit-generator";
import { DJ_EMY } from "../artist";

describe("generateTechRiderDoc", () => {
  it("pulls the real equipment list from her profile, not placeholder text", () => {
    const doc = generateTechRiderDoc();
    expect(doc).toContain(DJ_EMY.techRider.mixer[0]);
    expect(doc).toContain(DJ_EMY.techRider.players[0]);
    expect(doc).toContain(DJ_EMY.techRider.monitors);
    expect(doc).toContain(DJ_EMY.management.email);
  });

  it("includes every hospitality rider line", () => {
    const doc = generateTechRiderDoc();
    for (const item of DJ_EMY.hospitalityRider) expect(doc).toContain(item);
  });
});

describe("generatePressKitDoc", () => {
  it("pulls her real bio facts and appearances, not fabricated ones", () => {
    const doc = generatePressKitDoc();
    expect(doc).toContain(DJ_EMY.name);
    for (const a of DJ_EMY.selectedAppearances) expect(doc).toContain(a);
    for (const s of DJ_EMY.sellingPoints) expect(doc).toContain(s);
  });

  it("names the management company as the booking contact, not the artist directly", () => {
    const doc = generatePressKitDoc();
    expect(doc).toContain(DJ_EMY.management.company);
    expect(doc).toContain(DJ_EMY.management.email);
  });
});

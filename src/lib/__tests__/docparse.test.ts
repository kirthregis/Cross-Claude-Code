import { describe, it, expect } from "vitest";
import {
  parseDocText, mergeDocs, findIban, findSwift,
  findTradeLicence, findLegalName, findBankName,
} from "../docparse";

const LICENCE = `
GOVERNMENT OF DUBAI
DEVELOPMENT AUTHORITY
COMMERCIAL LICENCE

Trade Name: EMY VISION GROUP FZ-LLC
Licence No. 2410155.01
Legal Type: Free Zone Limited Liability Company
Issue Date: 15/01/2026    Expiry Date: 14/01/2027
Activity: Events Management, Artist Management
`;

const BANK = `
EVG — Mashreq Bank Details

Account Name: EMY VISION GROUP FZ-LLC
Bank: Mashreq Bank PSC
IBAN: AE73 0330 0000 1910 0000 000
SWIFT: BOMLAEAD
Branch: Business Bay
`;

describe("IBAN", () => {
  it("reads a spaced UAE IBAN and normalises it", () => {
    expect(findIban("IBAN: AE73 0330 0000 1910 0000 000")).toBe("AE730330000019100000000");
  });
  it("reads an unspaced IBAN", () => {
    expect(findIban("AE730330000019100000000")).toBe("AE730330000019100000000");
  });
  it("ignores non-IBAN text", () => {
    expect(findIban("no account details here")).toBeUndefined();
  });
});

describe("SWIFT", () => {
  it("prefers a labelled value", () => expect(findSwift("SWIFT: BOMLAEAD")).toBe("BOMLAEAD"));
  it("matches BIC label", () => expect(findSwift("BIC Code - EBILAEAD")).toBe("EBILAEAD"));
  it("falls back to shape", () => expect(findSwift("...BOMLAEAD...")).toBe("BOMLAEAD"));
});

describe("trade licence", () => {
  it("reads a dotted free-zone number", () => {
    expect(findTradeLicence("Licence No. 2410155.01")).toBe("2410155.01");
  });
  it("reads American spelling", () => {
    expect(findTradeLicence("Trade License Number: 1043567")).toBe("1043567");
  });
  it("reads a CN-style number", () => {
    expect(findTradeLicence("CN-1234567")).toBe("CN-1234567");
  });
  it("does not mistake a date for a licence number", () => {
    expect(findTradeLicence("License issued 15/01/2026")).not.toBe("15/01/2026");
  });
});

describe("entity and bank name", () => {
  it("finds an FZ-LLC entity", () => {
    expect(findLegalName(LICENCE)).toBe("EMY VISION GROUP FZ-LLC");
  });
  it("finds an LLC entity without a label", () => {
    expect(findLegalName("Issued to ACME EVENTS LLC for the year")).toBe("ACME EVENTS LLC");
  });
  it("finds a labelled bank", () => {
    expect(findBankName("Bank: Mashreq Bank PSC")).toMatch(/Mashreq/);
  });
  it("finds a known bank unlabelled", () => {
    expect(findBankName("Statement issued by Emirates NBD")).toMatch(/Emirates NBD/);
  });
});

describe("whole documents", () => {
  it("parses a business licence", () => {
    const d = parseDocText(LICENCE);
    expect(d.legalName).toBe("EMY VISION GROUP FZ-LLC");
    expect(d.tradeLicenceNo).toBe("2410155.01");
  });

  it("parses a bank details sheet", () => {
    const d = parseDocText(BANK);
    expect(d.accountName).toBe("EMY VISION GROUP FZ-LLC");
    expect(d.bankName).toMatch(/Mashreq/);
    expect(d.iban).toBe("AE730330000019100000000");
    expect(d.swift).toBe("BOMLAEAD");
  });

  it("merges licence + bank into one complete record", () => {
    const m = mergeDocs([parseDocText(LICENCE), parseDocText(BANK)]);
    expect(m.legalName).toBe("EMY VISION GROUP FZ-LLC");
    expect(m.tradeLicenceNo).toBe("2410155.01");
    expect(m.iban).toBe("AE730330000019100000000");
    expect(m.missing).toHaveLength(0);
  });

  it("reports exactly what is still missing", () => {
    const d = parseDocText("Trade Name: SOME COMPANY LLC");
    expect(d.missing).toContain("IBAN");
    expect(d.missing).toContain("Trade licence number");
    expect(d.missing).not.toContain("Registered legal entity name");
  });

  it("never leaks more than a bounded preview", () => {
    const d = parseDocText("x".repeat(50_000));
    expect(d.preview.length).toBeLessThanOrEqual(4000);
  });
});

/**
 * Document import: read EVG's business licence and bank details straight from
 * the PDFs, so sensitive numbers never have to be retyped or pasted into a chat.
 *
 * Everything here runs server-side on the machine you deploy to. Extracted
 * values are written to the local SQLite profile and nowhere else.
 */

export interface ExtractedDoc {
  /** Registered entity name, e.g. "EMY VISION GROUP FZ-LLC". */
  legalName?: string;
  tradeLicenceNo?: string;
  accountName?: string;
  bankName?: string;
  iban?: string;
  swift?: string;
  /** Fields we could not find, so the UI can ask for them explicitly. */
  missing: string[];
  /** Raw text, for the "check what was read" panel. Never persisted. */
  preview: string;
}

/** UAE IBANs: AE + 2 check digits + 19 digits = 23 chars. */
const IBAN_RE = /\bAE\d{2}[\s-]?(?:\d[\s-]?){19}\b/i;
const SWIFT_RE = /\b([A-Z]{4}AE[A-Z0-9]{2}(?:[A-Z0-9]{3})?)\b/;

const clean = (s: string) => s.replace(/\s+/g, " ").trim();

/**
 * Licence numbers vary by free zone: "2410155.01", "CN-1234567", "1043567".
 * We anchor on the label rather than the shape, which is far more reliable.
 */
export function findTradeLicence(text: string): string | undefined {
  const labels = [
    /(?:trade\s*)?licen[cs]e\s*(?:no\.?|number|#)?\s*[:\-]?\s*([A-Z0-9][A-Z0-9.\-\/]{4,24})/i,
    /\bregistration\s*(?:no\.?|number)\s*[:\-]?\s*([A-Z0-9][A-Z0-9.\-\/]{4,24})/i,
    /\bCN[-\s]?(\d{6,10})\b/i,
  ];
  // Scan ALL matches of each pattern, not just the first. Licences carry bare
  // headings like "COMMERCIAL LICENCE" that match the label but capture the
  // following word — we must skip those and keep looking, not give up.
  for (const re of labels) {
    const global = new RegExp(re.source, re.flags.includes("g") ? re.flags : re.flags + "g");
    for (const m of text.matchAll(global)) {
      const raw = m[1];
      if (!raw) continue;
      const v = raw.replace(/[.\s]+$/, "");
      if (/^\d{1,2}\/\d{1,2}\/\d{2,4}$/.test(v)) continue;  // a date
      if (!/\d/.test(v)) continue;                            // must contain a digit
      return /^\d/.test(v) && re.source.includes("CN") ? `CN-${v}` : v;
    }
  }
  return undefined;
}

export function findIban(text: string): string | undefined {
  const m = text.match(IBAN_RE);
  return m ? m[0].replace(/[\s-]/g, "").toUpperCase() : undefined;
}

export function findSwift(text: string): string | undefined {
  // Prefer an explicitly labelled value; fall back to shape matching.
  const labelled = text.match(/\b(?:swift|bic)(?:\s*code)?\s*[:\-]?\s*([A-Z0-9]{8,11})\b/i);
  if (labelled?.[1]) return labelled[1].toUpperCase();
  const m = text.match(SWIFT_RE);
  return m ? m[1].toUpperCase() : undefined;
}

export function findBankName(text: string): string | undefined {
  const labelled = text.match(/\bbank(?:\s*name)?\s*[:\-]\s*([A-Za-z][A-Za-z.&' ]{3,40})/i);
  if (labelled?.[1]) return clean(labelled[1]);
  const known = text.match(/\b(Mashreq(?:\s*Bank)?(?:\s*PSC)?|Emirates NBD|ADCB|First Abu Dhabi Bank|FAB|RAKBANK|Dubai Islamic Bank|ADIB|HSBC|Citibank|Standard Chartered|Wio(?:\s*Bank)?)\b/i);
  return known ? clean(known[1]) : undefined;
}

/** Entity names in the Gulf almost always carry a legal suffix. */
export function findLegalName(text: string): string | undefined {
  const labelled = text.match(
    /\b(?:account\s*name|company\s*name|legal\s*name|name\s*of\s*(?:company|establishment)|trade\s*name|beneficiary)\s*[:\-]\s*(.+)/i
  );
  if (labelled?.[1]) {
    const v = clean(labelled[1].split(/\s{2,}|\n/)[0]);
    if (v.length > 2 && v.length < 90) return v;
  }
  // Unlabelled: find a legal suffix and walk back over the CAPITALISED words
  // before it. Anchoring on capitalisation stops lower-case lead-ins like
  // "Issued to ..." being absorbed into the entity name.
  const SUFFIX = /\b(FZ[-\s]?LLC|FZ[-\s]?CO|FZCO|FZE|DMCC|L\.?L\.?C\.?|LLC|W\.?L\.?L\.?|PJSC|LTD)\b/g;
  for (const m of text.matchAll(SUFFIX)) {
    const before = text.slice(0, m.index);
    // Capitalised/numeric tokens immediately preceding the suffix.
    const head = before.match(/((?:[A-Z0-9][A-Za-z0-9&'.-]*\s+){1,6})$/);
    if (!head) continue;
    const name = clean(`${head[1]} ${m[1]}`);
    if (name.length > 4 && name.length < 90) return name;
  }
  return undefined;
}

export function findAccountName(text: string): string | undefined {
  const m = text.match(/\b(?:account\s*name|account\s*title|beneficiary(?:\s*name)?)\s*[:\-]\s*(.+)/i);
  if (m?.[1]) {
    const v = clean(m[1].split(/\s{2,}|\n/)[0]);
    if (v.length > 2 && v.length < 90) return v;
  }
  return undefined;
}

/**
 * Parse one document's text. Works for a business licence, a bank-details
 * sheet, a bank statement header, or a plain Markdown/text note — we just
 * take whatever fields are present and merge across documents upstream.
 */
export function parseDocText(text: string): ExtractedDoc {
  const legalName = findLegalName(text);
  const accountName = findAccountName(text) ?? legalName;

  const out: ExtractedDoc = {
    legalName,
    tradeLicenceNo: findTradeLicence(text),
    accountName,
    bankName: findBankName(text),
    iban: findIban(text),
    swift: findSwift(text),
    missing: [],
    preview: text.slice(0, 4000),
  };

  const need: [keyof ExtractedDoc, string][] = [
    ["legalName", "Registered legal entity name"],
    ["tradeLicenceNo", "Trade licence number"],
    ["accountName", "Account name"],
    ["bankName", "Bank name"],
    ["iban", "IBAN"],
  ];
  out.missing = need.filter(([k]) => !out[k]).map(([, label]) => label);
  return out;
}

/** Merge several documents; later non-empty values win over earlier blanks. */
export function mergeDocs(docs: ExtractedDoc[]): ExtractedDoc {
  const merged: ExtractedDoc = { missing: [], preview: "" };
  for (const d of docs) {
    merged.legalName ??= d.legalName;
    merged.tradeLicenceNo ??= d.tradeLicenceNo;
    merged.accountName ??= d.accountName;
    merged.bankName ??= d.bankName;
    merged.iban ??= d.iban;
    merged.swift ??= d.swift;
  }
  merged.preview = docs.map((d) => d.preview).join("\n\n---\n\n").slice(0, 8000);
  const need: [keyof ExtractedDoc, string][] = [
    ["legalName", "Registered legal entity name"],
    ["tradeLicenceNo", "Trade licence number"],
    ["accountName", "Account name"],
    ["bankName", "Bank name"],
    ["iban", "IBAN"],
  ];
  merged.missing = need.filter(([k]) => !merged[k]).map(([, label]) => label);
  return merged;
}

/**
 * Extract text from a PDF buffer. Plain text/markdown is passed through.
 *
 * pdf.js defaults to spawning a worker, but Next's server bundle doesn't emit
 * `pdf.worker.mjs` alongside the chunks, so the worker lookup fails at runtime
 * ("Cannot find module .next/server/chunks/pdf.worker.mjs"). We resolve the
 * worker from the installed package instead. Caught by an end-to-end upload
 * test — unit tests pass either way because they never spawn the worker.
 */
let workerReady = false;

export async function extractText(buf: Buffer, filename: string): Promise<string> {
  if (/\.(md|txt|csv)$/i.test(filename)) return buf.toString("utf8");
  const { PDFParse } = await import("pdf-parse");

  if (!workerReady) {
    try {
      const { createRequire } = await import("module");
      const require = createRequire(import.meta.url);
      PDFParse.setWorker(require.resolve("pdf-parse/dist/worker/pdf.worker.mjs"));
    } catch {
      // Fall back to the library default rather than failing the upload.
    }
    workerReady = true;
  }

  const parser = new PDFParse({ data: new Uint8Array(buf) });
  try {
    const r = await parser.getText();
    return r.text;
  } finally {
    await parser.destroy?.();
  }
}

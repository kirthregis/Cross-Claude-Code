import { NextResponse } from "next/server";
import { extractText, parseDocText, mergeDocs } from "@/lib/docparse";
import { saveProfile, profileGaps, registerProfileLoader } from "@/lib/profile-store";

registerProfileLoader();

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MAX_BYTES = 15 * 1024 * 1024;

/**
 * Upload the EVG business licence / bank details and have the fields read out
 * automatically. Files are parsed in memory and never written to disk; only
 * the extracted fields are persisted, to the local profile database.
 */
export async function POST(req: Request) {
  const form = await req.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: "expected multipart/form-data" }, { status: 400 });

  const files = form.getAll("files").filter((f): f is File => f instanceof File);
  if (!files.length) return NextResponse.json({ error: "no files supplied" }, { status: 400 });

  const apply = form.get("apply") === "true";
  const docs = [];
  const errors: string[] = [];

  for (const f of files) {
    if (f.size > MAX_BYTES) { errors.push(`${f.name}: larger than 15MB`); continue; }
    try {
      const text = await extractText(Buffer.from(await f.arrayBuffer()), f.name);
      if (!text.trim()) {
        errors.push(`${f.name}: no readable text — it may be a scanned image, which needs OCR. Type those fields in manually.`);
        continue;
      }
      docs.push(parseDocText(text));
    } catch (e) {
      errors.push(`${f.name}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  if (!docs.length) {
    return NextResponse.json({ error: "could not read any of the files", errors }, { status: 422 });
  }

  const found = mergeDocs(docs);

  // Two-step by design: preview first, then explicitly apply. Nothing is
  // written to the profile until the values on screen have been eyeballed.
  if (!apply) {
    return NextResponse.json({ found, errors, applied: false });
  }

  saveProfile({
    management: {
      ...(found.legalName ? { legalName: found.legalName } : {}),
      ...(found.tradeLicenceNo ? { tradeLicenceNo: found.tradeLicenceNo } : {}),
      ...(found.accountName || found.bankName || found.iban || found.swift
        ? {
            bank: {
              accountName: found.accountName ?? "",
              bankName: found.bankName ?? "",
              iban: found.iban ?? "",
              ...(found.swift ? { swift: found.swift } : {}),
            },
          }
        : {}),
    },
  } as never);

  return NextResponse.json({ found, errors, applied: true, gaps: profileGaps() });
}

/**
 * EMY Studio — real contacts, found and saved by the DJ herself.
 *
 * This deliberately never invents a contact. Every entry either came from
 * text she pasted in (an Instagram bio, a WhatsApp reply, a venue's own
 * "contact us" page — extractContactsFromText only pulls out an email,
 * phone or handle that is literally present in that text) or she typed it
 * in herself. See gigradar-ai.ts and community/page.tsx for what happens
 * when contact data is guessed instead: a batch of pitches to guessed
 * addresses bounced six times on EVG's sending domain on 11 Aug 2026.
 */

export interface SavedContact {
  id: string;
  name: string;
  role: string;
  venue: string;
  email: string;
  phone: string;
  whatsapp: string;
  instagram: string;
  notes: string;
  source: "manual" | "extracted";
  addedAt: number;
}

export interface ExtractedContact {
  email?: string;
  phone?: string;
  whatsapp?: string;
  instagram?: string;
}

const CONTACTS_KEY = "emy-real-contacts-v1";

/**
 * Pulls emails, phone numbers and Instagram handles out of free text.
 * Purely pattern-based — it only ever returns something that is literally
 * in the text, never a guess. International phone format (broader than the
 * UAE-only pattern in src/lib/extract.ts, since bookings span Qatar, Saudi,
 * and beyond): a leading + and 8-15 digits, allowing spaces/dashes.
 */
export function extractContactsFromText(text: string): ExtractedContact[] {
  const emails = Array.from(new Set(text.match(/[\w.+-]+@[\w-]+\.[\w.]+/g) ?? []));
  const phones = Array.from(new Set(text.match(/\+\d[\d\s-]{7,17}\d/g) ?? []))
    .map((p) => p.replace(/[\s-]/g, ""));
  const handles = Array.from(new Set(text.match(/(?<![\w@])@([A-Za-z0-9._]{2,30})/g) ?? []));

  const rows: ExtractedContact[] = [];
  const max = Math.max(emails.length, phones.length, handles.length, 1);
  for (let i = 0; i < max; i++) {
    const row: ExtractedContact = {};
    if (emails[i]) row.email = emails[i];
    if (phones[i]) { row.phone = phones[i]; row.whatsapp = phones[i]; }
    if (handles[i]) row.instagram = handles[i];
    if (row.email || row.phone || row.instagram) rows.push(row);
  }
  return rows;
}

export function getSavedContacts(): SavedContact[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(CONTACTS_KEY);
    return raw ? (JSON.parse(raw) as SavedContact[]) : [];
  } catch {
    return [];
  }
}

function persist(contacts: SavedContact[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(CONTACTS_KEY, JSON.stringify(contacts));
  } catch {
    /* best effort */
  }
}

export function saveContact(input: Partial<SavedContact> & { source: SavedContact["source"] }): SavedContact {
  const contacts = getSavedContacts();
  const contact: SavedContact = {
    id: input.id ?? `c_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    name: input.name ?? "",
    role: input.role ?? "",
    venue: input.venue ?? "",
    email: input.email ?? "",
    phone: input.phone ?? "",
    whatsapp: input.whatsapp ?? "",
    instagram: input.instagram ?? "",
    notes: input.notes ?? "",
    source: input.source,
    addedAt: input.addedAt ?? Date.now(),
  };
  const idx = contacts.findIndex((c) => c.id === contact.id);
  if (idx >= 0) contacts[idx] = contact;
  else contacts.unshift(contact);
  persist(contacts);
  return contact;
}

export function removeContact(id: string): void {
  persist(getSavedContacts().filter((c) => c.id !== id));
}

import { uaeSourcesAsLeads, UAE_VERIFIED_SOURCES } from "./uae";

export const ALL_SOURCES = UAE_VERIFIED_SOURCES;

export async function runAllSources() {
  const uaeLeads = uaeSourcesAsLeads();
  return { found: uaeLeads.length, inserted: 0, errors: [] };
}

export function sourceStatus() {
  return UAE_VERIFIED_SOURCES.map((s) => ({
    id: s.id,
    label: s.name,
    setup: `${s.area} - ${s.tier}`,
    configured: true,
  }));
}

export function channelStatus() {
  return [
    { id: "whatsapp", label: "WhatsApp", setup: "Auto-pitch via wa.me links", configured: true },
    { id: "email", label: "Email", setup: "mailto: links with pre-filled pitch", configured: true }
  ];
}

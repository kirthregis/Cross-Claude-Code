/**
 * Generates a real tech rider and a general press kit straight from her own
 * profile (artist.ts / profile-store overrides) — for when she hasn't
 * uploaded one of her own yet. Nothing here is gig-specific; see
 * contract.ts's generatePressPack() for the per-booking version.
 */
import { activeProfile } from "./active-profile";

export function generateTechRiderDoc(): string {
  const p = activeProfile();
  const r = p.techRider;
  const mixerList = r.mixer.map((i) => `- ${i}`).join("\n");
  const playersList = r.players.map((i) => `- ${i}`).join("\n");
  const boothList = r.booth.map((i) => `- ${i}`).join("\n");
  const connectivityList = r.connectivity.map((i) => `- ${i}`).join("\n");
  const notesList = r.notes.map((i) => `- ${i}`).join("\n");
  const hospitalityList = p.hospitalityRider.map((i) => `- ${i}`).join("\n");

  return `# TECHNICAL RIDER — ${p.name}
${p.tagline}

## DJ equipment (venue to provide, tested and working)
${mixerList}
${playersList}

## Monitoring
${r.monitors}

## Booth
${boothList}

## Connectivity
${connectivityList}

## Notes
${notesList}

## Hospitality
${hospitalityList}

## Contact for technical questions
${p.name} — ${p.management.company}
${p.phone} · ${p.management.phone} (Kirth, backup) · ${p.management.email}

*Generated from ${p.name}'s current profile on ${new Date().toLocaleDateString("en-GB")}. Replace this file any time by uploading her own tech rider, or regenerate after her equipment needs change.*
`;
}

export function generatePressKitDoc(): string {
  const p = activeProfile();
  const appearances = p.selectedAppearances.map((a) => `- ${a}`).join("\n");
  const sellingPoints = p.sellingPoints.map((s) => `- ${s}`).join("\n");
  const genres = [...p.genres, ...p.secondaryGenres].join(", ");

  return `# PRESS KIT — ${p.name}
${p.tagline}

## Bio
${p.name} is a ${p.tagline.toLowerCase()}, based in ${p.basedIn}. ${p.sellingPoints[0] ?? ""} ${p.sellingPoints[1] ?? ""}

## Genres
${genres}

## Languages
${p.languages.join(", ")}

## Selected appearances
${appearances}

## Why book her
${sellingPoints}

## Contact & socials
- Artist Instagram: ${p.instagram ?? "—"}
- Live sets: ${p.youtube ?? "—"}
- Management: ${p.management.company} (${p.management.instagram ?? p.management.email})
- Booking enquiries: ${p.phone} · ${p.management.phone} (Kirth, backup) · ${p.management.email}

## Approvals
All artwork, billing and content approvals go through ${p.management.company}, not to the Artist directly.

*Generated from ${p.name}'s current profile on ${new Date().toLocaleDateString("en-GB")}. Replace this file any time by uploading her own press kit, or regenerate after her bio or appearances change.*
`;
}

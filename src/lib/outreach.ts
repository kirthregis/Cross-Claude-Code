import { activeProfile } from "./active-profile";
import { quote } from "./pricing";
import { Gig } from "./types";

export function generateWhatsAppLink(gig: Gig) {
  const profile = activeProfile();
  const price = quote({
    venueTier: gig.venueTier ?? "unknown",
    setLengthMins: gig.setLengthMins ?? 120,
    slot: gig.slot ?? "unknown",
    eventDate: gig.eventDate,
    exclusivity: gig.exclusivity,
    travelRequired: gig.travelRequired,
    recurring: gig.recurring,
    budgetStatedAed: gig.budgetStatedAed,
  });

  const message = `Hi,

Re: ${gig.title}

DJ Emy is available for this date. 

Proposed fee: AED ${price.askAed.toLocaleString()}

EPK:
${profile.epkUrl}

Instagram:
${profile.instagram}

Please confirm event time + tech rider.

Regards,
${profile.management.contactName}
${profile.management.company}`;

  const cleanPhone = profile.management.phone.replace(/[^0-9]/g, "");
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}

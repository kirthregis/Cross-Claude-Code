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

EPK: ${profile.epkUrl}
Instagram: ${profile.instagram}

Please confirm event time and tech rider.

Regards,
${profile.management.contactName}
${profile.management.company}`;

  const cleanPhone = profile.management.phone.replace(/[^0-9]/g, "");
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}

export function generatePitch(gig: Gig) {
  const profile = activeProfile();
  return `Dear Booking Manager,

I am writing regarding the ${gig.title} opportunity.

DJ Emy is a GCC-based Afro House and open-format DJ with a strong track record at premium UAE venues including Zeus Jumeirah, Amwaj Rooftop, and as the official DJ for FIFA World Cup Qatar 2022.

EPK: ${profile.epkUrl}
Instagram: ${profile.instagram}
Email: ${profile.email}

Best regards,
${profile.management.contactName}
${profile.management.company}
${profile.management.phone}`;
}

export function pitch(gig: Gig) {
  return generatePitch(gig);
}

export function quoteFor(gig: Gig) {
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
  return {
    fee: price.askAed,
    target: price.targetAed,
    walkAway: price.walkAwayAed,
    currency: "AED",
    note: `Suggested fee for ${gig.title}`,
  };
}

export function contactStrategy(gig: Gig) {
  return {
    primary: "whatsapp",
    whatsappLink: generateWhatsAppLink(gig),
    emailSubject: `Booking Enquiry - ${gig.title}`,
    emailBody: generatePitch(gig),
  };
}

export function negotiationPlaybook(gig: Gig) {
  const q = quoteFor(gig);
  return {
    openingOffer: q.fee,
    minimumAcceptable: q.walkAway,
    idealFee: q.target,
    tips: [
      "Always confirm the date and set time first.",
      "Ask about sound system and backline.",
      "Request 50% deposit upfront.",
      "Confirm travel and accommodation if outside Dubai.",
    ],
  };
}

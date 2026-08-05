import { Gig } from "./types";

const EMY_PHONE = "971503443281";

export function generateWhatsAppLink(gig: Gig) {
  const message = `Hi! I saw the opening for "${gig.title}". I'm interested in discussing this for Emy. Let me know if you're looking for a DJ/Performer. Thanks!`;
  return `https://wa.me/${EMY_PHONE}?text=${encodeURIComponent(message)}`;
}

export function generatePitch(gig: Gig) {
  return `Dear Booking Manager,\n\nI am writing regarding the ${gig.title} opportunity. Emy's profile matches your requirements for high-end Dubai venues.\n\nBest regards,\nEmy Studio`;
}

export function pitch(gig: Gig) {
  return generatePitch(gig);
}

export function quoteFor(gig: Gig) {
  const base = gig.feeAed ?? 3000;
  return {
    fee: base,
    currency: "AED",
    note: `Suggested fee for ${gig.title}`,
  };
}

export function contactStrategy(gig: Gig) {
  return {
    primary: "whatsapp",
    whatsappLink: generateWhatsAppLink(gig),
    emailSubject: `Booking Enquiry — ${gig.title}`,
    emailBody: generatePitch(gig),
  };
}

export function negotiationPlaybook(gig: Gig) {
  return {
    openingOffer: gig.feeAed ?? 3000,
    minimumAcceptable: 1500,
    idealFee: 5000,
    tips: [
      "Always confirm the date and set time first.",
      "Ask about sound system and backline.",
      "Request 50% deposit upfront.",
      "Confirm travel and accommodation if outside Dubai.",
    ],
  };
}
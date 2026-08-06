export interface Invoice {
  id: string;
  gigId: string;
  venueName: string;
  date: string;
  amount: number;
  currency: string;
  status: "draft" | "sent" | "paid";
}

export function generateInvoiceText(invoice: Invoice, artistName: string): string {
  return "INVOICE: " + invoice.id + "\n" +
    "-----------------------------------\n" +
    "FROM: " + artistName + "\n" +
    "TO: " + invoice.venueName + "\n" +
    "DATE: " + invoice.date + "\n\n" +
    "DESCRIPTION: DJ Performance Fee\n" +
    "AMOUNT: " + invoice.amount + " " + invoice.currency + "\n\n" +
    "STATUS: " + invoice.status.toUpperCase() + "\n" +
    "-----------------------------------\n" +
    "Thank you for the booking.";
}

export interface TechRider {
  artistName: string;
  equipment: string[];
  monitoring: string;
  hospitality: string[];
}

export const DEFAULT_RIDER: TechRider = {
  artistName: "DJ EMY",
  equipment: ["2x Pioneer CDJ-3000", "1x Pioneer DJM-V10", "Ethernet Hub connected"],
  monitoring: "2x Pro grade monitors (stereo), ear level, controllable from mixer.",
  hospitality: ["4x Still water (room temp)", "1x Fresh fruit platter", "Clean towel"],
};
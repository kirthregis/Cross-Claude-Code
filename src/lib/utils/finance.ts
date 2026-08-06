export const UAE_VAT_RATE = 0.05;

export interface GigFinances {
  gigName: string;
  venueName: string;
  gigDate: string;
  fee: number;
  expenses: number;
  includeVat: boolean;
}

export interface GigFinancesResult {
  gross: number;
  vat: number;
  expenses: number;
  net: number;
  margin: number;
  total: number;
}

export function calculateGigNet(fin: GigFinances): GigFinancesResult {
  const vat = fin.includeVat ? fin.fee * UAE_VAT_RATE : 0;
  const net = fin.fee - fin.expenses;
  const total = fin.fee + vat;
  return {
    gross: fin.fee,
    vat,
    expenses: fin.expenses,
    net,
    margin: fin.fee > 0 ? Math.round((net / fin.fee) * 100) : 0,
    total,
  };
}

export function formatAED(amount: number): string {
  return new Intl.NumberFormat("en-AE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount) + " AED";
}

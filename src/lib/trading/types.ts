export type Candle = {
  date: string; // ISO calendar date, ascending and unique per symbol
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

export type Signal = "BUY" | "SELL" | "HOLD";

export type Position = {
  symbol: string;
  quantity: number;
  entryPrice: number;
  entryDate: string;
};

export type Fill = {
  date: string;
  symbol: string;
  side: "BUY" | "SELL";
  quantity: number;
  price: number;
  fee: number;
  reason: string;
};

export type Account = {
  startingCash: number;
  cash: number;
  positions: Record<string, Position>;
  fills: Fill[];
};

export type RiskConfig = {
  /** Never use margin. Position value is capped as a fraction of equity. */
  maxPositionFraction: number;
  /** Stop opening positions after this realized loss for a calendar day. */
  maxDailyLossFraction: number;
  /** A cap, not a profit promise. */
  maxOpenPositions: number;
  /** Avoid illiquid instruments where a backtest is least realistic. */
  minimumDollarVolume: number;
  /** Simulated execution cost in basis points, applied on every fill. */
  slippageBps: number;
  feePerOrder: number;
};

export const DEFAULT_RISK: RiskConfig = {
  maxPositionFraction: 0.1,
  maxDailyLossFraction: 0.02,
  maxOpenPositions: 5,
  minimumDollarVolume: 1_000_000,
  slippageBps: 5,
  feePerOrder: 1,
};

import type { Candle, Signal } from "./types";

export type StrategyConfig = {
  fastDays: number;
  slowDays: number;
  atrDays: number;
  /** Exit if price falls this many ATR below its post-entry high. */
  trailingAtr: number;
};

export const DEFAULT_STRATEGY: StrategyConfig = {
  fastDays: 20,
  slowDays: 60,
  atrDays: 20,
  trailingAtr: 3,
};

function sma(values: number[]): number | null {
  return values.length ? values.reduce((total, value) => total + value, 0) / values.length : null;
}

export function averageTrueRange(candles: Candle[], days: number): number | null {
  if (candles.length < days + 1) return null;
  const recent = candles.slice(-(days + 1));
  const ranges = recent.slice(1).map((candle, index) => {
    const priorClose = recent[index].close;
    return Math.max(candle.high - candle.low, Math.abs(candle.high - priorClose), Math.abs(candle.low - priorClose));
  });
  return sma(ranges);
}

/**
 * Long-only daily trend filter. It deliberately emits HOLD rather than trying to
 * predict every market move. A signal is not a recommendation or a profit forecast.
 */
export function trendSignal(candles: Candle[], config = DEFAULT_STRATEGY): Signal {
  if (candles.length < config.slowDays + 1) return "HOLD";
  const closes = candles.map((candle) => candle.close);
  const fast = sma(closes.slice(-config.fastDays));
  const slow = sma(closes.slice(-config.slowDays));
  const priorFast = sma(closes.slice(-(config.fastDays + 1), -1));
  const priorSlow = sma(closes.slice(-(config.slowDays + 1), -1));
  if (!fast || !slow || !priorFast || !priorSlow) return "HOLD";
  if (fast > slow && priorFast <= priorSlow) return "BUY";
  if (fast < slow && priorFast >= priorSlow) return "SELL";
  return "HOLD";
}

export function isLiquid(candle: Candle, minimumDollarVolume: number): boolean {
  return candle.close * candle.volume >= minimumDollarVolume;
}

import { describe, expect, it } from "vitest";
import { averageTrueRange, isLiquid } from "./strategy";
import { runPaperBacktest } from "./paper";
import type { Candle } from "./types";

function candles(days: number): Candle[] {
  return Array.from({ length: days }, (_, index) => {
    const close = index < 70 ? 100 : 100 + (index - 69) * 2;
    return { date: `2025-01-${String(index + 1).padStart(2, "0")}`, open: close, high: close + 1, low: close - 1, close, volume: 50_000 };
  });
}

describe("paper trading safety layer", () => {
  it("calculates ATR and rejects illiquid candles", () => {
    const data = [
      { date: "2025-01-01", open: 10, high: 12, low: 9, close: 11, volume: 1 },
      { date: "2025-01-02", open: 11, high: 13, low: 10, close: 12, volume: 1 },
      { date: "2025-01-03", open: 12, high: 14, low: 11, close: 13, volume: 1 },
    ];
    expect(averageTrueRange(data, 2)).toBe(3);
    expect(isLiquid({ ...data[2], volume: 10 }, 1_000)).toBe(false);
  });

  it("never uses margin and honors a one-position cap", () => {
    const result = runPaperBacktest(
      { AAA: candles(95), BBB: candles(95) },
      1_000,
      { maxPositionFraction: 0.1, maxDailyLossFraction: 0.02, maxOpenPositions: 1, minimumDollarVolume: 1, slippageBps: 5, feePerOrder: 1 },
    );
    expect(result.account.cash).toBeGreaterThanOrEqual(0);
    expect(result.snapshots.every((snapshot) => snapshot.positions <= 1)).toBe(true);
    expect(result.note).toContain("do not predict");
  });
});

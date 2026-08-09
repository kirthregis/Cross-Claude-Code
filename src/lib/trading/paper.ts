import { averageTrueRange, isLiquid, trendSignal, type StrategyConfig, DEFAULT_STRATEGY } from "./strategy";
import { DEFAULT_RISK, type Account, type Candle, type Fill, type Position, type RiskConfig } from "./types";

export type MarketData = Record<string, Candle[]>;
export type DailySnapshot = { date: string; equity: number; cash: number; positions: number };
export type BacktestResult = {
  account: Account;
  snapshots: DailySnapshot[];
  totalReturn: number;
  maxDrawdown: number;
  note: string;
};

export function emptyAccount(startingCash: number): Account {
  return { startingCash, cash: startingCash, positions: {}, fills: [] };
}

export function markToMarket(account: Account, prices: Record<string, number>): number {
  return account.cash + Object.values(account.positions).reduce((total, position) => total + position.quantity * (prices[position.symbol] ?? position.entryPrice), 0);
}

function executionPrice(close: number, side: "BUY" | "SELL", slippageBps: number): number {
  const adjustment = slippageBps / 10_000;
  return side === "BUY" ? close * (1 + adjustment) : close * (1 - adjustment);
}

function appendFill(account: Account, fill: Fill): void {
  account.fills.push(fill);
}

function dailyRealizedPnL(account: Account, date: string): number {
  // Conservative approximation: cash-flow from exits minus their corresponding entry cost.
  // It is used only as a circuit breaker, never as a measure of expected profit.
  return account.fills
    .filter((fill) => fill.date === date && fill.side === "SELL")
    .reduce((sum, sell) => {
      const entry = [...account.fills].reverse().find((fill) => fill.symbol === sell.symbol && fill.side === "BUY");
      return sum + (sell.price - (entry?.price ?? sell.price)) * sell.quantity - sell.fee;
    }, 0);
}

function closePosition(account: Account, position: Position, candle: Candle, risk: RiskConfig, reason: string): void {
  const price = executionPrice(candle.close, "SELL", risk.slippageBps);
  const gross = position.quantity * price;
  account.cash += gross - risk.feePerOrder;
  appendFill(account, { date: candle.date, symbol: position.symbol, side: "SELL", quantity: position.quantity, price, fee: risk.feePerOrder, reason });
  delete account.positions[position.symbol];
}

/**
 * Deterministic, long-only paper executor. There is intentionally no broker API,
 * credential field, or live-order path in this module.
 */
export function runPaperBacktest(
  market: MarketData,
  startingCash = 10_000,
  risk: RiskConfig = DEFAULT_RISK,
  strategy: StrategyConfig = DEFAULT_STRATEGY,
): BacktestResult {
  const account = emptyAccount(startingCash);
  const symbols = Object.keys(market).filter((symbol) => market[symbol].length > strategy.slowDays + 1);
  const dates = [...new Set(symbols.flatMap((symbol) => market[symbol].map((candle) => candle.date)))].sort();
  const peaks: Record<string, number> = {};
  const snapshots: DailySnapshot[] = [];
  let peakEquity = startingCash;
  let maxDrawdown = 0;

  for (const date of dates) {
    const current: Record<string, Candle> = {};
    for (const symbol of symbols) {
      const candle = market[symbol].find((item) => item.date === date);
      if (candle) current[symbol] = candle;
    }
    const prices = Object.fromEntries(Object.entries(current).map(([symbol, candle]) => [symbol, candle.close]));

    // Exits happen before entries, using data available at this daily close.
    for (const position of Object.values(account.positions)) {
      const candles = market[position.symbol].filter((candle) => candle.date <= date);
      const candle = current[position.symbol];
      if (!candle) continue;
      peaks[position.symbol] = Math.max(peaks[position.symbol] ?? position.entryPrice, candle.high);
      const atr = requireAtr(candles, strategy);
      const stopHit = atr !== null && candle.close < peaks[position.symbol] - strategy.trailingAtr * atr;
      if (trendSignal(candles, strategy) === "SELL" || stopHit) closePosition(account, position, candle, risk, stopHit ? "ATR trailing stop" : "trend exit");
    }

    const equity = markToMarket(account, prices);
    const lossLimitReached = dailyRealizedPnL(account, date) <= -equity * risk.maxDailyLossFraction;
    if (!lossLimitReached) {
      for (const symbol of symbols) {
        if (account.positions[symbol] || Object.keys(account.positions).length >= risk.maxOpenPositions) continue;
        const candle = current[symbol];
        if (!candle || !isLiquid(candle, risk.minimumDollarVolume)) continue;
        const candles = market[symbol].filter((item) => item.date <= date);
        if (trendSignal(candles, strategy) !== "BUY") continue;
        const price = executionPrice(candle.close, "BUY", risk.slippageBps);
        const allocation = Math.min(equity * risk.maxPositionFraction, account.cash - risk.feePerOrder);
        const quantity = Math.floor(allocation / price);
        if (quantity < 1) continue;
        account.cash -= quantity * price + risk.feePerOrder;
        account.positions[symbol] = { symbol, quantity, entryPrice: price, entryDate: date };
        peaks[symbol] = candle.high;
        appendFill(account, { date, symbol, side: "BUY", quantity, price, fee: risk.feePerOrder, reason: "trend entry" });
      }
    }

    const endEquity = markToMarket(account, prices);
    peakEquity = Math.max(peakEquity, endEquity);
    maxDrawdown = Math.max(maxDrawdown, (peakEquity - endEquity) / peakEquity);
    snapshots.push({ date, equity: endEquity, cash: account.cash, positions: Object.keys(account.positions).length });
  }

  const finalEquity = snapshots.at(-1)?.equity ?? startingCash;
  return {
    account,
    snapshots,
    totalReturn: (finalEquity - startingCash) / startingCash,
    maxDrawdown,
    note: "Paper simulation only. Historical results, including this result, do not predict future returns.",
  };
}

function requireAtr(candles: Candle[], strategy: StrategyConfig): number | null {
  return averageTrueRange(candles, strategy.atrDays);
}

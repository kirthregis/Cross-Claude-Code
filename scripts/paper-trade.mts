#!/usr/bin/env tsx
/**
 * Usage: npm run paper:trade -- ./data/candles
 * Each CSV must be named SYMBOL.csv and have Date,Open,High,Low,Close,Volume headers.
 * This is deliberately paper-only: it cannot connect to any exchange or broker.
 */
import { readdir, readFile } from "node:fs/promises";
import { basename, extname, join } from "node:path";
import { runPaperBacktest, type MarketData } from "../src/lib/trading/paper";
import type { Candle } from "../src/lib/trading/types";

function number(value: string | undefined, file: string, row: number): number {
  const parsed = Number(value?.trim());
  if (!Number.isFinite(parsed) || parsed < 0) throw new Error(`${file}:${row}: invalid non-negative number '${value}'`);
  return parsed;
}

function parseCsv(file: string, contents: string): Candle[] {
  const lines = contents.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];
  const columns = lines[0].split(",").map((header) => header.trim().toLowerCase());
  const index = (name: string) => {
    const found = columns.indexOf(name);
    if (found < 0) throw new Error(`${file}: missing '${name}' column`);
    return found;
  };
  const date = index("date"), open = index("open"), high = index("high"), low = index("low"), close = index("close"), volume = index("volume");
  const candles = lines.slice(1).map((line, indexRow) => {
    const parts = line.split(",");
    const row = indexRow + 2;
    const candle = { date: parts[date]?.trim() ?? "", open: number(parts[open], file, row), high: number(parts[high], file, row), low: number(parts[low], file, row), close: number(parts[close], file, row), volume: number(parts[volume], file, row) };
    if (!/^\d{4}-\d{2}-\d{2}$/.test(candle.date) || candle.low > candle.high || candle.open > candle.high || candle.open < candle.low || candle.close > candle.high || candle.close < candle.low) {
      throw new Error(`${file}:${row}: invalid OHLC row`);
    }
    return candle;
  });
  return candles.sort((a, b) => a.date.localeCompare(b.date));
}

async function main() {
  const directory = process.argv[2] ?? "./data/candles";
  const files = (await readdir(directory)).filter((file) => extname(file).toLowerCase() === ".csv");
  if (!files.length) throw new Error(`No CSVs found in ${directory}. See TRADING_BOT.md for the required format.`);
  const market: MarketData = {};
  for (const file of files) market[basename(file, ".csv").toUpperCase()] = parseCsv(file, await readFile(join(directory, file), "utf8"));
  const result = runPaperBacktest(market);
  const final = result.snapshots.at(-1);
  console.log("\nPAPER-ONLY BACKTEST — no orders were sent\n");
  console.table({
    symbolsLoaded: Object.keys(market).length,
    endingEquity: `$${(final?.equity ?? 10_000).toFixed(2)}`,
    totalReturn: `${(result.totalReturn * 100).toFixed(2)}%`,
    maxDrawdown: `${(result.maxDrawdown * 100).toFixed(2)}%`,
    fills: result.account.fills.length,
  });
  console.log(`\n${result.note}`);
  console.log("Review multiple market regimes, fees, taxes, liquidity, and out-of-sample results before considering any live deployment.");
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});

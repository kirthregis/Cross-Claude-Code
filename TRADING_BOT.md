# Paper Trading Research Bot

This repository now includes a **paper-only**, long-only daily trend research bot. It is not connected to a broker, exchange, wallet, payment method, or API key, and it has no code path that can place a real order.

## A necessary correction

No legitimate automated trading system can promise a profit, a daily profit, or `$100/day`. Markets can gap, trend sideways, become illiquid, or change regime; fees, slippage, taxes, data errors, and outages can turn a seemingly profitable backtest into a loss. A claim that a bot will reliably make money every day is a red flag, not a capability.

The goal of this implementation is to give you a reproducible way to research a diversified liquid universe with realistic friction and hard loss controls **before risking capital**. It is deliberately not a live-money bot.

## What it does

- accepts daily OHLCV CSVs for any symbols you choose to research;
- uses a 20/60-day moving-average crossover to enter long positions;
- exits on an opposite crossover or an ATR trailing stop;
- rejects low-dollar-volume candles;
- limits each simulated position to 10% of equity, five concurrent positions, and no leverage;
- models 5 bps of slippage and a $1 fee per simulated order;
- stops adding new positions after a 2% realized-loss daily circuit breaker;
- reports return, maximum drawdown, equity, and every simulated fill.

These are guardrails, not a guarantee of safety or profit.

## Run it

1. Create a local directory (it is git-ignored):

   ```bash
   mkdir -p data/candles
   ```

2. Place one daily-price CSV per symbol in it, for example `data/candles/EXAMPLE.csv`:

   ```csv
   Date,Open,High,Low,Close,Volume
   2025-01-02,100,102,99,101,2500000
   2025-01-03,101,103,100,102,2600000
   ```

   Dates must be ISO `YYYY-MM-DD`, rows must be daily and sortable, and all six columns are required. Use enough history for the slow 60-day indicator and preferably several years spanning both rising and falling markets.

3. Run the reproducible paper simulation:

   ```bash
   npm run paper:trade -- ./data/candles
   ```

No data is downloaded automatically and no order is sent. This prevents accidental execution and lets you choose licensed, reliable market data appropriate to your jurisdiction.

## Before any real-money decision

Do not promote a strategy based on a single profitable test. At a minimum, account for survivorship bias (including delisted assets), corporate actions, spread and market impact, taxes, borrow costs if shorting, different market regimes, and a fully unseen out-of-sample period. Start with a separate paper account and independently verify every fill. Consult a regulated financial professional if you need investment advice.

## Code locations

- `src/lib/trading/strategy.ts` — indicators and deterministic signal logic
- `src/lib/trading/paper.ts` — simulated executor and risk limits
- `src/lib/trading/types.ts` — typed data and safety configuration
- `scripts/paper-trade.mts` — CSV command-line runner

The absence of broker integration is intentional. It should stay that way unless a compliant, reviewed deployment process, robust monitoring, an emergency stop, and an explicit risk decision are in place.

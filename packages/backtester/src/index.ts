/**
 * Backtester Package
 */

export { CandleBasedBacktester } from './candle-backtester';

export type {
  BacktestConfig,
  BacktestTrade,
  BacktestMetrics,
  BacktestResult,
  SameCandlePolicy,
} from './candle-backtester';

export { BacktestExchangePort } from './backtest-exchange';

export type {
  BacktestExchangePortConfig,
  BacktestFillRecord,
  BacktestPortfolio,
} from './backtest-exchange';

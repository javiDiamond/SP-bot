/**
 * Backtester Package
 */

export {
  BacktestEngine,
} from './backtest-engine';

export {
  CandleBasedBacktester,
} from './candle-backtester';

export type {
  Candle,
  BacktestConfig as EngineBacktestConfig,
  BacktestTrade as EngineBacktestTrade,
  BacktestResult as EngineBacktestResult,
} from './backtest-engine';

export type {
  BacktestConfig as CandleBacktestConfig,
  BacktestTrade as CandleBacktestTrade,
  BacktestMetrics,
  BacktestResult as CandleBacktestResult,
} from './candle-backtester';

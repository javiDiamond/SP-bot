// Wallex API configuration
export const WALLEX_API_BASE_URL = process.env.WALLEX_API_BASE_URL || 'https://api.wallex.ir';
export const WALLEX_WS_URL = process.env.WALLEX_WS_URL || 'wss://api.wallex.ir/ws';
export const WALLEX_API_KEY_HEADER = process.env.WALLEX_API_KEY_HEADER || 'API-Key';

// Rate limits (per Wallex docs)
export const ORDER_RATE_LIMIT_PER_10S = parseInt(process.env.ORDER_RATE_LIMIT_PER_10S || '20', 10);
export const ORDER_RATE_LIMIT_WINDOW_MS = 10000;

// Safety defaults
export const STALE_PRICE_TIMEOUT_SECONDS = parseInt(process.env.STALE_PRICE_TIMEOUT_SECONDS || '30', 10);
export const REST_POLL_INTERVAL_MS = parseInt(process.env.REST_POLL_INTERVAL_MS || '5000', 10);
export const WS_RECONNECT_INTERVAL_MS = 5000;
export const WS_MAX_RECONNECT_ATTEMPTS = 10;

// Grid defaults
export const DEFAULT_GRID_COUNT = 10;
export const DEFAULT_MIN_PROFIT_BPS = 10; // 0.1%
export const DEFAULT_MAKER_ONLY = true;
export const DEFAULT_INVENTORY_MODE = 'EXISTING_ONLY';
export const DEFAULT_ON_RANGE_EXIT = 'PAUSE_KEEP_ORDERS';

// Risk defaults
export const DEFAULT_MAX_BOTS_GLOBAL = 10;
export const DEFAULT_MAX_BOTS_PER_SYMBOL = 3;
export const DEFAULT_MAX_DAILY_LOSS_PERCENT = 5;
export const DEFAULT_MIN_NOTIONAL = 1;

// Backtest defaults
export const DEFAULT_BACKTEST_RESOLUTION = '60'; // 1 hour candles
export const MAX_BACKTEST_DAYS = 90;

// WebSocket limits (per Wallex docs)
export const WS_PING_INTERVAL_MS = 20000;
export const WS_RECONNECT_BEFORE_MS = 25 * 60 * 1000; // Reconnect before 30 min limit
export const WS_MAX_PONG_COUNT = 100;

// Paper trading defaults
export const DEFAULT_PAPER_BALANCES: Record<string, string> = {
  USDT: '10000',
  TMN: '1000000000',
  BTC: '0',
  ETH: '0',
};

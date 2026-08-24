/**
 * Exchange Adapter Package
 * 
 * Provides unified interface to Wallex Exchange:
 * - REST client for API calls
 * - WebSocket client for real-time data
 * - Market data service
 * - Paper trading simulator
 */

export {
  WallexRestClient,
  WallexApiError,
  WallexRateLimitError,
} from './rest-client';

export type {
  WallexRestConfig,
  WallexMarket,
  WallexCandleResponse,
  WallexDepth,
  WallexTrade,
  WallexBalance,
  WallexBalancesResponse,
  WallexFeeInfo,
  WallexFeesResponse,
  WallexOrderRequest,
  WallexOrderResponse,
  WallexOpenOrder,
} from './rest-client';

export {
  WallexWebSocketClient,
} from './ws-client';

export type {
  WallexWsConfig,
  PriceUpdate,
  DepthUpdate,
  TradeUpdate,
  BalanceUpdate,
  OrderUpdate,
  TradeDetail,
} from './ws-client';

export {
  MarketDataService,
  MarketData,
  StalePriceError,
} from './market-data-service';

export {
  PaperExchange,
  PaperOrder,
  PaperFill,
  PaperBalance,
} from './paper-exchange';

// Unified exchange adapter
export {
  WallexExchange,
  ExchangeMode,
  WallexExchangeConfig,
} from './exchange-adapter';

export type {
  Ticker,
  OrderResult,
  CancelResult,
} from './exchange-adapter';

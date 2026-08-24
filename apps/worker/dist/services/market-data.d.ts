export declare class MarketDataService {
    private exchange;
    private marketDataInterval?;
    private subscribedSymbols;
    constructor();
    start(): Promise<void>;
    stop(): Promise<void>;
    subscribe(symbol: string): Promise<void>;
    unsubscribe(symbol: string): Promise<void>;
    syncMarketData(symbol: string): Promise<void>;
    private storeMarketData;
}
//# sourceMappingURL=market-data.d.ts.map
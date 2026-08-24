export declare class ReconciliationService {
    private reconciliationInterval?;
    start(): Promise<void>;
    stop(): Promise<void>;
    reconcileBot(botId: string): Promise<void>;
    reconcileAll(): Promise<void>;
}
//# sourceMappingURL=reconciliation.d.ts.map
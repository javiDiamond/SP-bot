import { BacktestStatus } from '@wallex/shared';
export interface BacktestResult {
    backtestId: string;
    status: BacktestStatus;
    metrics?: any;
    trades?: any[];
    error?: string;
}
export declare class BacktestRunner {
    private backtester;
    constructor();
    run(backtestId: string, config: any): Promise<BacktestResult>;
    private storeResults;
}
//# sourceMappingURL=backtest-runner.d.ts.map
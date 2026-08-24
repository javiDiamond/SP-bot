import { GridConfig, GridLevel } from './types';
export declare class GridMath {
    /**
     * Generate grid levels based on configuration
     */
    static generateGridLevels(config: GridConfig, pricePrecision: number): GridLevel[];
    /**
     * Calculate expected profit per grid after fees
     */
    static calculateGridProfit(buyPrice: string | number, sellPrice: string | number, makerFeeRate: string | number, takerFeeRate: string | number): {
        grossProfitPercent: string;
        netProfitPercent: string;
        isProfitable: boolean;
    };
    /**
     * Validate minimum profit after fees
     */
    static validateMinProfit(buyPrice: string | number, sellPrice: string | number, makerFeeRate: string | number, takerFeeRate: string | number, minProfitBps: number): {
        valid: boolean;
        message: string;
    };
    /**
     * Calculate quantity based on quote allocation
     */
    static calculateBuyQuantity(quoteAmount: string | number, price: string | number, amountPrecision: number): string;
    /**
     * Calculate quote value from base quantity
     */
    static calculateQuoteValue(baseAmount: string | number, price: string | number, pricePrecision: number): string;
    /**
     * Check if price is within grid range
     */
    static isPriceInRange(price: string | number, lowerPrice: string | number, upperPrice: string | number): boolean;
    /**
     * Find the nearest grid level below a price (for buy orders)
     */
    static findNearestBuyLevel(levels: GridLevel[], currentPrice: string | number): GridLevel | null;
    /**
     * Find the nearest grid level above a price (for sell orders)
     */
    static findNearestSellLevel(levels: GridLevel[], currentPrice: string | number): GridLevel | null;
}

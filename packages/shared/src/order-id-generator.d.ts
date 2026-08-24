/**
 * Generate unique client order IDs for Wallex orders
 * Format: {PREFIX}_{BOT_ID}_{SIDE}_{LEVEL}_{RANDOM}
 */
export declare function generateClientOrderId(botId: string, side: 'BUY' | 'SELL', levelIndex: number, suffix?: string): string;

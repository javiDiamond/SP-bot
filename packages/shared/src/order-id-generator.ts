/**
 * Generate unique client order IDs for Wallex orders
 * Format: {PREFIX}_{BOT_ID}_{SIDE}_{LEVEL}_{RANDOM}
 */
export function generateClientOrderId(
  botId: string,
  side: 'BUY' | 'SELL',
  levelIndex: number,
  suffix?: string
): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  
  // Clean bot ID to remove any special characters
  const cleanBotId = botId.replace(/[^a-zA-Z0-9]/g, '').substring(0, 8);
  
  const parts = [
    'GB', // Grid Bot prefix
    cleanBotId.toUpperCase(),
    side === 'BUY' ? 'B' : 'S',
    `L${levelIndex.toString().padStart(2, '0')}`,
    suffix || random,
  ];

  return parts.join('_');
}

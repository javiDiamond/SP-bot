/**
 * EventLog persistence helper — never throws; logging must not break trading.
 */

import { prisma, LogLevel, Prisma } from '@wallex/db';
import { logger } from '@wallex/shared';

export async function writeEventLog(params: {
  botId?: string;
  level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';
  event: string;
  message: string;
  data?: Record<string, unknown>;
}): Promise<void> {
  try {
    await prisma.eventLog.create({
      data: {
        botId: params.botId,
        level: params.level as LogLevel,
        event: params.event,
        message: params.message.slice(0, 2000),
        data: params.data ? (params.data as Prisma.InputJsonValue) : undefined,
      },
    });
  } catch (err) {
    logger.warn(`Failed to write event log ${params.event}: ${String((err as Error)?.message || err)}`);
  }
}

/**
 * Wallex Grid Bot API Server
 *
 * REST API for managing grid bots, viewing data, and controlling trading
 */

import { logger } from '@wallex/shared';
import { config } from './config.js';
import { buildApp } from './app.js';
import { connectDatabase, disconnectDatabase } from './lib/database.js';
import { closeQueues } from './lib/queue.js';

async function main() {
  const fastify = await buildApp();

  // Graceful shutdown
  let shuttingDown = false;
  const gracefulShutdown = async (signal: string) => {
    if (shuttingDown) return;
    shuttingDown = true;
    logger.info(`Received ${signal}, shutting down gracefully...`);
    try {
      await closeQueues();
      await disconnectDatabase();
      await fastify.close();
    } catch (err) {
      logger.error(err, 'Error during shutdown');
    }
    process.exit(0);
  };

  process.on('SIGTERM', () => void gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => void gracefulShutdown('SIGINT'));

  try {
    await connectDatabase();
    await fastify.listen({ port: config.port, host: config.host });
    logger.info(`Server running at http://${config.host}:${config.port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

main().catch(err => {
  // eslint-disable-next-line no-console
  console.error('Fatal startup error', err);
  process.exit(1);
});

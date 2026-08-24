import { Worker } from './worker';
import { logger } from '@wallex/shared';

async function main() {
  logger.info('Starting Wallex Grid Bot Worker...');
  
  const worker = new Worker();
  
  // Handle graceful shutdown
  const shutdown = async (signal: string) => {
    logger.info(`Received ${signal}, shutting down gracefully...`);
    await worker.stop();
    process.exit(0);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  try {
    await worker.start();
    logger.info('Worker started successfully');
  } catch (error) {
    logger.error('Failed to start worker', error);
    process.exit(1);
  }
}

main().catch((error) => {
  logger.error('Fatal error in worker', error);
  process.exit(1);
});

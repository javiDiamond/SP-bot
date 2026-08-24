"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const worker_1 = require("./worker");
const shared_1 = require("@wallex/shared");
async function main() {
    shared_1.logger.info('Starting Wallex Grid Bot Worker...');
    const worker = new worker_1.Worker();
    // Handle graceful shutdown
    const shutdown = async (signal) => {
        shared_1.logger.info(`Received ${signal}, shutting down gracefully...`);
        await worker.stop();
        process.exit(0);
    };
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
    try {
        await worker.start();
        shared_1.logger.info('Worker started successfully');
    }
    catch (error) {
        shared_1.logger.error('Failed to start worker', error);
        process.exit(1);
    }
}
main().catch((error) => {
    shared_1.logger.error('Fatal error in worker', error);
    process.exit(1);
});
//# sourceMappingURL=index.js.map
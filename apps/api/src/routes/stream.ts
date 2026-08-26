/**
 * SSE stream route — relays Redis pub/sub realtime events to the dashboard
 */

import { FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify';
import Redis from 'ioredis';
import { REALTIME_CHANNEL } from '@wallex/shared';
import { config } from '../config.js';

const streamRoutes: FastifyPluginAsync = async fastify => {
  // EventSource cannot send Authorization headers, so accept ?token=<jwt> too.
  const streamAuth = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      if (request.headers.authorization) {
        await request.jwtVerify();
        return;
      }
      const token = (request.query as { token?: string }).token;
      if (!token) throw new Error('missing token');
      request.user = fastify.jwt.verify(token);
    } catch (err) {
      request.log.warn({ err: (err as Error)?.message }, 'SSE auth failed');
      return reply.code(401).send({ success: false, error: 'Unauthorized' });
    }
  };

  /**
   * GET /api/stream — Server-Sent Events (authenticated)
   */
  fastify.get('/', { preHandler: [streamAuth] }, async (request, reply) => {
    reply.raw.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    });
    reply.raw.write('retry: 3000\n\n');

    const subscriber = new Redis(config.redisUrl);
    await subscriber.subscribe(REALTIME_CHANNEL);

    const onMessage = (_channel: string, message: string) => {
      reply.raw.write(`data: ${message}\n\n`);
    };
    subscriber.on('message', onMessage);

    const heartbeat = setInterval(() => {
      reply.raw.write(': hb\n\n');
    }, 25000);

    const cleanup = () => {
      clearInterval(heartbeat);
      subscriber.off('message', onMessage);
      subscriber.unsubscribe(REALTIME_CHANNEL).catch(() => undefined);
      subscriber.quit().catch(() => undefined);
    };

    request.raw.on('close', cleanup);
    request.raw.on('error', cleanup);

    // Keep the connection open; do not let fastify end the response.
    await reply.hijack();
  });
};

export default streamRoutes;

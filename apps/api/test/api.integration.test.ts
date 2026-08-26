/**
 * API integration tests (fastify.inject).
 *
 * Requires a reachable Postgres and Redis. When either is missing every test
 * is skipped at runtime so `pnpm test` still passes in bare environments.
 *
 * Uses a dedicated test database (wallex_grid_bot_test) and runs
 * `prisma migrate deploy` against it in beforeAll.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import net from 'net';
import { execSync } from 'child_process';
import type { FastifyInstance } from 'fastify';

// ----------------------------------------------------------------------------
// Test environment (must be set BEFORE app modules are dynamically imported)
// ----------------------------------------------------------------------------

const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ||
  'postgresql://wallex:wallex_password@localhost:5432/wallex_grid_bot_test';
const TEST_REDIS_URL = process.env.TEST_REDIS_URL || 'redis://localhost:6379';
const TEST_ENCRYPTION_KEY = 'f'.repeat(64);

process.env.DATABASE_URL = TEST_DATABASE_URL;
process.env.REDIS_URL = TEST_REDIS_URL;
process.env.JWT_SECRET = 'integration-test-jwt-secret';
process.env.ENCRYPTION_KEY = TEST_ENCRYPTION_KEY;
process.env.ENABLE_LIVE_TRADING = 'false';
process.env.NODE_ENV = 'test';

// ----------------------------------------------------------------------------
// Availability probe
// ----------------------------------------------------------------------------

function probe(host: string, port: number, timeoutMs = 1500): Promise<boolean> {
  return new Promise(resolve => {
    const socket = new net.Socket();
    const done = (ok: boolean) => {
      socket.destroy();
      resolve(ok);
    };
    socket.setTimeout(timeoutMs);
    socket.once('connect', () => done(true));
    socket.once('timeout', () => done(false));
    socket.once('error', () => done(false));
    socket.connect(port, host);
  });
}

const adminEmail = `admin-${Date.now()}@test.local`;
const adminPassword = 'integration-pass-123';

let available = false;
let app: FastifyInstance | undefined;
let token = '';
let botId = '';

beforeAll(async () => {
  const dbUrl = new URL(TEST_DATABASE_URL);
  const redisUrl = new URL(TEST_REDIS_URL);
  const [dbOk, redisOk] = await Promise.all([
    probe(dbUrl.hostname, Number(dbUrl.port || 5432)),
    probe(redisUrl.hostname, Number(redisUrl.port || 6379)),
  ]);
  if (!dbOk || !redisOk) return; // tests skip themselves

  execSync('node_modules/.bin/prisma migrate deploy --schema prisma/schema.prisma', {
    cwd: '../../packages/db',
    env: { ...process.env, DATABASE_URL: TEST_DATABASE_URL },
    stdio: 'pipe',
    timeout: 60_000,
  });

  // Hermetic state: wipe all rows from the dedicated test database
  const { prisma } = await import('@wallex/db');
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE
    "AuditLog", "EventLog", "Fill", "Order", "GridLevel",
    "PnLSnapshot", "BalanceSnapshot", "BacktestTrade", "Backtest",
    "OptimizationJob", "Candle", "Market", "RiskSetting",
    "SystemSetting", "Bot", "ExchangeAccount", "User" CASCADE`);

  const { buildApp } = await import('../src/app.js');
  app = await buildApp({ logger: false, disableRateLimit: true });
  available = true;
}, 90_000);

afterAll(async () => {
  if (!app) return;
  const { closeQueues } = await import('../src/lib/queue.js');
  const { disconnectPrisma } = await import('@wallex/db');
  await closeQueues().catch(() => undefined);
  await app.close().catch(() => undefined);
  await disconnectPrisma().catch(() => undefined);
});

describe('API integration', () => {
  it('GET /health returns ok', async t => {
    if (!available) return t.skip();
    const res = await app!.inject({ method: 'GET', url: '/health' });
    expect(res.statusCode).toBe(200);
    expect(res.json().status).toBe('ok');
  });

  it('rejects unauthenticated access to protected routes', async t => {
    if (!available) return t.skip();
    const res = await app!.inject({ method: 'GET', url: '/api/v1/bots' });
    expect(res.statusCode).toBe(401);
  });

  it('registers the first user as ADMIN and issues a JWT', async t => {
    if (!available) return t.skip();
    const res = await app!.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: { email: adminEmail, password: adminPassword },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.success).toBe(true);
    expect(body.data.user.role).toBe('ADMIN');
    expect(body.data.token).toBeTruthy();
    expect(JSON.stringify(body)).not.toContain(adminPassword);
    token = body.data.token;
  });

  it('login validates credentials', async t => {
    if (!available) return t.skip();
    const bad = await app!.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { email: adminEmail, password: 'wrong-password' },
    });
    expect(bad.statusCode).toBe(401);

    const good = await app!.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { email: adminEmail, password: adminPassword },
    });
    expect(good.statusCode).toBe(200);
    expect(good.json().success).toBe(true);
  });

  it('GET /api/auth/me works with the token only', async t => {
    if (!available) return t.skip();
    const noAuth = await app!.inject({ method: 'GET', url: '/api/auth/me' });
    expect(noAuth.statusCode).toBe(401);

    const res = await app!.inject({
      method: 'GET',
      url: '/api/auth/me',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().data.email).toBe(adminEmail);
  });

  it('creates a dry-run exchange account and masks the API key', async t => {
    if (!available) return t.skip();
    const rawKey = 'wlx-live-secret-key-0001';
    const res = await app!.inject({
      method: 'POST',
      url: '/api/accounts',
      headers: { authorization: `Bearer ${token}` },
      payload: { name: 'Test Paper Account', apiKey: rawKey },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.data.isLiveEnabled).toBe(false);
    const masked = `${rawKey.slice(0, 4)}${'*'.repeat(rawKey.length - 8)}${rawKey.slice(-4)}`;
    expect(body.data.apiKeyMasked).toBe(masked);
    expect(JSON.stringify(body)).not.toContain(rawKey);
  });

  it('creates a DRY_RUN grid bot (status DRAFT)', async t => {
    if (!available) return t.skip();
    const res = await app!.inject({
      method: 'POST',
      url: '/api/v1/bots',
      headers: { authorization: `Bearer ${token}` },
      payload: {
        name: 'Integration Bot',
        symbol: 'BTCUSDT',
        mode: 'DRY_RUN',
        gridConfig: {
          gridType: 'ARITHMETIC',
          lowerPrice: '90000',
          upperPrice: '110000',
          gridCount: 10,
          quotePerGrid: '100',
          inventoryMode: 'AUTO_REBALANCE',
          makerOnly: true,
          minProfitAfterFeesBps: 10,
          onRangeExit: 'PAUSE_KEEP_ORDERS',
          autoRecenter: false,
          allowMarketOrders: false,
        },
      },
    });
    expect(res.statusCode).toBe(200);
    const bot = res.json().data;
    expect(bot.status).toBe('DRAFT');
    expect(bot.symbol).toBe('BTCUSDT');
    botId = bot.id;
  });

  it('rejects bots with an inverted price range', async t => {
    if (!available) return t.skip();
    const res = await app!.inject({
      method: 'POST',
      url: '/api/v1/bots',
      headers: { authorization: `Bearer ${token}` },
      payload: {
        name: 'Bad Range Bot',
        symbol: 'BTCUSDT',
        mode: 'DRY_RUN',
        gridConfig: {
          gridType: 'ARITHMETIC',
          lowerPrice: '200',
          upperPrice: '100',
          gridCount: 5,
          inventoryMode: 'EXISTING_ONLY',
          makerOnly: true,
          minProfitAfterFeesBps: 10,
          onRangeExit: 'PAUSE_KEEP_ORDERS',
          autoRecenter: false,
          allowMarketOrders: false,
        },
      },
    });
    expect(res.statusCode).toBe(400);
  });

  it('blocks LIVE bots while ENABLE_LIVE_TRADING=false', async t => {
    if (!available) return t.skip();
    const res = await app!.inject({
      method: 'POST',
      url: '/api/v1/bots',
      headers: { authorization: `Bearer ${token}` },
      payload: {
        name: 'Live Bot',
        symbol: 'BTCUSDT',
        mode: 'LIVE',
        gridConfig: {
          gridType: 'ARITHMETIC',
          lowerPrice: '90000',
          upperPrice: '110000',
          gridCount: 5,
          inventoryMode: 'EXISTING_ONLY',
          makerOnly: true,
          minProfitAfterFeesBps: 10,
          onRangeExit: 'PAUSE_KEEP_ORDERS',
          autoRecenter: false,
          allowMarketOrders: false,
        },
      },
    });
    expect(res.statusCode).toBe(400);
    expect(res.json().error).toMatch(/ENABLE_LIVE_TRADING/i);
  });

  it('blocks enabling allowLiveTrading in risk settings while env gate is off', async t => {
    if (!available) return t.skip();
    const res = await app!.inject({
      method: 'PUT',
      url: '/api/system/risk-settings',
      headers: { authorization: `Bearer ${token}` },
      payload: { allowLiveTrading: true },
    });
    expect(res.statusCode).toBe(400);
    expect(res.json().error).toMatch(/ENABLE_LIVE_TRADING/i);
  });

  it('starts a draft bot (enqueues START, transitions to STARTING)', async t => {
    if (!available) return t.skip();
    const res = await app!.inject({
      method: 'POST',
      url: `/api/v1/bots/${botId}/start`,
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().data.status).toBe('STARTING');
  });

  it('rejects invalid lifecycle transitions', async t => {
    if (!available) return t.skip();
    // STARTING cannot be started again
    const res = await app!.inject({
      method: 'POST',
      url: `/api/v1/bots/${botId}/start`,
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(409);
  });

  it('toggles the global kill switch and records audit logs', async t => {
    if (!available) return t.skip();
    const on = await app!.inject({
      method: 'POST',
      url: '/api/system/kill-switch',
      headers: { authorization: `Bearer ${token}` },
      payload: { active: true },
    });
    expect(on.statusCode).toBe(200);
    expect(on.json().data.killSwitchActive).toBe(true);

    const settings = await app!.inject({
      method: 'GET',
      url: '/api/system/risk-settings',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(settings.json().data.killSwitchActive).toBe(true);

    // Running/starting bots are force-killed
    const bot = await app!.inject({
      method: 'GET',
      url: `/api/v1/bots/${botId}`,
      headers: { authorization: `Bearer ${token}` },
    });
    expect(bot.json().data.status).toBe('KILLED');

    const off = await app!.inject({
      method: 'POST',
      url: '/api/system/kill-switch',
      headers: { authorization: `Bearer ${token}` },
      payload: { active: false },
    });
    expect(off.json().data.killSwitchActive).toBe(false);

    const audits = await app!.inject({
      method: 'GET',
      url: '/api/system/audit-logs?action=killswitch',
      headers: { authorization: `Bearer ${token}` },
    });
    const actions = audits.json().data.map((l: { action: string }) => l.action);
    expect(actions).toContain('killswitch.activate');
    expect(actions).toContain('killswitch.deactivate');
  });

  it('lists bots for the authenticated user', async t => {
    if (!available) return t.skip();
    const res = await app!.inject({
      method: 'GET',
      url: '/api/v1/bots',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(200);
    const names = res.json().data.map((b: { name: string }) => b.name);
    expect(names).toContain('Integration Bot');
  });

  it('validates malformed input', async t => {
    if (!available) return t.skip();
    const res = await app!.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { email: 'not-an-email', password: '123' },
    });
    expect(res.statusCode).toBe(400);
    expect(res.json().success).toBe(false);
  });
});

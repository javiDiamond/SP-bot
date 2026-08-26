/**
 * Pre-trade risk service (spec §7.1)
 *
 * Centralized gate evaluated before EVERY order placement:
 * - kill switch
 * - live-trading gate (env + RiskSetting + account flag)
 * - stale price guard
 * - per-bot quote/base exposure limits
 * - daily loss limit vs realized PnL
 * - duplicate clientOrderId prevention (DB @unique as final backstop)
 *
 * Rejections are reported as { ok: false, reason } — never thrown.
 */

import type { RiskSetting } from '@wallex/db';
import { prisma } from '@wallex/db';
import {
  BotStatus,
  OrderSide,
  OrderType,
  PlaceOrderRequest,
  TradingMode,
  logger,
} from '@wallex/shared';
import Decimal from 'decimal.js';
import type { PreTradeResult } from '@wallex/grid-strategy';
import { workerConfig } from '../config';
import { writeEventLog } from '../utils/event-log';
import { RealtimePublisher } from './events';

const RISK_REFRESH_MS = 5_000;

export interface RiskContext {
  botId: string;
  symbol: string;
  mode: TradingMode;
  isLiveEnabledAccount: boolean;
  /** True when the symbol's market data feed is stale/missing. */
  isPriceStale: () => boolean;
  /** Per-bot exposure limits (from Bot row / grid config). */
  maxQuoteExposure?: string | null;
  maxBaseExposure?: string | null;
  dailyLossLimitPercent?: string | null;
  /** Current open-order exposure snapshot provided by the engine driver. */
  openExposure: () => { quoteNotional: string; baseQty: string };
  /** Quote-denominated capital base used for the daily loss percentage. */
  referenceCapitalQuote?: string;
}

export class RiskService {
  private risk: RiskSetting | undefined;
  private lastFetch = 0;
  private fetching?: Promise<void>;
  private killSwitchWasActive = false;
  private lastStalePublish = new Map<string, number>();

  constructor(private events?: RealtimePublisher) {}

  /** Refresh RiskSetting from DB (cached, TTL RISK_REFRESH_MS). */
  async refresh(): Promise<void> {
    if (this.fetching) return this.fetching;
    if (this.risk && Date.now() - this.lastFetch < RISK_REFRESH_MS) return;

    this.fetching = (async () => {
      try {
        const risk = await prisma.riskSetting.findFirst({ where: { key: 'global' } });
        this.risk = risk ?? (await prisma.riskSetting.create({ data: { key: 'global' } }));
        this.lastFetch = Date.now();

        if (this.risk.killSwitchActive && !this.killSwitchWasActive) {
          logger.warn('Kill switch activation detected by risk service');
        }
        this.killSwitchWasActive = this.risk.killSwitchActive;
      } catch (err) {
        logger.warn(`Risk settings refresh failed: ${String((err as Error)?.message || err)}`);
      } finally {
        this.fetching = undefined;
      }
    })();

    return this.fetching;
  }

  async isKillSwitchActive(): Promise<boolean> {
    await this.refresh();
    return this.risk?.killSwitchActive ?? false;
  }

  /** Full live-mode gate: env flag + RiskSetting + account flag. */
  liveTradingAllowed(): boolean {
    return (
      workerConfig.enableLiveTrading &&
      (this.risk?.allowLiveTrading ?? false)
    );
  }

  /**
   * Pre-trade check. Called by the grid engine before every placeOrder.
   */
  async check(req: PlaceOrderRequest, ctx: RiskContext): Promise<PreTradeResult> {
    await this.refresh();

    // 1) Kill switch
    if (this.risk?.killSwitchActive) {
      return { ok: false, reason: 'kill-switch-active' };
    }

    // 2) Live trading gate
    if (ctx.mode === TradingMode.LIVE) {
      if (!workerConfig.enableLiveTrading) {
        return { ok: false, reason: 'live-trading-disabled-env' };
      }
      if (!(this.risk?.allowLiveTrading ?? false)) {
        return { ok: false, reason: 'live-trading-disabled-risk-settings' };
      }
      if (!ctx.isLiveEnabledAccount) {
        return { ok: false, reason: 'account-not-live-enabled' };
      }
    }

    // 3) Stale price guard
    if (ctx.isPriceStale()) {
      const last = this.lastStalePublish.get(ctx.botId) ?? 0;
      if (Date.now() - last > 30_000) {
        this.lastStalePublish.set(ctx.botId, Date.now());
        this.events?.publish('price.stale', { botId: ctx.botId, symbol: ctx.symbol });
      }
      return { ok: false, reason: 'stale-price' };
    }

    // 4) Per-bot exposure limits
    const exposure = ctx.openExposure();
    if (req.side === OrderSide.BUY && ctx.maxQuoteExposure) {
      const limit = new Decimal(ctx.maxQuoteExposure);
      const after = new Decimal(exposure.quoteNotional).plus(
        new Decimal(req.price).times(req.quantity),
      );
      if (limit.gt(0) && after.gt(limit)) {
        void writeEventLog({
          botId: ctx.botId,
          level: 'WARN',
          event: 'risk.exposure_quote',
          message: `Order blocked: quote exposure ${after.toFixed(4)} exceeds limit ${limit.toFixed(4)}`,
        });
        return { ok: false, reason: 'max-quote-exposure' };
      }
    }
    if (req.side === OrderSide.SELL && ctx.maxBaseExposure) {
      const limit = new Decimal(ctx.maxBaseExposure);
      if (limit.gt(0) && new Decimal(exposure.baseQty).gt(limit)) {
        void writeEventLog({
          botId: ctx.botId,
          level: 'WARN',
          event: 'risk.exposure_base',
          message: `Order blocked: base exposure ${exposure.baseQty} exceeds limit ${limit.toFixed(8)}`,
        });
        return { ok: false, reason: 'max-base-exposure' };
      }
    }

    // 5) Daily loss limit vs realized PnL
    if (ctx.dailyLossLimitPercent) {
      const limitPct = new Decimal(ctx.dailyLossLimitPercent);
      const capital = new Decimal(ctx.referenceCapitalQuote || '0');
      if (limitPct.gt(0) && capital.gt(0)) {
        const bot = await prisma.bot
          .findUnique({
            where: { id: ctx.botId },
            select: { realizedPnL: true, unrealizedPnL: true },
          })
          .catch(() => null);
        if (bot) {
          const pnl = new Decimal(bot.realizedPnL.toString()).plus(
            new Decimal(bot.unrealizedPnL.toString()),
          );
          const maxLoss = capital.times(limitPct.div(100)).negated();
          if (pnl.lt(maxLoss)) {
            void writeEventLog({
              botId: ctx.botId,
              level: 'ERROR',
              event: 'risk.daily_loss_limit',
              message: `Order blocked: PnL ${pnl.toFixed(4)} below daily loss limit ${maxLoss.toFixed(4)}`,
            });
            return { ok: false, reason: 'daily-loss-limit' };
          }
        }
      }
    }

    // 6) Duplicate clientOrderId prevention
    const existing = await prisma.order
      .findUnique({ where: { clientOrderId: req.clientOrderId }, select: { id: true } })
      .catch(() => null);
    if (existing) {
      return { ok: false, reason: 'duplicate-client-order-id' };
    }

    // 7) Market orders gate (grid config allowMarketOrders=false by default)
    if (req.type === OrderType.MARKET || req.type === OrderType.STOP_MARKET) {
      // Engine only emits LIMIT orders; market orders indicate a misconfiguration.
      return { ok: false, reason: 'market-orders-disabled' };
    }

    return { ok: true };
  }

  /**
   * Called when the kill switch is detected active while engines are running:
   * mark bots KILLED if still active.
   */
  async forceKillBots(reason: string): Promise<string[]> {
    const result = await prisma.bot.updateMany({
      where: {
        status: {
          in: [
            'RUNNING',
            'STARTING',
            'PAUSED',
            'PAUSING',
          ] as BotStatus[],
        },
      },
      data: { status: 'KILLED' as BotStatus, stoppedAt: new Date() },
    });
    if (result.count > 0) {
      logger.warn(`Kill switch: marked ${result.count} bots KILLED (${reason})`);
    }
    return [];
  }
}

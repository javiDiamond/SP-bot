import { logger, DecimalUtils, GridMath, GridType } from '@wallex/shared';

export interface BacktestConfig {
  symbol: string;
  startTime: number; // timestamp
  endTime: number; // timestamp
  resolution: string; // e.g., '60' for 1 hour
  gridType: GridType;
  lowerPrice: string;
  upperPrice: string;
  gridCount: number;
  totalInvestmentQuote: string;
  makerFeeRate: string;
  takerFeeRate: string;
  initialBaseBalance?: string;
  initialQuoteBalance?: string;
}

export interface BacktestTrade {
  timestamp: number;
  side: 'BUY' | 'SELL';
  price: any;
  quantity: any;
  fee: any;
  pnl?: any;
}

export interface BacktestMetrics {
  totalReturn: any;
  gridProfit: any;
  unrealizedPnl: any;
  totalPnl: any;
  feesPaid: any;
  numberOfBuys: number;
  numberOfSells: number;
  winRate: number;
  maxDrawdown: any;
  sharpeRatio: any;
  sortinoRatio: any;
  finalBalances: Record<string, any>;
  equityCurve: Array<{ timestamp: number; value: any }>;
}

export interface BacktestResult {
  metrics: BacktestMetrics;
  trades: BacktestTrade[];
  warnings: string[];
}

export class CandleBasedBacktester {
  async run(config: BacktestConfig): Promise<BacktestResult> {
    logger.info(`Running candle-based backtest for ${config.symbol}`);

    const warnings: string[] = [];
    const trades: BacktestTrade[] = [];
    
    // Fetch candles
    const candles = await this.fetchCandles(
      config.symbol,
      config.resolution,
      config.startTime,
      config.endTime
    );

    if (candles.length === 0) {
      throw new Error('No candle data available for backtest period');
    }

    // Generate grid levels
    const gridLevels = GridMath.generateGridLevels(
      DecimalUtils.fromString(config.lowerPrice),
      DecimalUtils.fromString(config.upperPrice),
      config.gridCount,
      config.gridType,
      8 // price precision
    );

    // Initialize state
    let quoteBalance = DecimalUtils.fromString(config.initialQuoteBalance || config.totalInvestmentQuote);
    let baseBalance = DecimalUtils.fromString(config.initialBaseBalance || '0');
    let gridProfit = DecimalUtils.fromNumber(0);
    let totalFees = DecimalUtils.fromNumber(0);
    
    const makerFeeRate = DecimalUtils.fromString(config.makerFeeRate);
    const takerFeeRate = DecimalUtils.fromString(config.takerFeeRate);

    // Track active orders at each grid level
    const activeBuyOrders = new Map<number, { price: any; quantity: any }>();
    const activeSellOrders = new Map<number, { price: any; quantity: any }>();

    // Place initial orders
    const currentPrice = DecimalUtils.fromString(candles[0].close);
    
    for (let i = 0; i < gridLevels.length; i++) {
      const level = gridLevels[i];
      const levelPrice = DecimalUtils.fromString(level.price);

      if (level.type === 'BUY' && levelPrice.lessThan(currentPrice)) {
        // Calculate buy quantity
        const quotePerGrid = DecimalUtils.fromString(config.totalInvestmentQuote)
          .dividedBy(DecimalUtils.fromNumber(config.gridCount));
        const quantity = quotePerGrid.dividedBy(levelPrice);

        if (quantity.greaterThan(0)) {
          activeBuyOrders.set(i, { price: levelPrice, quantity });
        }
      } else if (level.type === 'SELL' && levelPrice.greaterThan(currentPrice)) {
        // Placeholder for sell order (will be filled when buy fills)
        activeSellOrders.set(i, { price: levelPrice, quantity: DecimalUtils.fromNumber(0) });
      }
    }

    // Equity curve tracking
    const equityCurve: Array<{ timestamp: number; value: any }> = [];
    const initialEquity = quoteBalance.plus(baseBalance.times(currentPrice));

    // Process candles
    for (const candle of candles) {
      const timestamp = candle.timestamp;
      const open = DecimalUtils.fromString(candle.open);
      const high = DecimalUtils.fromString(candle.high);
      const low = DecimalUtils.fromString(candle.low);
      const close = DecimalUtils.fromString(candle.close);

      // Check for buy order fills
      for (const [levelIndex, order] of activeBuyOrders.entries()) {
        if (low.lessThanOrEqualTo(order.price)) {
          // Buy order filled
          const fee = order.quantity.times(order.price).times(makerFeeRate);
          totalFees = totalFees.plus(fee);

          // Update balances
          baseBalance = baseBalance.plus(order.quantity);
          quoteBalance = quoteBalance.minus(order.quantity.times(order.price)).minus(fee);

          // Record trade
          trades.push({
            timestamp,
            side: 'BUY',
            price: order.price,
            quantity: order.quantity,
            fee,
          });

          // Place corresponding sell order at next level
          const nextLevelIndex = levelIndex + 1;
          if (nextLevelIndex < gridLevels.length) {
            const nextLevel = gridLevels[nextLevelIndex];
            const sellPrice = DecimalUtils.fromString(nextLevel.price);
            const sellQuantity = order.quantity; // Sell same quantity

            activeSellOrders.set(nextLevelIndex, {
              price: sellPrice,
              quantity: sellQuantity,
            });
          }

          // Remove filled buy order
          activeBuyOrders.delete(levelIndex);
        }
      }

      // Check for sell order fills
      for (const [levelIndex, order] of activeSellOrders.entries()) {
        if (order.quantity.greaterThan(0) && high.greaterThanOrEqualTo(order.price)) {
          // Sell order filled
          const notional = order.quantity.times(order.price);
          const fee = notional.times(makerFeeRate);
          totalFees = totalFees.plus(fee);

          // Calculate PnL for this trade
          // Simplified: assume we're selling what we bought at previous level
          const pnl = notional.minus(fee); // In real implementation, track cost basis

          // Update balances
          quoteBalance = quoteBalance.plus(notional).minus(fee);
          baseBalance = baseBalance.minus(order.quantity);

          // Record trade
          trades.push({
            timestamp,
            side: 'SELL',
            price: order.price,
            quantity: order.quantity,
            fee,
            pnl,
          });

          gridProfit = gridProfit.plus(pnl);

          // Place corresponding buy order at previous level
          const prevLevelIndex = levelIndex - 1;
          if (prevLevelIndex >= 0) {
            const prevLevel = gridLevels[prevLevelIndex];
            const buyPrice = DecimalUtils.fromString(prevLevel.price);
            const buyQuantity = quoteBalance
              .dividedBy(buyPrice)
              .min(order.quantity); // Don't buy more than we sold

            if (buyQuantity.greaterThan(0)) {
              activeBuyOrders.set(prevLevelIndex, {
                price: buyPrice,
                quantity: buyQuantity,
              });
            }
          }

          // Remove filled sell order
          activeSellOrders.delete(levelIndex);
        }
      }

      // Track equity
      const currentEquity = quoteBalance.plus(baseBalance.times(close));
      equityCurve.push({ timestamp, value: currentEquity });
    }

    // Calculate final metrics
    const finalPrice = DecimalUtils.fromString(candles[candles.length - 1].close);
    const finalEquity = quoteBalance.plus(baseBalance.times(finalPrice));
    
    const totalReturn = finalEquity.minus(initialEquity).dividedBy(initialEquity);
    const unrealizedPnl = baseBalance.times(finalPrice); // Value of remaining base
    const totalPnl = gridProfit.plus(unrealizedPnl);

    // Calculate win rate
    const winningTrades = trades.filter(t => t.pnl && t.pnl.greaterThan(0)).length;
    const sellTrades = trades.filter(t => t.side === 'SELL').length;
    const winRate = sellTrades > 0 ? winningTrades / sellTrades : 0;

    // Calculate max drawdown
    let maxEquity = initialEquity;
    let maxDrawdown = DecimalUtils.fromNumber(0);
    for (const point of equityCurve) {
      if (point.value.greaterThan(maxEquity)) {
        maxEquity = point.value;
      } else {
        const drawdown = maxEquity.minus(point.value).dividedBy(maxEquity);
        if (drawdown.greaterThan(maxDrawdown)) {
          maxDrawdown = drawdown;
        }
      }
    }

    // Calculate Sharpe ratio (simplified)
    const returns = this.calculateReturns(equityCurve);
    const avgReturn = returns.length > 0 
      ? returns.reduce((sum, r) => sum.plus(r), DecimalUtils.fromNumber(0)).dividedBy(returns.length)
      : DecimalUtils.fromNumber(0);
    const stdDev = this.calculateStdDev(returns, avgReturn);
    const sharpeRatio = stdDev.greaterThan(0) ? avgReturn.dividedBy(stdDev) : DecimalUtils.fromNumber(0);

    // Sortino ratio (simplified)
    const negativeReturns = returns.filter(r => r.lessThan(0));
    const downsideDev = negativeReturns.length > 0
      ? this.calculateStdDev(negativeReturns, DecimalUtils.fromNumber(0))
      : DecimalUtils.fromNumber(0);
    const sortinoRatio = downsideDev.greaterThan(0) ? avgReturn.dividedBy(downsideDev) : DecimalUtils.fromNumber(0);

    const metrics: BacktestMetrics = {
      totalReturn,
      gridProfit,
      unrealizedPnl,
      totalPnl,
      feesPaid: totalFees,
      numberOfBuys: trades.filter(t => t.side === 'BUY').length,
      numberOfSells: sellTrades,
      winRate,
      maxDrawdown,
      sharpeRatio,
      sortinoRatio,
      finalBalances: {
        base: baseBalance,
        quote: quoteBalance,
      },
      equityCurve,
    };

    logger.info(`Backtest completed: ${trades.length} trades, total return: ${totalReturn.toString()}`);

    return {
      metrics,
      trades,
      warnings,
    };
  }

  private async fetchCandles(
    symbol: string,
    resolution: string,
    startTime: number,
    endTime: number
  ): Promise<any[]> {
    // In production, this would call the Wallex API or use cached data
    // For now, return empty array - will be implemented in exchange package
    logger.debug(`Fetching candles for ${symbol} from ${startTime} to ${endTime}`);
    return [];
  }

  private calculateReturns(equityCurve: Array<{ timestamp: number; value: any }>): any[] {
    const returns: any[] = [];
    for (let i = 1; i < equityCurve.length; i++) {
      const prevValue = equityCurve[i - 1].value;
      const currentValue = equityCurve[i].value;
      if (prevValue.greaterThan(0)) {
        returns.push(currentValue.minus(prevValue).dividedBy(prevValue));
      }
    }
    return returns;
  }

  private calculateStdDev(values: any[], mean: any): any {
    if (values.length === 0) {
      return DecimalUtils.fromNumber(0);
    }

    const squaredDiffs = values.map(v => {
      const diff = v.minus(mean);
      return diff.times(diff);
    });

    const avgSquaredDiff = squaredDiffs.reduce(
      (sum, v) => sum.plus(v),
      DecimalUtils.fromNumber(0)
    ).dividedBy(values.length);

    // Approximate square root using Newton's method
    return this.sqrt(avgSquaredDiff);
  }

  private sqrt(value: any): any {
    if (value.lessThanOrEqualTo(0)) {
      return DecimalUtils.fromNumber(0);
    }

    // Newton's method for square root
    let guess = value.dividedBy(2);
    for (let i = 0; i < 20; i++) {
      guess = guess.plus(value.dividedBy(guess)).dividedBy(2);
    }
    return guess;
  }
}

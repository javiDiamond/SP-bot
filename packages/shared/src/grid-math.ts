import Decimal from 'decimal.js';
import { GridType, GridConfig, GridLevel, GridLevelStatus } from './types';
import { DecimalUtils } from './decimal-utils';

export class GridMath {
  /**
   * Generate grid levels based on configuration
   */
  static generateGridLevels(config: GridConfig, pricePrecision: number): GridLevel[] {
    const levels: GridLevel[] = [];
    const lowerPrice = new Decimal(config.lowerPrice);
    const upperPrice = new Decimal(config.upperPrice);
    const gridCount = config.gridCount;

    if (gridCount < 2) {
      throw new Error('Grid count must be at least 2');
    }

    if (lowerPrice.gte(upperPrice)) {
      throw new Error('Lower price must be less than upper price');
    }

    for (let i = 0; i <= gridCount; i++) {
      let price: Decimal;

      if (config.gridType === GridType.ARITHMETIC) {
        // Arithmetic grid: equal price spacing
        const step = upperPrice.minus(lowerPrice).div(gridCount);
        price = lowerPrice.plus(step.times(i));
      } else {
        // Geometric grid: equal percentage spacing
        const ratio = upperPrice.div(lowerPrice).pow(1 / gridCount);
        price = lowerPrice.times(ratio.pow(i));
      }

      // Round to price precision
      const roundedPrice = price.toDecimalPlaces(pricePrecision).toString();

      levels.push({
        levelIndex: i,
        price: roundedPrice,
        status: GridLevelStatus.IDLE,
        filledQuantity: '0',
      });
    }

    return levels;
  }

  /**
   * Calculate expected profit per grid after fees
   */
  static calculateGridProfit(
    buyPrice: string | number,
    sellPrice: string | number,
    makerFeeRate: string | number,
    takerFeeRate: string | number
  ): {
    grossProfitPercent: string;
    netProfitPercent: string;
    isProfitable: boolean;
  } {
    const buy = new Decimal(buyPrice);
    const sell = new Decimal(sellPrice);
    const makerFee = new Decimal(makerFeeRate);
    const takerFee = new Decimal(takerFeeRate);

    // Gross profit percentage
    const grossProfitPercent = sell.minus(buy).div(buy).times(100);

    // Total fees (buy fee + sell fee)
    const totalFees = makerFee.plus(takerFee).times(100);

    // Net profit percentage
    const netProfitPercent = grossProfitPercent.minus(totalFees);

    return {
      grossProfitPercent: grossProfitPercent.toDecimalPlaces(4).toString(),
      netProfitPercent: netProfitPercent.toDecimalPlaces(4).toString(),
      isProfitable: netProfitPercent.gt(0),
    };
  }

  /**
   * Validate minimum profit after fees
   */
  static validateMinProfit(
    buyPrice: string | number,
    sellPrice: string | number,
    makerFeeRate: string | number,
    takerFeeRate: string | number,
    minProfitBps: number
  ): { valid: boolean; message: string } {
    const { netProfitPercent } = this.calculateGridProfit(
      buyPrice,
      sellPrice,
      makerFeeRate,
      takerFeeRate
    );

    const minProfitPercent = new Decimal(minProfitBps).div(100);
    const actualProfit = new Decimal(netProfitPercent);

    if (actualProfit.lt(minProfitPercent)) {
      return {
        valid: false,
        message: `Expected profit ${netProfitPercent}% is below minimum ${minProfitBps} bps (${minProfitPercent}%)`,
      };
    }

    return {
      valid: true,
      message: 'Profit validation passed',
    };
  }

  /**
   * Calculate quantity based on quote allocation
   */
  static calculateBuyQuantity(
    quoteAmount: string | number,
    price: string | number,
    amountPrecision: number
  ): string {
    const quote = new Decimal(quoteAmount);
    const px = new Decimal(price);
    
    if (px.isZero()) {
      throw new Error('Price cannot be zero');
    }

    return quote.div(px).toDecimalPlaces(amountPrecision).toString();
  }

  /**
   * Calculate quote value from base quantity
   */
  static calculateQuoteValue(
    baseAmount: string | number,
    price: string | number,
    pricePrecision: number
  ): string {
    const base = new Decimal(baseAmount);
    const px = new Decimal(price);

    return base.times(px).toDecimalPlaces(pricePrecision).toString();
  }

  /**
   * Check if price is within grid range
   */
  static isPriceInRange(
    price: string | number,
    lowerPrice: string | number,
    upperPrice: string | number
  ): boolean {
    const px = new Decimal(price);
    const lower = new Decimal(lowerPrice);
    const upper = new Decimal(upperPrice);

    return px.gte(lower) && px.lte(upper);
  }

  /**
   * Find the nearest grid level below a price (for buy orders)
   */
  static findNearestBuyLevel(levels: GridLevel[], currentPrice: string | number): GridLevel | null {
    const price = new Decimal(currentPrice);
    
    // Find levels below current price
    const belowLevels = levels.filter(level => 
      new Decimal(level.price).lt(price)
    );

    if (belowLevels.length === 0) {
      return null;
    }

    // Return the highest level below current price
    return belowLevels.reduce((highest, level) => 
      new Decimal(level.price).gt(highest.price) ? level : highest
    );
  }

  /**
   * Find the nearest grid level above a price (for sell orders)
   */
  static findNearestSellLevel(levels: GridLevel[], currentPrice: string | number): GridLevel | null {
    const price = new Decimal(currentPrice);
    
    // Find levels above current price
    const aboveLevels = levels.filter(level => 
      new Decimal(level.price).gt(price)
    );

    if (aboveLevels.length === 0) {
      return null;
    }

    // Return the lowest level above current price
    return aboveLevels.reduce((lowest, level) => 
      new Decimal(level.price).lt(lowest.price) ? level : lowest
    );
  }
}

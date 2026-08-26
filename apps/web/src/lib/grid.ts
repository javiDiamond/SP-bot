import Decimal from 'decimal.js';

// Mirrors @wallex/shared GridMath (arithmetic/geometric identical formulas).
// Kept local to avoid pulling Node-only deps (pino) into the browser bundle.

export interface GridPreviewLevel {
  levelIndex: number;
  price: string;
}

export function generateGridLevels(opts: {
  gridType: 'ARITHMETIC' | 'GEOMETRIC';
  lowerPrice: string;
  upperPrice: string;
  gridCount: number;
  pricePrecision: number;
}): GridPreviewLevel[] {
  const lower = new Decimal(opts.lowerPrice);
  const upper = new Decimal(opts.upperPrice);
  const count = opts.gridCount;

  if (count < 2) throw new Error('Grid count must be at least 2');
  if (lower.gte(upper)) throw new Error('Lower price must be less than upper price');

  const levels: GridPreviewLevel[] = [];
  for (let i = 0; i <= count; i++) {
    let price: Decimal;
    if (opts.gridType === 'ARITHMETIC') {
      price = lower.plus(upper.minus(lower).div(count).times(i));
    } else {
      const ratio = upper.div(lower).pow(1 / count);
      price = lower.times(ratio.pow(i));
    }
    levels.push({
      levelIndex: i,
      price: price.toDecimalPlaces(opts.pricePrecision).toString(),
    });
  }
  return levels;
}

export function gridProfit(
  buyPrice: string,
  sellPrice: string,
  makerFeeRate: string,
  takerFeeRate: string,
): { grossPct: string; netPct: string; isProfitable: boolean } {
  const gross = new Decimal(sellPrice).minus(buyPrice).div(buyPrice).times(100);
  const fees = new Decimal(makerFeeRate).plus(takerFeeRate).times(100);
  const net = gross.minus(fees);
  return {
    grossPct: gross.toDecimalPlaces(4).toString(),
    netPct: net.toDecimalPlaces(4).toString(),
    isProfitable: net.gt(0),
  };
}

export function spacingInfo(levels: GridPreviewLevel[], gridType: 'ARITHMETIC' | 'GEOMETRIC'): {
  avgSpacingPct: string;
  minSpacingPct: string;
} {
  if (levels.length < 2) return { avgSpacingPct: '0', minSpacingPct: '0' };
  const spacings: Decimal[] = [];
  for (let i = 1; i < levels.length; i++) {
    const prev = new Decimal(levels[i - 1].price);
    const cur = new Decimal(levels[i].price);
    spacings.push(cur.minus(prev).div(prev).times(100));
  }
  const sum = spacings.reduce((a, b) => a.plus(b), new Decimal(0));
  const min = spacings.reduce((a, b) => (b.lt(a) ? b : a), spacings[0]);
  return {
    avgSpacingPct: sum.div(spacings.length).toDecimalPlaces(3).toString(),
    minSpacingPct: min.toDecimalPlaces(3).toString(),
  };
}

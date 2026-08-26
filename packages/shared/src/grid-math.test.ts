import { describe, it, expect } from 'vitest';
import { GridMath } from './grid-math';
import { GridConfig, GridType, GridLevelStatus } from './types';

const baseConfig: GridConfig = {
  gridType: GridType.ARITHMETIC,
  lowerPrice: '100',
  upperPrice: '200',
  gridCount: 10,
  inventoryMode: 'EXISTING_ONLY',
  makerOnly: true,
  minProfitAfterFeesBps: 10,
  onRangeExit: 'PAUSE_KEEP_ORDERS',
  autoRecenter: false,
  allowMarketOrders: false,
};

describe('GridMath.generateGridLevels', () => {
  it('generates gridCount + 1 arithmetic levels with equal spacing', () => {
    const levels = GridMath.generateGridLevels({ ...baseConfig, gridCount: 4 }, 2);
    expect(levels.map(l => l.price)).toEqual(['100', '125', '150', '175', '200']);
    expect(levels[0].levelIndex).toBe(0);
    expect(levels[4].levelIndex).toBe(4);
    expect(levels.every(l => l.status === GridLevelStatus.IDLE)).toBe(true);
  });

  it('generates geometric levels with constant ratio between adjacent prices', () => {
    const levels = GridMath.generateGridLevels(
      { ...baseConfig, gridType: GridType.GEOMETRIC, lowerPrice: '100', upperPrice: '400', gridCount: 2 },
      6,
    );
    expect(levels).toHaveLength(3);
    const ratio = Number(levels[1].price) / Number(levels[0].price);
    const ratio2 = Number(levels[2].price) / Number(levels[1].price);
    expect(ratio).toBeCloseTo(2, 5);
    expect(ratio2).toBeCloseTo(2, 5);
  });

  it('rounds prices to the market price precision', () => {
    const levels = GridMath.generateGridLevels(
      { ...baseConfig, lowerPrice: '1', upperPrice: '2', gridCount: 3 },
      2,
    );
    expect(levels.map(l => l.price)).toEqual(['1', '1.33', '1.67', '2']);
  });

  it('rejects grid counts below 2', () => {
    expect(() => GridMath.generateGridLevels({ ...baseConfig, gridCount: 1 }, 2)).toThrow(
      'Grid count must be at least 2',
    );
  });

  it('rejects a lower bound >= upper bound', () => {
    expect(() => GridMath.generateGridLevels({ ...baseConfig, lowerPrice: '200', upperPrice: '100' }, 2)).toThrow();
    expect(() => GridMath.generateGridLevels({ ...baseConfig, lowerPrice: '100', upperPrice: '100' }, 2)).toThrow();
  });
});

describe('GridMath.calculateGridProfit (fee awareness)', () => {
  it('computes gross and net profit percentages', () => {
    const res = GridMath.calculateGridProfit('100', '102', '0.0035', '0.0035');
    expect(res.grossProfitPercent).toBe('2');
    expect(res.netProfitPercent).toBe('1.3');
    expect(res.isProfitable).toBe(true);
  });

  it('flags unprofitable grids when fees exceed spread', () => {
    const res = GridMath.calculateGridProfit('100', '100.5', '0.0035', '0.0035');
    expect(res.grossProfitPercent).toBe('0.5');
    expect(res.netProfitPercent).toBe('-0.2');
    expect(res.isProfitable).toBe(false);
  });
});

describe('GridMath.validateMinProfit', () => {
  it('passes when net profit meets the bps minimum', () => {
    const res = GridMath.validateMinProfit('100', '102', '0.0035', '0.0035', 100);
    expect(res.valid).toBe(true);
  });

  it('fails when net profit is below the bps minimum', () => {
    const res = GridMath.validateMinProfit('100', '101', '0.0035', '0.0035', 100);
    expect(res.valid).toBe(false);
    expect(res.message).toContain('below minimum');
  });
});

describe('GridMath quantities and range checks', () => {
  it('calculates buy quantity from quote allocation with precision', () => {
    expect(GridMath.calculateBuyQuantity('500', '20000', 6)).toBe('0.025');
    expect(GridMath.calculateBuyQuantity('1', '3', 4)).toBe('0.3333');
  });

  it('rejects zero price for buy quantity', () => {
    expect(() => GridMath.calculateBuyQuantity('100', '0', 6)).toThrow('Price cannot be zero');
  });

  it('calculates quote value from base amount', () => {
    expect(GridMath.calculateQuoteValue('0.5', '20000', 2)).toBe('10000');
  });

  it('checks price in range inclusively', () => {
    expect(GridMath.isPriceInRange('150', '100', '200')).toBe(true);
    expect(GridMath.isPriceInRange('100', '100', '200')).toBe(true);
    expect(GridMath.isPriceInRange('200', '100', '200')).toBe(true);
    expect(GridMath.isPriceInRange('99.99', '100', '200')).toBe(false);
    expect(GridMath.isPriceInRange('200.01', '100', '200')).toBe(false);
  });

  it('finds nearest buy level strictly below price', () => {
    const levels = GridMath.generateGridLevels({ ...baseConfig, gridCount: 4 }, 2);
    const buy = GridMath.findNearestBuyLevel(levels, '150');
    expect(buy?.price).toBe('125');
    expect(GridMath.findNearestBuyLevel(levels, '100')).toBeNull();
  });

  it('finds nearest sell level strictly above price', () => {
    const levels = GridMath.generateGridLevels({ ...baseConfig, gridCount: 4 }, 2);
    const sell = GridMath.findNearestSellLevel(levels, '150');
    expect(sell?.price).toBe('175');
    expect(GridMath.findNearestSellLevel(levels, '200')).toBeNull();
  });
});

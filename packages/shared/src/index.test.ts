import { describe, it, expect } from 'vitest';
import { DecimalUtils } from './decimal-utils';
import { GridMath } from './grid-math';
import { GridType } from './types';

describe('DecimalUtils', () => {
  it('should add two numbers', () => {
    expect(DecimalUtils.add('10.5', '20.3')).toBe('30.8');
  });

  it('should subtract two numbers', () => {
    expect(DecimalUtils.sub('30.8', '10.5')).toBe('20.3');
  });

  it('should multiply two numbers', () => {
    expect(DecimalUtils.mul('10', '5.5')).toBe('55');
  });

  it('should divide two numbers', () => {
    expect(DecimalUtils.div('100', '4', 2)).toBe('25.00');
  });

  it('should round to precision', () => {
    expect(DecimalUtils.round('10.123456789', 4)).toBe('10.1235');
  });
});

describe('GridMath', () => {
  it('should generate arithmetic grid levels', () => {
    const config = {
      gridType: GridType.ARITHMETIC,
      lowerPrice: '100',
      upperPrice: '200',
      gridCount: 5,
      inventoryMode: 'EXISTING_ONLY' as const,
      makerOnly: true,
      minProfitAfterFeesBps: 10,
      onRangeExit: 'PAUSE_KEEP_ORDERS' as const,
      autoRecenter: false,
      allowMarketOrders: false,
    };

    const levels = GridMath.generateGridLevels(config, 2);
    expect(levels).toHaveLength(6); // gridCount + 1
    expect(levels[0].price).toBe('100.00');
    expect(levels[5].price).toBe('200.00');
  });

  it('should calculate grid profit', () => {
    const result = GridMath.calculateGridProfit(
      '100',
      '101',
      '0.001', // 0.1% maker fee
      '0.001'  // 0.1% taker fee
    );

    expect(parseFloat(result.grossProfitPercent)).toBeCloseTo(1.0, 2);
    expect(parseFloat(result.netProfitPercent)).toBeCloseTo(0.6, 2);
    expect(result.isProfitable).toBe(true);
  });
});

import { describe, it, expect } from 'vitest';
import Decimal from 'decimal.js';
import {
  calculateArithmeticGridLevels,
  calculateGeometricGridLevels,
  roundToPrecision,
  validateMinProfitAfterFees,
  generateClientOrderId,
} from './index';

describe('Grid Math', () => {
  it('should calculate arithmetic grid levels correctly', () => {
    const levels = calculateArithmeticGridLevels(100, 200, 5, 2);
    expect(levels).toHaveLength(6); // 5 grids = 6 levels
    expect(levels[0]).toBe('100.00');
    expect(levels[5]).toBe('200.00');
  });

  it('should calculate geometric grid levels correctly', () => {
    const levels = calculateGeometricGridLevels(100, 200, 5, 4);
    expect(levels).toHaveLength(6);
    expect(parseFloat(levels[0])).toBeCloseTo(100, 2);
    expect(parseFloat(levels[5])).toBeCloseTo(200, 2);
  });

  it('should round to precision correctly', () => {
    expect(roundToPrecision(123.456789, 2)).toBe('123.46');
    expect(roundToPrecision(123.456789, 4)).toBe('123.4568');
    expect(roundToPrecision(123.456789, 0)).toBe('123');
  });

  it('should validate minimum profit after fees', () => {
    const result = validateMinProfitAfterFees(
      100,
      102,
      0.001,
      0.001,
      10
    );
    
    // 2% spread, 0.2% fees, should have ~1.8% profit (180 bps)
    expect(result.valid).toBe(true);
    expect(result.expectedProfitBps).toBeGreaterThan(100);
  });

  it('should reject insufficient profit after fees', () => {
    const result = validateMinProfitAfterFees(
      100,
      100.5,
      0.001,
      0.001,
      50 // 50 bps minimum
    );
    
    // 0.5% spread, 0.2% fees = 0.3% profit (30 bps), less than 50 bps required
    expect(result.valid).toBe(false);
  });
});

describe('Client Order ID Generation', () => {
  it('should generate valid client order IDs', () => {
    const orderId = generateClientOrderId('BOT1', 'BUY', 3);
    expect(orderId).toMatch(/^GB_BOT1_B_L3_[A-Z0-9]+$/);
    expect(orderId.length).toBeLessThanOrEqual(32);
  });

  it('should generate unique IDs for different parameters', () => {
    const id1 = generateClientOrderId('BOT1', 'BUY', 1, 'ABC');
    const id2 = generateClientOrderId('BOT1', 'SELL', 1, 'ABC');
    const id3 = generateClientOrderId('BOT2', 'BUY', 1, 'ABC');
    
    expect(id1).not.toBe(id2);
    expect(id1).not.toBe(id3);
  });
});

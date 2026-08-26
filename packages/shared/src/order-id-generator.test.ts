import { describe, it, expect } from 'vitest';
import { generateClientOrderId } from './order-id-generator';

describe('generateClientOrderId', () => {
  it('produces the documented format with bot/side/level segments', () => {
    const id = generateClientOrderId('abcdef12-3456', 'BUY', 3);
    const parts = id.split('_');
    expect(parts[0]).toBe('GB');
    expect(parts[1]).toBe('ABCDEF12');
    expect(parts[2]).toBe('B');
    expect(parts[3]).toBe('L03');
    expect(parts[4]).toBeTruthy();
  });

  it('uses S segment for sells and pads level index', () => {
    const id = generateClientOrderId('bot', 'SELL', 42);
    expect(id).toMatch(/^GB_BOT_S_L42_/);
  });

  it('uses the provided suffix instead of a random one', () => {
    const id = generateClientOrderId('bot', 'BUY', 1, 'recenter');
    expect(id).toBe('GB_BOT_B_L01_recenter');
  });

  it('generates unique ids across rapid calls', () => {
    const ids = new Set(Array.from({ length: 500 }, () => generateClientOrderId('bot', 'BUY', 1)));
    expect(ids.size).toBe(500);
  });
});

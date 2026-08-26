import { describe, it, expect } from 'vitest';
import { diffOpenOrders } from './reconcile-diff';

describe('diffOpenOrders (orphan policy)', () => {
  it('reports nothing when exchange and DB agree', () => {
    const diff = diffOpenOrders(
      [{ clientOrderId: 'a' }, { clientOrderId: 'b' }],
      ['a', 'b'],
    );
    expect(diff).toEqual({ orphans: [], missing: [] });
  });

  it('flags unknown exchange orders as orphans (never canceled by callers)', () => {
    const diff = diffOpenOrders(
      [{ clientOrderId: 'a' }, { clientOrderId: 'foreign-1' }],
      ['a'],
    );
    expect(diff.orphans).toEqual(['foreign-1']);
    expect(diff.missing).toEqual([]);
  });

  it('flags DB-open orders absent on the exchange as missing', () => {
    const diff = diffOpenOrders([{ clientOrderId: 'a' }], ['a', 'gone-1']);
    expect(diff.orphans).toEqual([]);
    expect(diff.missing).toEqual(['gone-1']);
  });

  it('handles disjoint sets on both sides', () => {
    const diff = diffOpenOrders(
      [{ clientOrderId: 'x' }, { clientOrderId: 'y' }],
      ['p', 'q'],
    );
    expect(diff.orphans).toEqual(['x', 'y']);
    expect(diff.missing).toEqual(['p', 'q']);
  });

  it('dedupes repeated ids', () => {
    const diff = diffOpenOrders(
      [{ clientOrderId: 'x' }, { clientOrderId: 'x' }],
      ['p', 'p'],
    );
    expect(diff.orphans).toEqual(['x']);
    expect(diff.missing).toEqual(['p']);
  });

  it('handles empty inputs', () => {
    expect(diffOpenOrders([], [])).toEqual({ orphans: [], missing: [] });
    expect(diffOpenOrders([], ['a']).missing).toEqual(['a']);
    expect(diffOpenOrders([{ clientOrderId: 'a' }], []).orphans).toEqual(['a']);
  });
});

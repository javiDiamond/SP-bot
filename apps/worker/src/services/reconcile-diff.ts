/**
 * Pure reconciliation diff: compares exchange open orders vs DB open orders
 * by exact clientOrderId.
 *
 * Policy (spec: unknown orders are never touched):
 * - orphans: open on the exchange but not in our DB → NEVER canceled, logged only
 * - missing: open in our DB but not on the exchange → resolved via order lookup
 */

export interface OpenOrderRef {
  clientOrderId: string;
}

export interface ReconcileDiff {
  /** On the exchange, unknown to us. */
  orphans: string[];
  /** Open in DB, absent on the exchange. */
  missing: string[];
}

export function diffOpenOrders<T extends OpenOrderRef>(
  exchangeOpen: readonly T[],
  dbOpenOrderIds: readonly string[],
): ReconcileDiff {
  const dbSet = new Set(dbOpenOrderIds);
  const exchangeSet = new Set(exchangeOpen.map(o => o.clientOrderId));

  const seen = new Set<string>();
  const orphans: string[] = [];
  for (const order of exchangeOpen) {
    const id = order.clientOrderId;
    if (dbSet.has(id) || seen.has(id)) continue;
    seen.add(id);
    orphans.push(id);
  }

  const missing: string[] = [];
  const missingSeen = new Set<string>();
  for (const id of dbOpenOrderIds) {
    if (exchangeSet.has(id) || missingSeen.has(id)) continue;
    missingSeen.add(id);
    missing.push(id);
  }

  return { orphans, missing };
}

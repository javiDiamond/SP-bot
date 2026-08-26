'use client';

import { useEffect } from 'react';
import { API_URL, getToken } from './api';
import type { RealtimeMessage } from './types';

type Handler = (msg: RealtimeMessage) => void;

let es: EventSource | null = null;
let token: string | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let closedByUser = false;
const handlers = new Set<Handler>();

function connect() {
  if (typeof window === 'undefined') return;
  const t = getToken();
  if (!t) {
    es?.close();
    es = null;
    return;
  }
  if (es && token === t) return;
  token = t;

  es?.close();
  es = new EventSource(`${API_URL}/api/stream?token=${encodeURIComponent(t)}`);

  es.onmessage = (event) => {
    try {
      const msg = JSON.parse(event.data) as RealtimeMessage;
      handlers.forEach((h) => h(msg));
    } catch {
      /* ignore malformed frames */
    }
  };

  es.onerror = () => {
    es?.close();
    es = null;
    if (!closedByUser && !reconnectTimer) {
      reconnectTimer = setTimeout(() => {
        reconnectTimer = null;
        connect();
      }, 3000);
    }
  };
}

export function startEventStream(): void {
  closedByUser = false;
  connect();
}

export function stopEventStream(): void {
  closedByUser = true;
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  es?.close();
  es = null;
}

/** Subscribe to realtime events; returns unsubscribe. */
export function onRealtimeEvent(handler: Handler): () => void {
  handlers.add(handler);
  return () => {
    handlers.delete(handler);
  };
}

/**
 * React hook: subscribes to the realtime stream and invokes the handler.
 * The event stream itself is started/stopped by the dashboard layout.
 */
export function useRealtime(handler: Handler): void {
  useEffect(() => onRealtimeEvent(handler), [handler]);
}

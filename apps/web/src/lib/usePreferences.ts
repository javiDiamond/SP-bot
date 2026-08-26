'use client';

import { useSyncExternalStore } from 'react';
import {
  getPreferences,
  setPreferences,
  subscribePreferences,
  type DisplayPreferences,
} from './preferences';

let snapshot: DisplayPreferences = getPreferences();

function subscribe(onStoreChange: () => void) {
  return subscribePreferences(() => {
    snapshot = getPreferences();
    onStoreChange();
  });
}

function getSnapshot(): DisplayPreferences {
  return snapshot;
}

function getServerSnapshot(): DisplayPreferences {
  return getPreferences();
}

/** Reactive access to the decorative display preferences (digit style, calendar). */
export function usePreferences(): {
  preferences: DisplayPreferences;
  update: (next: Partial<DisplayPreferences>) => void;
} {
  const preferences = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return { preferences, update: setPreferences };
}

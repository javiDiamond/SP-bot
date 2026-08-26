import { createNavigation } from 'next-intl/navigation';
import { routing } from './routing';

/**
 * Locale-aware navigation primitives. Use these instead of the raw
 * `next/navigation` / `next/link` exports inside the `[locale]` segment so
 * that the active locale prefix is preserved transparently.
 */
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);

/**
 * Maps known backend error messages/codes to translation keys so users never
 * see raw English backend strings. Unknown errors fall through to the raw
 * message (still better than a generic message for novel failures).
 *
 * Usage in components:
 *   const key = apiErrorKey(err);
 *   setError(key ? t(key) : (err?.message ?? t('errors.generic')));
 */

const ERROR_KEY_MAP: Array<{ pattern: RegExp; key: string }> = [
  { pattern: /invalid credentials/i, key: 'errors.invalidCredentials' },
  { pattern: /session expired|unauthorized/i, key: 'errors.sessionExpired' },
  { pattern: /bad response/i, key: 'errors.badResponse' },
  { pattern: /download failed/i, key: 'errors.downloadFailed' },
  { pattern: /command failed/i, key: 'errors.commandFailed' },
];

export function apiErrorKey(err: unknown): string | null {
  const message = err instanceof Error ? err.message : typeof err === 'string' ? err : '';
  if (!message) return null;
  for (const { pattern, key } of ERROR_KEY_MAP) {
    if (pattern.test(message)) return key;
  }
  return null;
}

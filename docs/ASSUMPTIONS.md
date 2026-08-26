# Wallex Grid Bot - Assumptions Document

This document records assumptions made during implementation due to unclear or missing details in the Wallex API documentation.

## 1. API Key Header

**Assumption**: The default API key header is `API-Key`.

**Reason**: The docs mention sending API-Key in Request-Header but don't explicitly state the exact header name format.

**Implementation**: Made configurable via `WALLEX_API_KEY_HEADER` environment variable, defaulting to `API-Key`.

## 2. Private WebSocket Stream Key

**Assumption**: The `stream_key` for private WebSocket channels must be obtained manually from the Wallex login flow and configured via environment variable.

**Reason**: Documentation mentions `stream_key` is received during login but doesn't provide a clear API-key-based authentication flow for obtaining it programmatically.

**Implementation**: 
- Private WebSocket is optional
- Configured via `WALLEX_STREAM_KEY` environment variable
- If not provided, system uses REST polling fallback for order/balance updates

## 3. Minimum Order Size / Notional

**Assumption**: Spot markets endpoint may not provide explicit minimum notional values.

**Reason**: The `/hector/web/v1/markets` endpoint response schema doesn't clearly show a minimum notional field.

**Implementation**: 
- Configurable `MIN_NOTIONAL_FALLBACK` (default: 1 USDT equivalent)
- Per-symbol overrides supported in database/settings
- Order validation includes notional checks with warnings/errors exposed in dashboard

## 4. Post-Only / Maker-Only Flag

**Assumption**: Wallex does not provide a native post-only order flag.

**Reason**: No post-only parameter mentioned in order creation documentation.

**Implementation**: 
- Optional maker-only protection using order book depth checking
- Buy orders: reduce price if would cross best ask
- Sell orders: increase price if would cross best bid
- Configurable behavior (reduce/skip/queue)
- Default: maker-only protection enabled for grid orders

## 5. Historical Trade Data

**Assumption**: Wallex `/v1/trades` endpoint only provides latest/recent trades, not full historical data.

**Reason**: Documentation describes it as "latestTrades" without pagination or historical range parameters.

**Implementation**: 
- Primary backtesting uses candle data from `/v1/udf/history`
- Trade/tick-based backtesting only available for user-imported historical trade files (CSV/JSON)
- Do not rely on `/v1/trades` for historical backtests

## 6. Testnet Environment

**Assumption**: Wallex does not provide a public testnet/sandbox environment.

**Reason**: No testnet documentation found; all examples use production API URL.

**Implementation**: 
- Robust dry-run/paper trading mode built-in
- Mocked exchange tests for CI/CD
- Demo market data mode for local development (synthetic or cached candles)

## 7. Account Balances Calculation

**Assumption**: For `/v1/account/balances`, tradable balance = `value - locked`.

**Reason**: Endpoint provides `value` and `locked` fields; `balances-detail` endpoint may provide `available` but its availability is uncertain.

**Implementation**: 
- Prefer `balances-detail` endpoint if available and returns `available`
- Fallback to conservative calculation: `value - locked`
- Logic documented and configurable

## 8. Rate Limiting Behavior

**Assumption**: Order creation rate limit is strictly enforced at 20 requests per 10 seconds.

**Reason**: Documentation explicitly states this limit.

**Implementation**: 
- Strict client-side rate limiter for order creation
- Queue-based order placement with rate limiting
- Backoff on 429 responses
- Dashboard shows rate limit status

## 9. WebSocket Connection Limits

**Assumption**: WebSocket connections are forcibly disconnected after ~30 minutes, with PING/PONG extending lifetime.

**Reason**: Documentation states 30-minute limit, server sends PING every 20 seconds, PONG extends by 30 seconds, max 100 PONGs.

**Implementation**: 
- Automatic reconnect with exponential backoff
- Proactive reconnect before 30-minute limit (e.g., at 25 minutes)
- PING/PONG handling
- Resubscription after reconnect
- REST polling fallback when WebSocket unavailable

## 10. Client Order ID Format

**Assumption**: Client order IDs must use only letters (A-Z, a-z), underscore (_), and digits (0-9). No dashes.

**Reason**: Documentation specifies allowed characters for `client_id` parameter.

**Implementation**: 
- Client order ID pattern: `GB_BOT7_BUY_L3_A1B2C3`
- Maximum length: 32 characters
- Unique per order
- Bot prefix for order management

## 11. Sub-Account Support

**Assumption**: Sub-account (credit account) trading requires additional `sub-account-client-id` header.

**Reason**: Documentation mentions this header for margin/credit account spot trading.

**Implementation**: 
- Optional `sub-account-client-id` header support
- Configurable per exchange account
- Only used for spot trading (not margin endpoints)

## 12. Fee Endpoint Coverage

**Assumption**: `/v1/account/fee` may not return fees for all symbols.

**Reason**: Example shows single symbol response; unclear if all symbols are always returned.

**Implementation**: 
- Cache fees per symbol
- Configurable fallback fees if endpoint fails or symbol missing
- Warning shown in dashboard if fees unavailable

## 13. Order Status Values

**Assumption**: Standard order statuses include: NEW, PARTIALLY_FILLED, FILLED, CANCELED, REJECTED, EXPIRED.

**Reason**: Documentation shows some examples but not exhaustive list.

**Implementation**: 
- Defensive parsing of order statuses
- Unknown statuses logged and treated conservatively
- State machine handles common statuses

## 14. Market Data Freshness

**Assumption**: Price data older than 30 seconds should be considered stale for safety.

**Reason**: No explicit guidance; chosen conservative default.

**Implementation**: 
- Configurable `STALE_PRICE_TIMEOUT_SECONDS` (default: 30)
- Stale price pauses new order placement
- Warning emitted to dashboard
- Optional order cancellation on stale price

## 15. Authentication for Private Endpoints

**Assumption**: All private endpoints require `API-Key` header; no additional signature/timestamp required.

**Reason**: Documentation shows API-Key header usage without mentioning HMAC signatures or timestamps.

**Implementation**: 
- Simple API-Key header authentication
- Configurable header name
- No timestamp/signature logic (unless docs clarify otherwise)

## 16. i18n Library Choice

**Assumption**: `next-intl` (v4) is the i18n layer for the dashboard.

**Reason**: First-class Next.js App Router support — middleware-based locale-prefixed routing,
server-rendered `<html lang dir>` from the root layout, `createNavigation` locale-aware
links/router, ICU message format (pluralization + interpolation) for both `en` and `fa`, and
no runtime reload requirement for locale switching.

**Implementation**: `apps/web/src/i18n/{routing,navigation,request}.ts` +
`apps/web/src/middleware.ts`; messages in `apps/web/messages/{en,fa}.json` with full key
parity (verified by the string-audit script).

## 17. Digit Style & Calendar Defaults

**Assumption**: Financial figures (prices, quantities, balances, PnL, percentages, fees) are
**always rendered with Western Arabic digits (0-9)** in both locales, via
`Intl.NumberFormat(...-u-nu-latn)`. The configurable `digitStyle` preference
(`latin` default, `persian` opt-in) applies **only to decorative text** such as pagination
copy — never to trading figures.

**Reason**: Exchange data, order entry, and operator muscle memory are built around Latin
digits; mixing numeral systems in a trading UI is a documented source of input/reading errors.

**Implementation**: `apps/web/src/lib/format.ts` (`fmtNum`/`fmtPnl` force `nu-latn`;
`fmtCount` honours the preference) and `apps/web/src/lib/preferences.ts`
(`wallex-display-prefs` localStorage key, surfaced on the Settings page).

**Assumption**: Dates remain **Gregorian by default** in both locales. Jalali (Persian
calendar) display is an **explicit opt-in** preference (`calendar: "jalali"`), implemented
with `Intl.DateTimeFormat`'s built-in `calendar: "persian"` (no extra library needed), and
still renders Latin digits.

**Reason**: Candles, audit logs, and exchange timestamps are Gregorian-based; mixing calendars
is a correctness risk in a trading tool.

## 18. Chart RTL Handling

**Assumption**: Chart canvases (lightweight-charts price chart, Recharts equity chart) stay
**LTR** (`dir="ltr"` wrapper) even in the Persian UI. Surrounding titles, legends, labels and
metric cards are fully RTL.

**Reason**: Neither library supports mirrored rendering (time axis, price scale position,
crosshair); time-series charts are conventionally read left-to-right even in RTL products.
Keeping the canvas LTR guarantees grid-level price lines and the price axis stay numerically
and positionally identical across locales. Documented in `docs/RTL_AUDIT.md`.

## 19. Persian Font Choice

**Assumption**: **Vazirmatn** (via `next/font/google`, SIL Open Font License — commercial use
permitted) is the Persian UI font.

**Reason**: Designed for UI screens, wide weight range, renders Latin digits well, open
license. IRANSans is not freely licensed for embedding; Estedad was evaluated but Vazirmatn
has better tabular-figure behavior.

**Implementation**: The CSS variable is referenced only from an `html[lang='fa'] body` rule
(`src/styles/globals.css`), so English users never download the font files. `letter-spacing`
is zeroed for Persian on labels/titles/table headers (tracking breaks Arabic-script joining),
and the font never auto-substitutes digits — financial figures stay Latin per §17.

## 20. Modal Button Order in Both Directions

**Assumption**: Primary/confirm action is always the **trailing ("end")** child of the modal
action row; Cancel precedes it. Flexbox mirrors the row under `dir="rtl"`, so the
meaning-to-position mapping is identical in both locales.

**Reason**: Prevents destructive-action misclicks for operators switching languages mid-session
(see `docs/RTL_AUDIT.md` — "Button-order convention").

## 21. Locale Resolution Order

**Assumption**: Resolution priority is: (1) locale in URL path → (2) authenticated user's
`preferredLocale` (applied at login) → (3) `NEXT_LOCALE` cookie → (4) `Accept-Language`
header → (5) default `en`.

**Reason**: Matches the product spec; explicit URL always wins, then durable user preference,
then browser hint.

**Implementation**: `next-intl` middleware (cookie/Accept-Language), login flow redirect in
`src/app/[locale]/login/page.tsx` (stored `preferredLocale`), backend PATCH
`/api/auth/me` + `preferred_locale` column (migration
`20260826112738_add_user_preferred_locale`).

## 22. Server-Generated Content — Not Yet Localized

The following server-generated artifacts intentionally remain **English-only** for this pass:

- **CSV export headers** (`GET /api/backtests/:id/trades.csv`,
  `GET /api/orders/fills/export.csv`) — English headers keep exports interoperable with
  spreadsheet/analysis tooling.
- **Email/notification templates** — the product sends no emails today; if added, they should
  respect the user's `preferredLocale`.
- **Log/audit/event payloads** (raw JSON in the Logs page, audit trail) — kept in English by
  design for operability/compliance; only their UI chrome (labels, levels, filters) is
  translated.
- **Backend error codes/messages** — raw strings are never shown directly; the frontend maps
  known errors to translation keys (`apps/web/src/lib/errors.ts`) and falls back to the raw
  message only for novel failures.

## 23. Language Switcher Presentation

**Assumption**: The switcher shows **English / فارسی** with EN / فا indicators and a neutral
language icon (lucide `Languages`) — **no national flags**, since neither language is tied to
a single country. The Persian option is written in Persian script (`فارسی`), never
transliterated.

**Assumption**: Locale switching is a **client-side route transition** (`router.replace` with
`{ locale }`) — no full page reload; route, query params and react-query cache are preserved.

---

## Safety Principles Applied

When in doubt, the implementation follows these principles:

1. **Safe defaults**: Paper trading by default, conservative limits
2. **Configurability**: Ambiguous behaviors made configurable
3. **Documentation**: All assumptions documented here and in code comments
4. **Validation**: Input/output validation with Zod schemas
5. **Fallbacks**: REST polling when WebSocket unavailable
6. **Transparency**: Warnings and errors exposed in dashboard
7. **Audit logging**: All trading actions logged

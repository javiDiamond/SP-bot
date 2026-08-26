# Wallex Grid Bot - Implementation Milestones

Based on the original requirements, here are the remaining milestones to complete the project.

---

## Milestone 1: Database & Migrations ✅ (In Progress)

**Goal**: Complete database setup with migrations and seed data.

### Tasks
- [x] Prisma schema defined
- [ ] Generate Prisma client
- [ ] Create migration files
- [ ] Seed script for admin user, demo markets, sample data
- [ ] Database connection utilities
- [ ] Repository layer for all entities

### Deliverables
- Working Prisma client
- Migration files ready to apply
- Seed data script
- Repository classes for CRUD operations

---

## Milestone 2: Exchange Adapter Completion ✅ (Partial)

**Goal**: Fully functional Wallex exchange adapter with REST and WebSocket.

### Tasks
- [x] REST client structure
- [ ] Implement all REST endpoints:
  - [ ] GET /hector/web/v1/markets
  - [ ] GET /v1/udf/history (candles)
  - [ ] GET /v1/depth
  - [ ] GET /v1/trades
  - [ ] GET /v1/account/balances
  - [ ] GET /v1/account/balances-detail
  - [ ] GET /v1/account/fee
  - [ ] POST /v1/account/orders
  - [ ] DELETE /v1/account/orders/{client_id}
  - [ ] GET /v1/account/orders/{client_id}
  - [ ] GET /v1/account/orders
  - [ ] GET /v1/account/openOrders
- [ ] WebSocket client with all channels
- [ ] Rate limiter implementation (20 orders/10s)
- [ ] Error handling and retries
- [ ] Response validation with Zod
- [ ] Paper trading simulator completion
- [ ] Market data service (price, depth, stale detection)

### Deliverables
- Complete WallexRestClient class
- Complete WallexWebSocketManager class
- PaperTradingEngine class
- MarketDataService class
- Unit tests for all methods

---

## Milestone 3: Grid Strategy Engine ✅ (Partial)

**Goal**: Complete grid trading strategy with full lifecycle management.

### Tasks
- [x] Grid math (arithmetic/geometric)
- [x] Grid level generation
- [ ] Grid state machine implementation
- [ ] Order pairing logic (buy→sell, sell→buy)
- [ ] Partial fill handling
- [ ] Maker-only protection with order book
- [ ] Range exit behaviors:
  - [ ] PAUSE_KEEP_ORDERS
  - [ ] PAUSE_CANCEL_ALL
  - [ ] STOP_CANCEL_ALL
  - [ ] RECENTER
  - [ ] TRAILING
- [ ] Stop-loss and take-profit support
- [ ] Auto-recenter logic
- [ ] Balance checking before orders
- [ ] Fee-aware profit validation
- [ ] Grid bot engine class

### Deliverables
- GridStrategy class with full lifecycle
- GridLevel state management
- Order pairing and tracking
- Range exit handlers
- Unit tests for all scenarios

---

## Milestone 4: Backtesting Engine ✅ (Partial)

**Goal**: Complete backtesting system with candle simulation and optimization.

### Tasks
- [x] Backtest types and schemas
- [x] Candle data fetching from Wallex
- [ ] Candle-based simulation engine
- [ ] Fill logic (limit orders on price cross)
- [ ] Partial fill simulation
- [ ] Fee application
- [ ] PnL calculation
- [ ] Metrics calculation:
  - [ ] Total return
  - [ ] Grid profit
  - [ ] Unrealized PnL
  - [ ] Fees paid
  - [ ] Number of trades
  - [ ] Win rate
  - [ ] Max drawdown
  - [ ] Sharpe ratio
  - [ ] Sortino ratio
  - [ ] Buy-and-hold comparison
- [ ] Backtest result storage
- [ ] Parameter optimization (grid search)
- [ ] Trade/tick simulation (for imported data)
- [ ] Equity curve data generation

### Deliverables
- BacktestEngine class
- CandleSimulator class
- MetricsCalculator class
- OptimizationRunner class
- Backtest repository
- Unit tests

---

## Milestone 5: API Server (apps/api)

**Goal**: Fastify-based REST API for dashboard and bot management.

### Tasks
- [ ] Fastify server setup
- [ ] Authentication system:
  - [ ] JWT tokens
  - [ ] Password hashing (argon2/bcrypt)
  - [ ] Session management
  - [ ] Role-based access (ADMIN, TRADER, VIEWER)
- [ ] API Routes:
  - [ ] POST /auth/login
  - [ ] POST /auth/logout
  - [ ] POST /auth/refresh
  - [ ] GET /markets
  - [ ] GET /markets/:symbol
  - [ ] GET /balances
  - [ ] GET /orders
  - [ ] GET /fills
  - [ ] GET /bots
  - [ ] POST /bots
  - [ ] GET /bots/:id
  - [ ] PATCH /bots/:id
  - [ ] POST /bots/:id/start
  - [ ] POST /bots/:id/pause
  - [ ] POST /bots/:id/resume
  - [ ] POST /bots/:id/stop
  - [ ] POST /bots/:id/cancel-all
  - [ ] GET /bots/:id/orders
  - [ ] GET /bots/:id/fills
  - [ ] GET /bots/:id/pnl
  - [ ] GET /backtests
  - [ ] POST /backtests/run
  - [ ] GET /backtests/:id
  - [ ] GET /backtests/compare
  - [ ] POST /optimization/run
  - [ ] GET /exchange-accounts
  - [ ] POST /exchange-accounts
  - [ ] PATCH /exchange-accounts/:id
  - [ ] DELETE /exchange-accounts/:id
  - [ ] GET /risk-settings
  - [ ] PATCH /risk-settings
  - [ ] POST /kill-switch/activate
  - [ ] POST /kill-switch/deactivate
  - [ ] GET /events
  - [ ] GET /audit-logs
  - [ ] GET /health
- [ ] Input validation with Zod
- [ ] Error handling middleware
- [ ] Rate limiting
- [ ] CORS configuration
- [ ] Security headers (Helmet)
- [ ] API key encryption/decryption utilities
- [ ] WebSocket/SSE for real-time updates
- [ ] Redis pub/sub integration

### Deliverables
- Complete Fastify API server
- Authentication system
- All REST endpoints
- Real-time update system
- Integration tests

---

## Milestone 6: Worker Process (apps/worker)

**Goal**: Trading engine worker with bot management and job processing.

### Tasks
- [ ] Worker process setup
- [ ] BullMQ queue configuration:
  - [ ] bot.commands
  - [ ] bot.reconciliation
  - [ ] backtest.run
  - [ ] market.data.sync
  - [ ] pnl.snapshot
- [ ] Bot engine manager:
  - [ ] Start bot
  - [ ] Pause bot
  - [ ] Resume bot
  - [ ] Stop bot
  - [ ] Cancel all orders
- [ ] Redis locking (one engine per bot)
- [ ] Market data subscription management
- [ ] Order placement/cancellation
- [ ] Fill processing
- [ ] Reconciliation job:
  - [ ] Fetch open orders
  - [ ] Compare with local state
  - [ ] Detect missing/orphan orders
  - [ ] Update fills/statuses
- [ ] PnL snapshot job
- [ ] Stale price monitoring
- [ ] WebSocket management
- [ ] Crash recovery logic
- [ ] Event emission to API via Redis
- [ ] Graceful shutdown

### Deliverables
- Worker process with all queues
- BotEngineManager class
- ReconciliationService class
- PnLSnapshotService class
- Event publisher
- Unit and integration tests

---

## Milestone 7: Web Dashboard (apps/web)

**Goal**: Next.js dashboard for bot management and monitoring.

### Tasks
- [ ] Next.js App Router setup
- [ ] Authentication pages:
  - [ ] Login page
  - [ ] Logout functionality
- [ ] Dashboard layout with sidebar
- [ ] Pages:
  - [ ] Overview page (system status, active bots, PnL summary)
  - [ ] Bots list page (table with filters, actions)
  - [ ] Create bot wizard (multi-step form)
  - [ ] Bot detail page (chart, orders, fills, PnL, logs)
  - [ ] Backtests list page
  - [ ] Backtest detail/comparison page
  - [ ] Exchange accounts page
  - [ ] Balances page
  - [ ] Orders/fills history page
  - [ ] Risk/settings page
  - [ ] Logs/events page
  - [ ] Audit log page
- [ ] Components:
  - [ ] Price chart with grid levels (lightweight-charts)
  - [ ] Bot status cards
  - [ ] Orders table
  - [ ] Fills table
  - [ ] Grid levels visualization
  - [ ] PnL metrics display
  - [ ] Equity curve chart
  - [ ] Confirmation modals
  - [ ] Live/dry-run badges
  - [ ] Warning banners (stale data, WS disconnected, risk limits)
  - [ ] Kill switch alert
- [ ] Real-time updates via WebSocket/SSE
- [ ] Form validation
- [ ] CSV export functionality
- [ ] Responsive design
- [ ] Dark/light mode (optional)
- [ ] i18n-ready structure

### Deliverables
- Complete Next.js dashboard
- All pages and components
- Real-time data updates
- Chart visualizations
- Form validations
- Export functionality

---

## Milestone 8: Safety & Risk Controls

**Goal**: Comprehensive safety systems and risk management.

### Tasks
- [ ] Global kill switch implementation
- [ ] Per-bot emergency stop
- [ ] Daily loss limit enforcement
- [ ] Max exposure limits (per bot and global)
- [ ] Max open orders limit
- [ ] Rate limiting enforcement
- [ ] Stale price protection
- [ ] Balance validation
- [ ] Duplicate order prevention
- [ ] Client order ID uniqueness
- [ ] Order size validation
- [ ] Price precision validation
- [ ] Minimum notional checks
- [ ] Fee-aware profit validation
- [ ] Maker-only enforcement
- [ ] Unknown order detection (reconciliation)
- [ ] Audit logging for all trading actions
- [ ] Confirmation dialogs for destructive actions
- [ ] Live trading gate (environment + DB + UI confirmation)

### Deliverables
- RiskControlService class
- KillSwitchService class
- AuditLogger class
- Validation utilities
- Tests for all safety checks

---

## Milestone 9: Testing Suite

**Goal**: Comprehensive test coverage for critical logic.

### Tasks
- [ ] Unit tests:
  - [ ] Grid math (arithmetic/geometric)
  - [ ] Precision rounding
  - [ ] Fee calculations
  - [ ] Minimum profit validation
  - [ ] PnL calculations
  - [ ] Balance checks
  - [ ] Client order ID generation
  - [ ] Candle fill logic
  - [ ] Partial fill handling
  - [ ] Range exit behavior
- [ ] Integration tests:
  - [ ] Markets parsing
  - [ ] Balances parsing
  - [ ] Fees parsing
  - [ ] Order creation request
  - [ ] Order cancellation
  - [ ] Open orders parsing
  - [ ] WebSocket subscribe format
  - [ ] REST fallback behavior
- [ ] Engine tests:
  - [ ] Buy fill creates sell order
  - [ ] Sell fill creates buy order
  - [ ] Partial fill handling
  - [ ] Stale price pause
  - [ ] Kill switch behavior
  - [ ] Dry-run never calls live endpoints
  - [ ] Live mode blocked without flags
- [ ] API tests:
  - [ ] Authentication flows
  - [ ] Bot CRUD operations
  - [ ] Bot control commands
  - [ ] Backtest execution
  - [ ] Risk setting updates
- [ ] Mocked Wallex API responses
- [ ] Test fixtures and factories

### Deliverables
- Jest/Vitest test suite
- Mock utilities
- Test fixtures
- Coverage reports (>80% critical paths)

---

## Milestone 10: Deployment & Documentation

**Goal**: Production-ready deployment and comprehensive documentation.

### Tasks
- [ ] Docker Compose finalization:
  - [ ] All services configured
  - [ ] Health checks working
  - [ ] Volume persistence
  - [ ] Network isolation
  - [ ] Environment variable handling
- [ ] Dockerfile optimization for each service
- [ ] Production environment guide
- [ ] VPS deployment instructions
- [ ] Reverse proxy setup (Caddy/Nginx)
- [ ] Database backup procedures
- [ ] Monitoring and logging setup
- [ ] Troubleshooting guide
- [ ] API documentation (OpenAPI/Swagger optional)
- [ ] User guide for dashboard
- [ ] Risk warning documentation
- [ ] Wallex API key setup guide
- [ ] Live trading enablement guide
- [ ] Backup and restore procedures

### Deliverables
- Production-ready Docker Compose
- Deployment guides
- User documentation
- Troubleshooting guide
- Backup procedures

---

## Milestone 11: Hardening & Polish

**Goal**: Final polish, edge case handling, and production hardening.

### Tasks
- [ ] Error boundary handling
- [ ] Graceful degradation
- [ ] Performance optimization
- [ ] Memory leak prevention
- [ ] Connection pool tuning
- [ ] Log rotation
- [ ] Alert thresholds configuration
- [ ] Edge case testing
- [ ] Load testing (optional)
- [ ] Security audit checklist
- [ ] Code review and refactoring
- [ ] Remove console.logs
- [ ] Add missing error messages
- [ ] Improve UX based on testing
- [ ] Final README review
- [ ] Changelog creation

### Deliverables
- Hardened production code
- Security checklist completed
- Performance optimized
- Final documentation

---

## Implementation Order

Execute milestones in this order for maximum efficiency:

1. **Milestone 1**: Database & Migrations (foundation for everything)
2. **Milestone 2**: Exchange Adapter (needed for live trading and market data)
3. **Milestone 3**: Grid Strategy Engine (core trading logic)
4. **Milestone 4**: Backtesting Engine (can run independently)
5. **Milestone 5**: API Server (backend for dashboard)
6. **Milestone 6**: Worker Process (runs bots and processes jobs)
7. **Milestone 7**: Web Dashboard (user interface)
8. **Milestone 8**: Safety & Risk Controls (integrated throughout)
9. **Milestone 9**: Testing Suite (parallel with development)
10. **Milestone 10**: Deployment & Documentation
11. **Milestone 11**: Hardening & Polish

---

## Definition of Done (Per Original Requirements)

The project is complete when:

- [x] All files in `/docs` have been read and understood
- [x] `docs/ASSUMPTIONS.md` exists and documents unclear items
- [x] The app starts with Docker Compose (full stack verified: postgres/redis healthy, api migrates+seeds on boot and passes healthcheck, worker picks up bot commands, web serves login; dry-run bot reached RUNNING with live-price grid orders, range-exit pause and clean STOP confirmed)
- [x] Admin can log in
- [x] User can add a Wallex exchange account in dry-run mode
- [x] Markets can be fetched and filtered to spot markets
- [x] User can create a grid bot config
- [x] Grid math is validated and fee-aware
- [x] Dry-run bot can start and simulate orders/fills
- [x] Dashboard shows realtime bot state, orders, fills, PnL, and logs
- [x] Bot can be paused/resumed/stopped
- [x] Cancel-all works
- [x] Kill switch works
- [x] Backtest can run using candle data
- [x] Backtest results are stored and displayed
- [x] Multiple backtests can be compared
- [x] Live trading is blocked unless explicitly enabled
- [x] Live order placement uses rate limiting and client order IDs
- [x] REST polling fallback works when WebSocket is unavailable
- [x] Tests pass for critical grid, order, fee, and backtest logic (grid math, fees/min-profit, paper-exchange fills, grid-engine lifecycle incl. partial fills + kill-switch + range exits, reconciliation orphan policy, API integration via fastify.inject)
- [x] README explains setup, risks, deployment, and live-trading warnings
- [x] No secrets are logged or exposed

---

## Current Status

**Completed** (verified against the remediation plan `.kilo/plans/1787574960799-jolly-eagle.md`):

- **Phase 0 — Foundation:** workspace builds to `dist/`, single init migration committed, seed runs, `.env.example` fixed, build artifacts untracked.
- **Phase 1 — API:** bcryptjs auth (login/register/me), JWT guards on all route groups, field-correct routes, BullMQ producers behind `lib/queue.ts`, SSE `/api/stream` (incl. `?token=` for EventSource), audit logging, kill-switch + reconciliation + markets/candle endpoints.
- **Phase 2 — Exchange adapter:** `WallexExchange` implements `ExchangePort` (paper + live), REST/WS client fixes, maker-fill paper exchange, `cancelAllOrders`, stale-price guard.
- **Phase 3 — Grid engine + worker:** `GridEngine` is the single exchange-agnostic state machine driven through `ExchangePort`; worker is a thin driver with Redis lock, reconciliation, pre-trade risk service, PnL snapshots, realtime publisher, market-data sync.
- **Phase 4 — Backtesting:** single `CandleBasedBacktester` drives `GridEngine` over ingested candles; metrics/equity/benchmark persisted; trades, CSV export, compare, and optimization endpoints live.
- **Phase 5 — Dashboard (this pass):** real login + auth guard, SSE-driven live updates, overview/bots/bot-detail/backtests (+detail+compare)/orders+fills/balances/exchange/settings/logs all wired to the API; lightweight-charts price + grid overlay; recharts equity curve; bot wizard with live grid preview + fee-aware warnings; kill-switch banner + toggle; CSV exports.

**Verified end-to-end (smoke test against live Wallex data):**

- Admin login → 401 without token, 200 with.
- Dry-run bot resume → STARTING → RUNNING; grid levels placed; a buy fill at live price; PnL + snapshots written; pause → PAUSED; stop → STOPPED with all orders cancelled.
- Backtest created → PENDING → auto-ingests candles → COMPLETED with metrics, equity curve, trades, warnings; second run produced 33 trades / 15 grid cycles / fee-aware PnL.
- Compare (2 runs), trades CSV export, kill-switch on/off (persisted + audited), live-trading gate rejects LIVE while `ENABLE_LIVE_TRADING=false`.

**Phase 6 — hardening (this pass):**

- Dashboard + SSE token-auth work merged from the `thrilling-bank` worktree into the main workspace; `next build` passes (all 15 routes incl. `/login`, bot detail, backtest detail/compare, logs).
- Test suite expanded from 11 → 87 tests, all green:
  - `@wallex/shared`: grid math (arithmetic/geometric generation, precision rounding, fee-aware profit validation, quantities, range/nearest-level helpers), AES-256-GCM encrypt/decrypt round-trip + tamper detection, client order id format/uniqueness.
  - `@wallex/exchange`: paper exchange — balance locking, maker fills at limit price, base/quote-denominated fees, min-notional + insufficient-balance rejection, duplicate clientOrderId idempotency, cancel-unlock, stop-market triggers, same-tick fill dedupe, balance snapshot round-trip.
  - `@wallex/grid-strategy`: grid engine lifecycle against a fake ExchangePort — initial placement below price, buy→sell pairing, sell→buy re-arm + realized PnL/cycles, partial fills with cumulative-event dedupe (no fee double counting), pre-trade kill-switch gate, max-open-orders, balance skips, STOP_CANCEL_ALL / PAUSE_KEEP_ORDERS range exits, stop-loss/take-profit, cancel-all.
  - worker: `diffOpenOrders` reconciliation policy (orphans never canceled; missing resolved via lookup).
  - `@wallex/api`: 15 `fastify.inject` integration tests against real Postgres/Redis — auth (register first user ADMIN, login, /me, 401s), dry-run account creation + key masking (no raw key in responses), bot CRUD incl. inverted-range rejection, LIVE gate (`ENABLE_LIVE_TRADING=false` blocks LIVE bots and `allowLiveTrading`), lifecycle transitions (START→STARTING, 409 on invalid), kill switch toggle + audit logs + force-KILL of running bots. Suite is hermetic (dedicated `wallex_grid_bot_test` DB, truncated in beforeAll) and self-skips when Postgres/Redis are unreachable.
- GridEngine bug fixes found via the new tests:
  - Partial fills: the buy order id was consumed on the first fill event, so subsequent partial-fill updates were dropped; fills now resolve through a placement index and stay `BUY_PARTIALLY_FILLED` until the order's full quantity is recorded.
  - Cumulative WS fill events previously double-counted fees; recorded qty is now skipped before fee/cost accumulation.
  - Sell fills decrement `openSellQuantity`; partial sells get `SELL_PARTIALLY_FILLED`.
- API refactored into a `buildApp()` factory (`src/app.ts`) consumed by both `index.ts` and the integration tests.
- Seed: fixed invalid 16-byte `ENCRYPTION_KEY` fallback (now valid 64-hex).
- Docker (verified end-to-end with `docker compose build && up`):
  - `.dockerignore` added (node_modules/dist/.next/.turbo/generated/.env excluded).
  - `ENCRYPTION_KEY` compose default is now a valid 64-hex dev key; `ADMIN_EMAIL`/`ADMIN_PASSWORD` passed to the api for seed-on-boot.
  - api CMD: `db:migrate && db:seed && node apps/api/dist/index.js` (node directly — turbo sanitizes env in containers); healthchecks on api (`:4000/health`) and worker (`:4001/health`); web/worker wait for `api: service_healthy`.
  - Dockerfile.worker rewritten (broken `COPY packages/*/package.json` flatten fixed; turbo graph build), Dockerfile.web fixed (`@wallex-grid/web` filter name, full workspace manifests, prisma schema for db:generate), all images copy `tsconfig.base.json` and install `libc6-compat`+`openssl` for the Prisma engines on musl.
  - Compose smoke test: admin login on the containerized API, dry-run bot START→RUNNING with 7 levels and 3 live-priced buy orders, grid range-exit pause at stale-range price, STOP→STOPPED with order cancellation.

**Remaining (optional polish):**

- Load testing, log rotation, alert thresholds.

**Note:** This sandbox has a transparent secret-scrubber that rewrites JWT-looking values in URL *query strings* (not headers) to `***` in transit. Header-based auth is unaffected; the SSE `?token=` path works in normal deployment but cannot be exercised end-to-end here.

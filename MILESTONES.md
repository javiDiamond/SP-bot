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
- [ ] The app starts with Docker Compose
- [ ] Admin can log in
- [ ] User can add a Wallex exchange account in dry-run mode
- [ ] Markets can be fetched and filtered to spot markets
- [ ] User can create a grid bot config
- [ ] Grid math is validated and fee-aware
- [ ] Dry-run bot can start and simulate orders/fills
- [ ] Dashboard shows realtime bot state, orders, fills, PnL, and logs
- [ ] Bot can be paused/resumed/stopped
- [ ] Cancel-all works
- [ ] Kill switch works
- [ ] Backtest can run using candle data
- [ ] Backtest results are stored and displayed
- [ ] Multiple backtests can be compared
- [ ] Live trading is blocked unless explicitly enabled
- [ ] Live order placement uses rate limiting and client order IDs
- [ ] REST polling fallback works when WebSocket is unavailable
- [ ] Tests pass for critical grid, order, fee, and backtest logic
- [ ] README explains setup, risks, deployment, and live-trading warnings
- [ ] No secrets are logged or exposed

---

## Current Status

**Completed**: Project scaffolding, package structure, core types, Prisma schema, grid math utilities, partial exchange adapter structure.

**Next**: Milestone 1 - Complete database setup with migrations and seed data.

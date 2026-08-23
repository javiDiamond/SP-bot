# Wallex Grid Bot

A complete, production-grade spot grid trading bot for Wallex Exchange with dashboard and backtesting capabilities.

## ⚠️ Risk Warning

**This software is for educational and research purposes only.**

- **Paper trading (dry-run) is enabled by default**
- **Live trading requires explicit opt-in and confirmation**
- **Cryptocurrency trading involves substantial risk of loss**
- **Past performance does not guarantee future results**
- **Never trade more than you can afford to lose**
- **Test thoroughly in dry-run mode before considering live trading**

By using this software, you acknowledge that:
- You are solely responsible for your trading decisions
- The developers are not liable for any financial losses
- You understand the risks involved in automated trading

## Features

### Trading Engine
- ✅ Multiple concurrent grid bots
- ✅ Multiple symbols support
- ✅ Arithmetic and geometric grid strategies
- ✅ Dry-run/paper trading (default)
- ✅ Live trading (explicitly gated)
- ✅ Maker-only order protection
- ✅ Partial fill handling
- ✅ Stale price protection
- ✅ Automatic reconciliation

### Risk Management
- ✅ Global kill switch
- ✅ Per-bot emergency stop
- ✅ Cancel-all orders button
- ✅ Pause/resume bots
- ✅ Daily loss limits
- ✅ Maximum exposure limits
- ✅ Rate limiting (20 orders/10s)
- ✅ Balance checks before orders
- ✅ Duplicate order prevention

### Dashboard
- ✅ Real-time bot monitoring
- ✅ Bot creation wizard with validation
- ✅ Grid visualization
- ✅ Order/fill history
- ✅ PnL tracking (realized & unrealized)
- ✅ Balance overview
- ✅ Market data display
- ✅ Risk controls configuration
- ✅ Audit logs
- ✅ WebSocket/REST health status

### Backtesting
- ✅ Candle-based simulation
- ✅ Optional trade/tick simulation (imported data)
- ✅ Parameter optimization
- ✅ Multiple backtest comparison
- ✅ Detailed metrics (ROI, Sharpe, drawdown, etc.)
- ✅ Equity curve visualization
- ✅ Trade-by-trade analysis
- ✅ CSV/JSON export

### Safety First
- ✅ Paper trading by default
- ✅ Live trading blocked unless explicitly enabled
- ✅ All ambiguous behaviors configurable
- ✅ Comprehensive logging (without secrets)
- ✅ API key encryption at rest
- ✅ Confirmation dialogs for destructive actions

## Technology Stack

- **Runtime**: Node.js 20 LTS
- **Language**: TypeScript (strict mode)
- **Monorepo**: pnpm workspaces + Turborepo
- **Backend API**: Fastify
- **Worker**: Node.js worker process
- **Database**: PostgreSQL + Prisma ORM
- **Queue/Cache**: Redis + BullMQ
- **Frontend**: Next.js App Router + React
- **UI**: Tailwind CSS + shadcn/ui
- **Charts**: lightweight-charts
- **Validation**: Zod
- **Decimal Math**: decimal.js
- **Logging**: Pino
- **Deployment**: Docker Compose

## Quick Start

### Prerequisites

- Node.js 20+ 
- pnpm 9+
- Docker & Docker Compose
- Git

### 1. Clone and Install

```bash
cd wallex-grid-bot
pnpm install
```

### 2. Setup Environment

```bash
cp .env.example .env
# Edit .env with your configuration
```

Generate secure keys:

```bash
openssl rand -base64 32  # For JWT_SECRET
openssl rand -hex 32     # For ENCRYPTION_KEY
```

### 3. Start Services

```bash
docker compose up -d
```

Wait for services to start, then run migrations:

```bash
pnpm db:migrate
pnpm db:seed
```

### 4. Access Dashboard

Open http://localhost:3000 in your browser.

Default admin credentials (change immediately):
- Email: `admin@example.com`
- Password: Check your `.env` file

## Project Structure

```
wallex-grid-bot/
├── apps/
│   ├── api/          # Backend REST API
│   ├── worker/       # Trading engine worker
│   └── web/          # Next.js dashboard
├── packages/
│   ├── shared/       # Shared types, utilities
│   ├── exchange/     # Wallex REST/WebSocket client
│   ├── grid-strategy/# Grid bot logic
│   ├── backtester/   # Backtesting engine
│   └── db/           # Prisma schema & client
├── docker/           # Docker configurations
├── docs/             # Documentation
├── scripts/          # Utility scripts
├── docker-compose.yml
├── .env.example
└── README.md
```

## Configuration

### Wallex API Key Setup

1. Login to [Wallex](https://wallex.ir/login)
2. Select the account you want to trade with
3. Go to [API Management](https://wallex.ir/app/my-account/api-management)
4. Create new API key with:
   - **Read access** (required)
   - **Trade access** (required for live trading)
   - **NO withdrawal access** (recommended for security)
5. Copy the API key and add it in the dashboard

### Enable Live Trading (⚠️ Advanced)

Live trading is **disabled by default**. To enable:

1. Set `ENABLE_LIVE_TRADING=true` in `.env`
2. Restart the application
3. Add exchange account in dashboard
4. Mark account as "live-enabled"
5. Create bot with mode = LIVE
6. Confirm all risk warnings

**Recommendation**: Test extensively in dry-run mode first!

## Usage Guide

### Creating a Grid Bot

1. Navigate to "Bots" → "Create Bot"
2. Configure:
   - Symbol (e.g., BTCUSDT)
   - Grid type (Arithmetic/Geometric)
   - Price range (lower/upper)
   - Grid count
   - Investment amount
   - Risk limits
3. Review grid preview and validation
4. Start bot (DRY_RUN by default)

### Monitoring Bots

The dashboard shows:
- Current bot status
- Active orders
- Recent fills
- Realized/unrealized PnL
- Grid levels on price chart
- Balance usage

### Backtesting

1. Go to "Backtests" → "New Backtest"
2. Configure:
   - Symbol and date range
   - Candle resolution
   - Grid parameters
   - Fee assumptions
3. Run backtest
4. Analyze results and compare strategies

### Risk Controls

Configure in "Settings" → "Risk":
- Daily loss limits
- Maximum exposure per bot
- Maximum concurrent bots
- Kill switch

## Deployment

### Docker Compose (Recommended)

```bash
docker compose up -d
```

Services:
- `postgres`: Database
- `redis`: Cache/queue
- `api`: REST API server
- `worker`: Trading engine
- `web`: Dashboard

### Production Notes

1. Use strong passwords and secrets
2. Enable HTTPS/TLS termination
3. Set `NODE_ENV=production`
4. Configure proper firewall rules
5. Regular database backups
6. Monitor logs and alerts
7. Keep system updated

### Backup Database

```bash
docker compose exec postgres pg_dump -U wallex wallex_grid_bot > backup.sql
```

### Restore Database

```bash
docker compose exec -T postgres psql -U wallex wallex_grid_bot < backup.sql
```

## Testing

```bash
# Run all tests
pnpm test

# Run specific package tests
pnpm --filter @wallex/grid-strategy test
pnpm --filter @wallex/exchange test
pnpm --filter @wallex/backtester test
```

## Troubleshooting

### Common Issues

**Cannot connect to database:**
- Ensure PostgreSQL container is running: `docker compose ps`
- Check DATABASE_URL in `.env`
- Verify port 5432 is available

**Redis connection failed:**
- Ensure Redis container is running
- Check REDIS_URL in `.env`

**No market data:**
- Check Wallex API connectivity
- Verify internet connection
- Check logs for rate limit errors

**Orders not placing:**
- Ensure sufficient balance
- Check price/quantity precision
- Verify rate limiter status
- Review logs for errors

### Viewing Logs

```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f worker
docker compose logs -f api
```

## API Documentation

See `/docs` directory for Wallex API documentation.

Key endpoints used:
- `GET /hector/web/v1/markets` - Market list
- `GET /v1/udf/history` - Candle data
- `GET /v1/depth` - Order book
- `GET /v1/account/balances` - Balances
- `GET /v1/account/fee` - Fees
- `POST /v1/account/orders` - Create order
- `DELETE /v1/account/orders/{client_id}` - Cancel order
- `GET /v1/account/openOrders` - Open orders

WebSocket channels:
- `MARKET@buyDepth` - Buy depth
- `MARKET@sellDepth` - Sell depth
- `MARKET@trade` - Recent trades
- `all@price` - All prices

## Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create feature branch
3. Make changes
4. Add tests
5. Submit PR

## License

MIT License - See LICENSE file for details.

## Support

For issues and questions:
- Check documentation in `/docs`
- Review `docs/ASSUMPTIONS.md` for API ambiguities
- Open GitHub issue

---

**Remember**: Always test in dry-run mode first. Never risk funds you cannot afford to lose.
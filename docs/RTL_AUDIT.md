# RTL Audit Report

Every file/component audited and adjusted for correct right-to-left rendering in the Persian
(`fa`) locale, plus the conventions applied globally. Paired document:
`docs/ASSUMPTIONS.md` (decisions & tradeoffs) and `docs/PERSIAN_GLOSSARY.md` (terminology).

## Global conventions

### Direction model

- `<html lang dir>` is set **server-side** in `src/app/[locale]/layout.tsx` from the resolved
  locale (`en → ltr`, `fa → rtl`), so the very first paint has the correct direction — no
  flash-of-wrong-direction.
- During client-side locale transitions, `src/app/[locale]/providers.tsx`
  (`FormatContextSync`) re-applies `lang`/`dir` synchronously after hydration as a
  belt-and-braces measure.
- Locale switching uses `router.replace(pathname + search, { locale })` — a Next.js route
  transition, **not** a full page reload. Route, query params and react-query cache survive
  the switch.

### Button-order convention (modals & confirmation dialogs)

**Convention: the primary/confirm action is always the LAST child of the action row
(trailing/"end" side); Cancel always precedes it.**

The action row uses plain `flex justify-end`, and flexbox rows mirror automatically under
`dir="rtl"`. Result:

- LTR: `[ Cancel ] [ Confirm ]` aligned to the right edge.
- RTL: `[ انصراف ] [ تأیید ]` aligned to the left edge.

The **meaning-to-position mapping is identical** in both locales (confirm is always at the
reading-order end), positions are mirrored, never reordered — an operator switching languages
cannot misclick because a destructive button swapped sides relative to its meaning. Implemented
once in `Modal`/`ConfirmModal` (`src/components/ui.tsx`) and inherited by every dialog,
including the kill-switch confirmation and bot stop / cancel-all confirmations.

### Layout utilities

All direction-sensitive Tailwind utilities use **logical properties**:

| Physical (forbidden) | Logical (used) |
| --- | --- |
| `ml-*` / `mr-*` | `ms-*` / `me-*` (or symmetric `gap-*`) |
| `pl-*` / `pr-*` | `ps-*` / `pe-*` |
| `left-*` / `right-*` (layout) | `start-*` / `end-*` |
| `text-left` / `text-right` | `text-start` / `text-end` |
| `border-l` / `border-r` | `border-s` / `border-e` |

An automated check keeps it that way: any physical-direction class must be explicitly
allow-listed (see "Remaining physical classes" below). No `flex-row-reverse` hacks exist.

### Number inputs inside RTL forms

Per the product rule, **numeric/decimal inputs stay LTR** (`dir="ltr"`) inside RTL forms to
prevent trading-input errors. Text inputs for names/labels follow the ambient form direction.

## Files audited / changed for RTL

### Infrastructure

| File | Change |
| --- | --- |
| `src/app/[locale]/layout.tsx` | Server-side `lang`+`dir` on `<html>`; Vazirmatn (fa) + Inter/JetBrains Mono CSS vars registered |
| `src/app/[locale]/providers.tsx` | `FormatContextSync` keeps `<html lang|dir>` and the `Intl` formatting context in sync on locale switch and preference changes |
| `src/middleware.ts` + `src/i18n/routing.ts` | Locale-prefixed routing, `NEXT_LOCALE` cookie, `/` → `/<locale>/dashboard` redirect |
| `src/i18n/navigation.ts` | Locale-aware `Link`/`useRouter`/`usePathname` so internal navigation preserves the locale prefix |
| `src/styles/globals.css` | `.select` chevron moved to inline-end via `[dir='rtl'] .select { background-position: left ... }`; `pe-8` padding; Vazirmatn applied only under `html[lang=fa] body`; `letter-spacing: 0` for `.label`, `.card-title`, `.page-title`, `thead th` under `html[lang=fa]` (Arabic script must not be tracked/uppercased) |
| `src/lib/format.ts` | All `Intl.NumberFormat`/`Intl.DateTimeFormat` output forces `nu-latn` for financial figures; Persian digits only for decorative `fmtCount` when the user opts in |

### Shell & navigation

| File | Change |
| --- | --- |
| `src/app/[locale]/dashboard/layout.tsx` | Sidebar uses `border-e`; active-item inset indicator mirrors via `shadow-[inset_2px_...] rtl:shadow-[inset_-2px_...]`; header actions use `gap-*` flex (auto-mirror); user email forced `dir="ltr"`; sidebar icons are direction-neutral glyphs |
| `src/components/LanguageSwitcher.tsx` | Dropdown anchored `end-0` (mirrors correctly); each option carries its own `lang`/`dir`; labels taken from messages (`فارسی` written in Persian script) |
| `src/components/ui.tsx` | `Modal`/`ConfirmModal` action-row convention (above); `PageHeader`, `CardHeader`, banners and badges use logical flex flow; inline SVG icons audited for directionality (below) |

### Pages

| File | RTL-relevant changes |
| --- | --- |
| `src/app/[locale]/login/page.tsx` | Email/password inputs `dir="ltr"` + `text-start`; switcher available pre-auth (top `end-4` corner); error banner flex flow |
| `src/app/[locale]/dashboard/page.tsx` (Overview) | Stat cards, tables, banners via shared logical components |
| `src/app/[locale]/dashboard/bots/page.tsx` | Table columns flow in reading order; no per-column reordering |
| `src/app/[locale]/dashboard/bots/new/page.tsx` | All 7 numeric inputs (price, percent, amount) `dir="ltr"`; market picker, range preview; wizard step buttons via logical flex |
| `src/app/[locale]/dashboard/bots/[id]/page.tsx` | Tabs, badges, action buttons; numeric cells `.num` + LTR figures |
| `src/app/[locale]/dashboard/backtests/page.tsx` | 8 numeric/date inputs `dir="ltr"` |
| `src/app/[locale]/dashboard/backtests/[id]/page.tsx` + `compare/page.tsx` | Metric grids and tables via logical flow |
| `src/app/[locale]/dashboard/balances/page.tsx` | Balance figures always Latin digits |
| `src/app/[locale]/dashboard/orders/page.tsx` | Orders/fills tables; numeric cells LTR |
| `src/app/[locale]/dashboard/exchange/page.tsx` | API-key literals + test-connection output forced `dir="ltr"`; form fields logical |
| `src/app/[locale]/dashboard/logs/page.tsx` | Raw JSON payload panels `dir="ltr"` (developer data stays LTR English); filters logical |
| `src/app/[locale]/dashboard/settings/page.tsx` | 4 risk-limit numeric inputs `dir="ltr"`; env-flag literal `ENABLE_LIVE_TRADING=…` `dir="ltr"`; kill-switch confirm dialog follows modal convention |
| `src/app/[locale]/page.tsx` | Locale-root redirect keeps token behavior |

### Charts

| File | Change |
| --- | --- |
| `src/components/PriceChart.tsx` | Canvas wrapper `dir="ltr"` — lightweight-charts does not support mirrored rendering; time axis stays conventional LTR, surrounding titles/labels are RTL |
| `src/components/EquityChart.tsx` | Recharts wrapper `dir="ltr"` for the same reason |

Grid-level price lines and the price axis are untouched by direction — switching locale cannot
change which price level a grid line represents.

## Icon mirroring policy

**Mirrored (direction-implying):** handled structurally, not by flipping icons —

- "Next/previous" step navigation order comes from DOM/flex order, which mirrors via `dir`.
- Sidebar expand/active indicator (`rtl:shadow-[inset_-2px...]`).
- Dropdown/select alignment (`end-0`, chevron side via `[dir='rtl'] .select`).

**NOT mirrored (universal / real-world meaning):**

- Price trend arrows and chart candles (up/down reflect real market direction).
- Checkmarks, warning triangles, info/exclamation circles.
- Play/pause/stop glyphs.
- Bot status dots, sparkline/stat icons (`toneIcon` set in `ui.tsx`).
- The swap/exchange arrows icon in the sidebar (represents exchange, not a reading direction).
- Brand glyph (`BrandMark`) — direction-neutral, never mirrored.

## Remaining physical classes (allow-list)

Only one physical class survives the audit, and it is direction-independent by construction:

| File | Class | Reason |
| --- | --- | --- |
| `src/app/[locale]/login/page.tsx:56` | `absolute left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2` | Centered decorative background blob — `left:50%` + `translateX(-50%)` is symmetric in both directions |

Any future addition of `ml-`, `mr-`, `pl-`, `pr-`, `left-*`, `right-*`, `text-left`,
`text-right`, or `float-left/right` for layout purposes fails the hardcoded-styles check
(`pnpm --filter @wallex-grid/web check:i18n`).

## Automated coverage

- `apps/web/e2e/locale.spec.ts` — runtime locale-switch test: opens `/en/login`, switches to
  Persian via the switcher, asserts URL prefix, `<html lang|dir>` flip, cookie persistence,
  zero new console errors, and that the same route is preserved.
- `apps/web/e2e/visual.spec.ts` — screenshot snapshots for login, overview, bots list, bot
  detail, create-bot wizard steps, backtest detail, and the kill-switch confirmation modal,
  captured in **both** `en` and `fa` at desktop/tablet/mobile widths (Playwright
  `toHaveScreenshot` baselines committed under `apps/web/e2e/__screenshots__`).

## Manual QA checklist

Pages not trivially covered by automated snapshots — walk these in **both** locales at
375 / 768 / 1280 px:

- [ ] Overview: stat cards wrap without overlap; PnL signs/colors unchanged by locale.
- [ ] Bots list: status badges and mode badges not clipped by longer Persian labels; action
      menu alignment.
- [ ] Bot detail: tabs order mirrors; grid-level table price column figures remain LTR;
      chart canvas not flipped; grid lines still at correct prices.
- [ ] Create bot wizard: every step — labels right-aligned, numeric fields LTR, live-trading
      warnings fully visible (not truncated), preview panel not overflowing.
- [ ] Backtests: date/numeric inputs LTR inside RTL form; results metric grid legible.
- [ ] Backtest compare: side-by-side metric table columns aligned.
- [ ] Balances: all figures Latin digits even with `digitStyle=persian` selected.
- [ ] Orders/fills: side badges (خرید/فروش) keep up/down colors; tables scroll correctly RTL.
- [ ] Exchange accounts: masked API keys render LTR; test-connection output LTR.
- [ ] Logs: level badges translated; raw JSON payload stays LTR English; autoscroll sane.
- [ ] Settings: kill-switch banner + confirm dialog fully readable; `ENABLE_LIVE_TRADING`
      literal LTR; destructive confirm button positions mirror (not swap meaning).
- [ ] Login: error banner, security note, switcher reachable pre-auth.
- [ ] Toasts/banners: kill-switch banner centered and readable in both locales.
- [ ] Dark & light theme for all of the above in both locales.
- [ ] Persian digit preference: decorative page counters switch, financial figures never do.
- [ ] Screen reader: `lang` changes announced correctly; focus order follows visual RTL flow.

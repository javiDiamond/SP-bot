# Persian Translation Glossary (فارسی)

Canonical terminology reference for the Wallex Grid Bot dashboard. This glossary is the
**single source of truth**: the same English concept must always map to the same Persian term
in `apps/web/messages/fa.json`, in code comments that quote UI copy, and in any future
translation work. If a better term is found, update this file **and** every occurrence in
`fa.json` in the same change.

Tone: formal and professional, appropriate for a financial trading tool. Persian text uses
half-space (نیم‌فاصله / ZWNJ) correctly for plurals and compound words (e.g. ربات‌ها, سفارش‌ها,
محقق‌شده).

## Core trading terminology

| English | Persian | Notes |
| --- | --- | --- |
| Grid (bot strategy) | گرید | Transliterated; never translated as شبکه in this product |
| Grid level | سطح گرید | e.g. `تب سطوح گرید` |
| Grid cycle | چرخه گرید | |
| Grid count | تعداد گرید | |
| Grid profit | سود گرید | |
| Bot | ربات | Never بات |
| Order | سفارش | |
| Open order | سفارش باز | |
| Fill / Trade | اجرا | Plural: اجراها; never پر شده |
| Partially filled | اجرای جزئی | |
| Filled | اجراشده | |
| Buy / Sell | خرید / فروش | |
| Balance | موجودی | Plural: موجودی‌ها |
| Investment | سرمایه | |
| Fee | کارمزد | |
| Maker fee / Taker fee | کارمزد میکر / کارمزد تیکر | Transliterated exchange terms |
| PnL (profit and loss) | سود و زیان | |
| Realized (PnL/profit) | محقق‌شده | |
| Unrealized (PnL/profit) | محقق‌نشده | |
| Backtest | بک‌تست | Plural: بک‌تست‌ها; never آزمون گذشته |
| Range (price range) | محدوده / بازه | محدوده for grid range bounds; بازه for time range |
| Range exited | خارج از محدوده | Bot status `RANGE_EXITED` |
| Recenter (grid on price) | بازتنظیم مرکز گرید روی قیمت | |
| Trailing (range follows price) | دنبال‌کننده (جابه‌جایی محدوده) | |
| Pause / Stop | توقف موقت / توقف کامل | |
| Resume | ازسرگیری | |
| Start | شروع / راه‌اندازی | |

## Bot modes and safety controls

| English | Persian | Notes |
| --- | --- | --- |
| Live trading | معاملات واقعی | |
| Dry-run / paper trading | معاملات آزمایشی | Optional parenthetical: (شبیه‌سازی) |
| Kill switch | کلید توقف اضطراری | Never shortened; safety-critical term |
| Kill switch active (badge) | توقف اضطراری | Compact badge form |
| Cancel all | لغو همه | Same wording everywhere |
| Risk | ریسک | |
| Risk settings / limits | تنظیمات ریسک | |
| Exposure | میزان مواجهه با ریسک (اکسپوژر) | Full phrase in settings copy |
| Slippage | لغزش قیمت | |
| Warning | هشدار | Log level `WARN` |
| Error | خطا | Log level `ERROR` |
| Info | اطلاع | Log level `INFO` |
| Debug | اشکال‌زدایی | Log level `DEBUG` |

## Bot/order statuses (enum labels)

| English | Persian |
| --- | --- |
| DRAFT | پیش‌نویس |
| STARTING | در حال شروع |
| RUNNING | در حال اجرا |
| PAUSING | در حال توقف موقت |
| PAUSED | متوقف موقت |
| STOPPING | در حال توقف |
| STOPPED | متوقف |
| ERROR | خطا |
| RANGE_EXITED | خارج از محدوده |
| KILLED | توقف اضطراری |
| Pending / New / Partially filled / Filled / Canceled | در انتظار / ثبت‌شده / اجرای جزئی / اجراشده / لغوشده |

## Navigation and app areas

| English | Persian |
| --- | --- |
| Overview | نمای کلی |
| Bots | ربات‌ها |
| Backtests | بک‌تست‌ها |
| Orders & fills | سفارش‌ها و اجراها |
| Exchange / Exchange accounts | صرافی / حساب صرافی |
| Balances | موجودی‌ها |
| Logs / Events | گزارش‌ها |
| Settings | تنظیمات |
| Sign out | خروج از حساب |

## Common actions

| English | Persian | Notes |
| --- | --- | --- |
| Cancel (dialog/dismiss) | انصراف | Single translation everywhere — never لغو for the dismiss action |
| Confirm / Approve | تأیید | With hamza (تأیید), consistently |
| Delete | حذف | |
| Edit | ویرایش | |
| Save | ذخیره | Saving…: در حال ذخیره… |
| Next / Previous | بعدی / قبلی | Wizard steps |
| View all | مشاهده همه | |
| Working… | در حال انجام… | Busy-state label |

## Grid types and configuration

| English | Persian |
| --- | --- |
| Arithmetic (equal spacing) | حسابی (فاصله برابر) |
| Geometric (equal percent) | هندسی (درصد برابر) |
| Lower/upper bound | کران پایین / کران بالا |
| Spacing | فاصله‌گذاری |
| Per-grid investment | سرمایه هر گرید |

## Deliberately NOT translated

These stay in their original form in both locales (see `docs/ASSUMPTIONS.md`):

- Ticker symbols and currency codes: `USDT`, `BTC`, `BTCUSDT`, `IRR`, `TMN`.
- Environment/technical literals: `ENABLE_LIVE_TRADING=true`, API key header names.
- Wallex brand name: `Wallex`.
- Log/audit/event raw fields and developer-facing JSON (English by design).
- Numeric figures: always Western (Latin) digits for financial values.

## Formatting conventions

- Plurals use ICU `{count, plural, ...}` with CLDR Persian categories (`one`, `other`);
  Persian has no `few`/`many` categories.
- Ellipsis is a single Persian three-dot character: `…` (در حال ذخیره…).
- Percent signs and punctuation follow the surrounding Persian text direction; financial
  numbers remain LTR inside RTL sentences via the `.num` utility.

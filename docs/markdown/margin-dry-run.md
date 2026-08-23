---
title: "اطلاعات کامل موقعیت قبل باز شدن"
source: https://developers.wallex.ir/docs/margin-dry-run
---

# اطلاعات کامل موقعیت قبل باز شدن

## مشاهده اطلاعات موقعیت مارجین قبل از ایجاد

این API به شما امکان می‌دهد اطلاعات و جزئیات یک موقعیت تعهدی را قبل از ایجاد آن مشاهده کنید.

```curl
POST /margin-trade/v1/public/dry-run
```

## توضیحات Request-Body

برای فراخوانی این API باید اطلاعات زیر را به‌صورت JSON در Request-Body ارسال کنید:

| Parameter | Example | Data Type | Required | Valid Values | Definition |
| --- | --- | --- | --- | --- | --- |
| collateral | "300000" | String | true | — | میزان وثیقه درخواستی برای ایجاد موقعیت تعهدی |
| market | "BTCUSDT" | String | true | — | مارکتی که قصد دارید در آن موقعیت تعهدی ایجاد کنید |
| open\_price | "8900000" | String | true | — | قیمتی که در آن پوزیشن معامله تعهدی ایجاد می‌شود |
| risk\_coef | "10" | String | true | — | نسبت اعتباری که قصد دارید دریافت کنید |
| side | long | String | true | long | short | \- |
| stop\_loss | "86000" | String | false | — | میزان حد ضرر برای بستن موقعیت تعهدی |
| take\_profit | "86000" | String | false | — | میزان حد سود برای بستن موقعیت تعهدی |

## توضیحات Response-Body

```json
{
  "call_price": "قیمت حد هشدار",
  "collateral": {
    "currency": "ارز",
    "value": " ارزش وثیقه"
  },
  "extend_fee": {
    "currency": "ارز ",
    "value": "ارزش کارمزد تمدید"
  },
  "extend_time": "مدت زمان تمدید",
  "liquidity_price": "قیمت لیکوییدیتی",
  "loan": {
    "currency": "ارز",
    "value": " ارزش وام"
  },
  "market": "بازار",
  "max_age": "ماکزیمم عمر موقعیت",
  "open_fee": {
    "currency": "ارز",
    "value": "ارزش کارمزد بازکردن"
  },
  "open_price": "قیمت باز کردن",
  "risk_coef": "نسبت اعتبار",
  "side": "لانگ/ شورت",
  "stop_loss": "حد ضرر",
  "take_profit": "حد سود",
  "trade_fee": {
    "currency": "ارز",
    "value": "ارزش کارمزد معامله"
  },
  "success": "موفقیت آمیز بودن درخواست"
}
```
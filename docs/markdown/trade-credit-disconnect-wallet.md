---
title: "قطع اتصال کیف پول اصلی از اکانت اعتبار معاملاتی"
source: https://developers.wallex.ir/docs/trade-credit-disconnect-wallet
---

# قطع اتصال کیف پول اصلی از اکانت اعتبار معاملاتی

برای قطع اتصال کردن کیف پول اصلی از اکانت اعتبار معاملاتی میتوانید از API زیر استفاده کنید.  
به یاد داشته باشید که به منظور این کار باید id اکانت اعتبار معاملاتی خود را که در [زمان ساخت](trade-credit-activate-sub-account.md) دریافت کردید را در Request-Header ارسال کنید

```curl
DELETE /v1/prop/user/packages/connect-to-wallet
```

## توضیحات Request-Header

| Parameter | Example | Data Type | Required | Definition |
| --- | --- | --- | --- | --- |
| sub\_account\_client\_id | "test-123" | String | true | id اکانت اعتبار معاملاتی |

## توضیحات Response-Body

```json
{
  "result": "[]",
  "message": "قطع اتصال کیف پول با موفقیت انجام شد",
  "success": "موفقیت آمیز بودن درخواست"
}
```
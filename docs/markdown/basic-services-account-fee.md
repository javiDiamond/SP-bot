---
title: "کارمزد حساب کاربری"
source: https://developers.wallex.ir/docs/basic-services-account-fee
---

# کارمزد حساب کاربری

## سطح کاربری و کارمزد

جهت دریافت سطح کاربری و کارمزد اکانت خود ، میتوانید از API زیر استفاده کنید.

```curl
GET /v1/account/fee
```

## توضیحات Response-Body

```json
{
  "result": {
    "SHIBTMN": {
      "makerFeeRate": "ضریب کارمزد میکر",
      "takerFeeRate": "ضریب کارمزد تیکر",
      "recent_days_sum": "حجم معاملاتی"
    }
  }
}
```
====================================
FILE: index.md
SOURCE: https://developers.wallex.ir/docs/
====================================

---
title: "پیش‌گفتار"
source: https://developers.wallex.ir/docs/
---

# پیش‌گفتار

# مقدمه

والکس به عنوان یکی از پیشروترین پلتفرم‌های مبادله ارزهای دیجیتال در ایران، خدمات متنوعی مانند معاملات اسپات (Spot)، معاملات تعهدی (Margin)، اعتبار معاملاتی و سایر ابزارهای مالی را در اختیار کاربران حرفه‌ای و توسعه‌دهندگان قرار می‌دهد.

در این مستند، قصد داریم به‌صورت جامع به نحوه استفاده از APIهای عمومی و خصوصی والکس بپردازیم. این APIها به شما امکان می‌دهند تا به بازارها متصل شوید، قیمت‌ها و عمق بازار را مشاهده کنید، سفارش‌گذاری انجام دهید، دارایی‌ها را مدیریت کنید و بسیاری قابلیت‌های دیگر را به‌صورت برنامه‌نویسی‌شده در اختیار داشته باشید.

این مستند برای توسعه‌دهندگان، تریدرها و تیم‌های فنی طراحی شده که قصد دارند به‌صورت مستقیم و اتوماتیک با زیرساخت معاملاتی والکس تعامل داشته باشند.

در ادامه با ساختار کلی APIها، نحوه احراز هویت، ساختار Request-Body و Response-Body، لیست APIها و مثال‌های کاربردی آشنا خواهید شد.

## پیش نیاز ها

-   تمامی APIها تنها از طریق دامنه رسمی [https://api.wallex.ir](https://api.wallex.ir) در دسترس هستند.
-   تمامی Response-Body ها در قالب استاندارد JSON ارائه می‌شود.
-   APIهایی که به اطلاعات شخصی کاربران دسترسی دارند یا امکان انجام تراکنش را فراهم می‌کنند، با استفاده از کلیدهای API و مکانیسم‌های امنیتی محافظت شده‌اند.

## انواع داده های مورد استفاده

| Example | Definition | Data Type |
| --- | --- | --- |
| 28.4 | عدد اعشاری یا صحیح | number |
| "13.78" | عددی که به صورت رشته ارسال میشود | number string |
| "BTC" | رشته متنی | string |
| "2024-05-01T12:34:56Z" | تاریخ و زمان در قالب استاندارد ISO-8601 | datetime |
| 1714563456 | زمان یونیکس (ثانیه از 1970) | timestamp |
| true / false | مقادیر بولین | boolean |

## شیوه ارسال درخواست

-   دقت داشته باشید که Request-Body باید به‌صورت JSON ارسال شود
-   در تمامی درخواست ها Content-Type:application/json باید در Request-Header قرار بگیرد.


====================================
FILE: create-api-key.md
SOURCE: https://developers.wallex.ir/docs/create-api-key
====================================

---
title: "ساخت API-Key"
source: https://developers.wallex.ir/docs/create-api-key
---

# ساخت API-Key

جهت ساخت API-Key برای فراخوانی API ، طبق راهنمای زیر اقدام کنید:

-   به [صفحه لاگین والکس](https://wallex.ir/login) مراجعه کنید و اقدام به لاگین کنید.
-   جهت ساخت API-Key ابتدا باید مشخص کنید که با چه اکانتی قصد ساخت API-Key را دارید. به منظور این کار نشانگر ماوس خود را به روی گزینه اکانت ببرید و اکانت خود را انتخاب کنید

![step-1](../assets/1-4f6bb8a9886ee0ff55a131bff6b74ddf.png)

-   توجه داشته باشید به منظور انجام معامله با اکانت اعتبار معاملاتی خود باید از API-Key مختص آن اکانت استفاده کنید و برای معامله با اکانت اصلی خود باید از API-Key اکانت اصلی خود استفاده کنید
-   به صفحه [ساخت API-Key](https://wallex.ir/app/my-account/api-management) مراجعه کنید.
-   مطابق تصویر زیر، روی گزینه ساخت API کلیک کنید.

![step-2](../assets/2-c3907a3125922048f4b66e46c72d13a5.png)

-   سپس تمامی موارد خواسته شده در فیلدها را پر کنید:
    
-   نام API: نام اختیاری برای API-Key.
    
-   فعال تا : توجه داشته باشید که API-Key ساخته شده فقط تا مدت زمانی که انتخاب میکنید فعال میباشد.
    
-   دسترسی ها به‌صورت زیر میباشد:
    
    -   دسترسی خواندن : به‌صورت پیشفرض برای فراخوانی API این دسترسی داده شده است.
    -   دسترسی معامله : با فعال کردن این مورد میتوانید در بازارهای معاملاتی ترید انجام دهید.
    -   دسترسی برداشت : با فعال‌سازی این گزینه، امکان ثبت درخواست‌های برداشت مالی برای شما فراهم می‌شود. لطفاً توجه داشته باشید که برای استفاده از API برداشت، آدرس IP مورد استفاده باید با آدرسی که در قسمت IP وارد کرده‌اید، مطابقت داشته باشد.
-   پس از پر کردن تمامی موارد میتوانید بر روی گزینه ساخت API-Key کلیک کنید.
    

![step-3](../assets/3-00352c2a8b1fb24238e1bce8f1ef51de.png)

-   پس از آن باید کد دریافتی را وارد کنید تا API-Key برای شما ساخته شود.

![step-4](../assets/4-eb57fb91a5f9e9ff2149a172e17fc370.png)

-   بعد از تایید کد به صفحه API-Key منتقل میشوید. لطفا به یاد داشته باشید که API-Key صرفا یکبار در این صفحه نمایش داده میشود.

![step-5](../assets/5-090e764e1d46c4641f26abbb854466a8.png)

## نکات مهم

-   به تاریخ منقضی شدن API-Key خود توجه کنید تا استراتژی های معاملاتی شما با اختلال مواجه نشود
-   برای حفظ امنیت حساب کاربری خود، در نگهداری و محافظت از API-Key دقت لازم را داشته باشید.
-   از آنجایی که در والکس امکان دریافت اعتبار معاملاتی ، و ساخت اکانت اعتبار معاملاتی وجود دارد ، توجه داشته باشید که API-Key هر اکانت مختص به خودش هست. اکانت اصلی شما API-Key مختص خود را باید داشته باشد و همچنین هر کدام از اکانت های اعتبار معاملاتی نیز API-Key مختص خود را دارند
-   توجه داشته باشید ،حداکثر میتوانید سه عدد API-Key بسازید.


====================================
FILE: basic-services.md
SOURCE: https://developers.wallex.ir/docs/basic-services
====================================

---
title: "مقدمه"
source: https://developers.wallex.ir/docs/basic-services
---

# مقدمه

## سرویس های پایه والکس

برای انجام معامله در بازار های معاملاتی مختلف ، نیاز به سرویس های مختلف از جمله دریافت موجودی کیف پول ، مشاهده کندل ها و ... دارید. ما در ادامه این داکیومنت به آموزش این سرویس ها میپردازیم.

## دانلود Swagger سرویس های پایه

تمامی API هایی که نحوه ارسال درخواست به آن ها در ادامه گفته میشود را میتوانید از طریق لینک زیر دریافت کنید:

[دانلود Swagger سرویس های پایه](/assets/files/basic-services-89626420b5f06e4d7a2dc9206cdeb192.json)


====================================
FILE: basic-services-main-wallet.md
SOURCE: https://developers.wallex.ir/docs/basic-services-main-wallet
====================================

---
title: "کیف‌پول حساب اصلی"
source: https://developers.wallex.ir/docs/basic-services-main-wallet
---

# کیف‌پول حساب اصلی

## دریافت موجودی کیف پول حساب اصلی

شما می‌توانید با استفاده از API زیر، موجودی کیف پول اصلی خود را دریافت کنید.  
توجه داشته باشید کیف پول حساب اصلی مجزا از اکانت‌های اعتبار معاملاتی می‌باشد که در قسمت  
[دریافت کیف پول حساب اعتبار معاملاتی](index.md) آموزش داده شده است.

```curl
GET "/v1/account/balances"
```

## توضیحات Response Body

توجه داشته باشید تمامی رمز ارزهای موجود در والکس در مسیر  
`result.balances` نمایش داده می‌شوند.

هر آبجکت دارای یک کلید است که نام آن، نام رمز ارز می‌باشد.

```json
{
  "result": {
    "balances": {
      "1BBABYDOGE": {
        "asset": "نام نماد",
        "asset_png_icon": "-",
        "asset_svg_icon": "-",
        "faName": "نام فارسی نماد",
        "fiat": "-",
        "value": "مقدار دارایی موجودی در حساب اصلی",
        "locked": "مقدار دارایی فریز شده (در هنگام برداشت یا انجام معامله)",
        "is_dust": "وضعیت خرد بودن دارایی",
        "is_digital_gold": "وضعیت طلای دیجیتال بودن نماد"
      }
    }
  },
  "message": "عملیات با موفقیت انجام شد",
  "success": true
}
```


====================================
FILE: basic-services-candles.md
SOURCE: https://developers.wallex.ir/docs/basic-services-candles
====================================

---
title: "کندل‌ها"
source: https://developers.wallex.ir/docs/basic-services-candles
---

# کندل‌ها

## کندل ها (آمار OHLC بازارها)

شما میتوانید اطلاعات کامل کندل بازارهای والکس را با استفاده از API زیر مشاهده کنید. شما میتوانید نتیجه این API را براساس موارد مد نظر خود ، فیلتر کنید. توجه داشته باشید که تمامی فیلترها باید به عنوان Query-parameters ارسال شود.

```curl
GET /v1/udf/history
```

## توضیحات Query-parameters

برای فراخوانی این API میتوانید پارارمترهای مختلف خود را به عنوان Query-parameters در مسیر API ارسال کنید :

| Parameter | Example | Data Type | Required / Optional | Valid Values | Definition |
| --- | --- | --- | --- | --- | --- |
| symbol | "BTCUSDT" | String | Optional | — | نام نماد و پایه بازاری که قصد دارید در آن معامله صورت بگیرد. |
| resolution | 15 | String | Optional | 1, 15, 60, 240, 480, 720, 1D, 2D, 3D | پارامتر resolution تعیین می‌کند که هر کندل (Candle) در داده‌های نموداری چه بازه زمانی‌ای را پوشش دهد. به‌عبارتی مشخص می‌کند که Response-Body در چه فاصله‌های زمانی دسته‌بندی شده‌اند. به عنوان مثال، اگر مقدار resolution برابر با 60 باشد، به این معناست که هر کندل مربوط به یک ساعت از معاملات است. |
| from | "1733425200" | timestamp | Optional | — | شروع بازه زمانی |
| to | "1733428800" | timestamp | Optional | — | پایان بازه زمانی |

## توضیحات Response-Body

دقت داشته باشید هر کدام از موارد مربوط در Response-Body یک Array میباشد. در هر آبجکت که از یک Array تشکیل شده است.

```json
{
  "s": "وضعیت موفقیت آمیز بودن درخواست",
  "t": [
    "تایم استمپ براساس بازه های رزولوشن در بازه زمانی تعریف شده"
  ],
  "c": [
    "آخرین قیمت کندل ها"
  ],
  "o": [
    "اولین قیمت کندل ها"
  ],
  "h": [
    "بالاترین قیمت کندل‌ها"
  ],
  "l": [
    "پایین ترین قیمت کندل‌ها"
  ],
  "v": [
    "حجم معاملات کندل‌ها"
  ]
}
```


====================================
FILE: basic-services-markets.md
SOURCE: https://developers.wallex.ir/docs/basic-services-markets
====================================

---
title: "مارکت‌ها"
source: https://developers.wallex.ir/docs/basic-services-markets
---

# مارکت‌ها

## مارکت های والکس

با استفاده از API زیر میتوانید لیست کاملی از مارکت های فعال در والکس را دریافت کنید. همچنین در هر نوع معامله ی والکس نحوه ی دریافت مارکت های فعال در آن معامله به طور کامل آموزش داده شده است.

```curl
GET /hector/web/v1/markets
```

## توضیحات Response-Body

```json
{
  "result": {
    "markets": [
      {
        "symbol": "بازار معامله",
        "base_asset": "رمزارز معامله شونده",
        "quote_asset": "ارز قیمت گذار",
        "fa_base_asset": "نماد ارز معامله شونده",
        "fa_quote_asset": "نماد ارز قیمت گذار",
        "en_base_asset": "نماد ارز معامله شونده",
        "en_quote_asset": "نماد ارز قیمت گذار",
        "categories": [
          "number"
        ],
        "price": "قیمت در لحظه فراخوانی ای پی آي",
        "change_24h": "تغییرات 24 ساعته",
        "volume_24h": "حجم 24 ساعته",
        "change_7D": "تغییرات هفت روزه",
        "quote_volume_24h": "حجم تغییرات 24 ساعته",
        "spot_is_new": "آیا به تازگی در بازار اسپات اضافه شده هست",
        "otc_is_new": "آیا به تازگی در بازار خریدفروش آنی اضافه شده هست",
        "is_new": "آیا ارز جدید هست",
        "is_spot": "وضعیت فعال بودن در بازار اسپات",
        "is_otc": "وضعیت فعال بودن در بازار خرید فروش آنی",
        "is_margin": "وضعیت فعال بودن در بازار تعهدی",
        "is_tmn_based": "وضعیت فعال بودن در پایه بازار تومان",
        "is_usdt_based": "وضعیت فعال بودن در پایه بازار تتر",
        "is_zero_fee": "وضعیت رایگان بودن کارمزد در این بازار",
        "leverage_step": "-",
        "max_leverage": "-",
        "created_at": "زمان اضافه شدن رمز ارز",
        "amount_precision": "-",
        "price_precision": "-",
        "flags": [
          "-"
        ]
      }
    ],
    "message": "The operation was successful",
    "success": true
  }
}
```


====================================
FILE: basic-services-depth.md
SOURCE: https://developers.wallex.ir/docs/basic-services-depth
====================================

---
title: "عمق بازار"
source: https://developers.wallex.ir/docs/basic-services-depth
---

# عمق بازار

## عمق بازارها

جهت دریافت سفارش‌های اوردر بوک و عمق بازارها، میتوانید از API زیر استفاده کنید. **توجه داشته باشید استفاده از API به طور مکرر جهت دریافت عمق بازار ها توصیه نمیشود و ممکن هست با Rate-Limit مواجه شوید.** جهت دریافت عمق بازار خرید ، میتوانید به [آموزش سوکت عمق بازار خرید](index.md) مراجعه کنید. همچنین جهت دریافت عمق بازار فروش ، میتوانید به [آموزش سوکت عمق بازارفروش](index.md) مراجعه کنید.

```curl
GET /v1/depth
```

## توضیحات Response-Body

توجه داشته باشید که result.ask مربوط به لیست فروشندگان میباشد و result.bid مربوط به لیست خریداران میباشد

```json
{
  "result": {
    "ask": [
      {
        "price": "قیمت واحد",
        "quantity": "حجم سفارش",
        "sum": "مجموع کل که شامل ضریب قیمت در حجم میباشد"
      }
    ],
    "bid": [
      {
        "price": "قیمت واحد",
        "quantity": "حجم سفارش",
        "sum": "مجموع کل که شامل ضریب قیمت در حجم میباشد"
      }
    ]
  },
  "message": "وضعیت موفقیت آمیز بودن درخواست",
  "success": true
}
```


====================================
FILE: basic-services-latest-trades.md
SOURCE: https://developers.wallex.ir/docs/basic-services-latest-trades
====================================

---
title: "لیست معاملات"
source: https://developers.wallex.ir/docs/basic-services-latest-trades
---

# لیست معاملات

## لیست معاملات انجام شده

جهت دریافت آخرین معاملات انجام شده، میتوانید از API زیر استفاده کنید. **توجه داشته باشید استفاده از API به طور مکرر جهت دریافت لیست معاملات توصیه نمیشود و ممکن هست با Rate-Limit مواجه شوید.** جهت دریافت لیست آخرین معاملات انجام شده میتوانید به [آموزش سوکت لیست معاملات](index.md) مراجعه کنید.

```curl
GET /v1/trades
```

## توضیحات Query-parameters

برای فراخوانی این API باید مارکتی را که قصد دارید تا نتایح آن را ببینید را در Query-parameters در مسیر API ارسال کنید :

| Parameter | Required | Data Type | Example | Description |
| --- | --- | --- | --- | --- |
| symbol | false | string | BTCUSDT | نماد معاملاتی مورد نظر |

## توضیحات Response-Body

توجه داشته باشید که result.latestTrades شامل چندین Object میباشد که هر کدام مشخصات یک معامله انجام شده میباشد.

```json
{
  "result": {
    "latestTrades": [
      {
        "symbol": "نماد و پایه بازار",
        "quantity": "حجم مورد معامله",
        "price": "قیمت واحد",
        "sum": "ارزش سفارش که شامل ضریب مقدار در قیمت میباشد",
        "isBuyOrder": "وضعیت خرید یا فروش بودن معامله",
        "timestamp": "تایم استمپ لحظه انجام معامله"
      }
    ]
  },
  "message": "The operation was successful",
  "success": true
}
```


====================================
FILE: basic-services-account-fee.md
SOURCE: https://developers.wallex.ir/docs/basic-services-account-fee
====================================

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


====================================
FILE: basic-services-add-iban.md
SOURCE: https://developers.wallex.ir/docs/basic-services-add-iban
====================================

---
title: "اضافه کردن شماره شبا بانکی"
source: https://developers.wallex.ir/docs/basic-services-add-iban
---

# اضافه کردن شماره شبا بانکی

برای اضافه کردن شماره شبای بانکی به حساب خود میتوانید از Api زیر استفاده کنید. توجه داشته باشید شماره شبا اضافه شده باید متعلق به همان شماره ملی باشد که اقدام به ثبت نام کرده اید.

```curl
POST /v1/account/ibans
```

## توضیحات Request-Body

| Parameter | Example | Data Type | Required | Definition |
| --- | --- | --- | --- | --- |
| iban | 12345738472485748758447384 | Number | true | شماره شبایی که قصد دارید اضافه شود. |

## توضیحات Response-Body

```json
{
  "result": {
    "id": "شناسه یکتای شماره شبا",
    "iban": "شماره شبا",
    "owners": [
      "نام صاحب حساب"
    ],
    "bank_name": "نام بانک",
    "status": "وضعیت استعلام",
    "is_default": 0,
    "bank_details": {
      "code": "کد بانک",
      "label": "نام بانک",
      "is_available": 1
    }
  },
  "message": "پیغام موفقیت آمیز بودن درخواست",
  "success": "وضعیت موفقت آمیز بودن درخواست"
}
```


====================================
FILE: basic-services-iban-numbers.md
SOURCE: https://developers.wallex.ir/docs/basic-services-iban-numbers
====================================

---
title: "دریافت شماره‌های شبا بانکی"
source: https://developers.wallex.ir/docs/basic-services-iban-numbers
---

# دریافت شماره‌های شبا بانکی

## دریافت شماره های شبای بانکی

جهت دریافت شماره های شبا بانکی اضافه شده حساب کاربری میتوانید از Api زیر اسفاده کنید.

```curl
GET /v1/account/ibans
```

## توضیحات Response-Body

```json
{
  "result": [
    {
      "id": "شناسه یکتا شماره شبا بانکی",
      "withdraw_daily_amount": "مقدار برداشت روزانه",
      "withdraw_available_amount": "مقدار قابل برداشت روزانه",
      "iban": "شماره شبای بانکی",
      "owners": [
        "صاحب حساب"
      ],
      "bank_name": "نام بانک",
      "status": "وضعیت",
      "is_default": "پیش فرض بودن حساب برای برداشت ها",
      "bank_details": {
        "code": "کد بانک",
        "label": "نام بانک",
        "is_available": "در دسترس بودن"
      }
    }
  ],
  "message": "پیام موفقیت آمیز بودن درخواست",
  "success": "وضعیت موفقیت آمیز بودن",
  "result_info": {
    "page": 1,
    "per_page": 5,
    "count": 5,
    "total_count": 5
  }
}
```


====================================
FILE: basic-services-card-numbers.md
SOURCE: https://developers.wallex.ir/docs/basic-services-card-numbers
====================================

---
title: "دریافت کارت‌های بانکی"
source: https://developers.wallex.ir/docs/basic-services-card-numbers
---

# دریافت کارت‌های بانکی

## دریافت شماره های کارت بانکی

جهت دریافت شماره های کارت بانکی اضافه شده حساب کاربریتون میتوانید از Api زیر اسفاده کنید.

```curl
GET /v1/account/card-numbers
```

## توضیحات Response-Body

```json
{
  "result": [
    {
      "id": "شناسه یکتا",
      "card_number": "شماره کارت بانکی",
      "owners": [
        "نام صاحب حساب"
      ],
      "status": "وضعیت ",
      "is_default": "وضعیت پیش فرض بودن شماره کارت بانکی جهت عملیات برداشت)",
      "bank_details": {
        "code": "کد بانک",
        "label": "نام بانک"
      }
    }
  ],
  "message": "پیام موفقیت آمیز بودن درخواست",
  "success": "وضعیت موفقیت آمیز بودن درخواست",
  "result_info": {
    "page": "شمار صفحه",
    "per_page": "تعداد نتایج در هر صفحه",
    "count": "تعداد نتایج در هر صفحه",
    "total_count": "تعداد تمام نتایج"
  }
}
```


====================================
FILE: basic-services-withdraw-toman.md
SOURCE: https://developers.wallex.ir/docs/basic-services-withdraw-toman
====================================

---
title: "ثبت درخواست برداشت تومان"
source: https://developers.wallex.ir/docs/basic-services-withdraw-toman
---

# ثبت درخواست برداشت تومان

شما میتوانید با استفاده از Api زیر نسبت به ثبت درخواست برداشت تومانی اقدام کنید. توجه داشته باشید Api-Key ارسالی باید مجوز برداشت داشته باشد.

```curl
POST /v1/account/money-withdrawal
```

## توضیحات Request-Body

توجه داشته باشید که میتوانید شناسه یکتای شماره شبا بانکی خود را از [بخش دریافت شماره شبا بانکی](basic-services-iban-numbers.md) دریافت کنید

| Parameter | Example | Data Type | Required | Definition |
| --- | --- | --- | --- | --- |
| iban | 12345 | Number | true | شناسه یکتای شماره شبا (ID) |
| value | 98000 | Number | true | مقداری که قصد برداشت دارید |

## توضیحات Response-Body

```json
{
  "result": {
    "amount": "مقدار برداشت",
    "fee": "مقدار کارمزد",
    "tracking_code": "کد پیگیری",
    "created_at": "زمان ثبت برداشت",
    "status": "وضعیت برداشت تومان",
    "iban": {
      "id": "شناسه یکتا شماره شب",
      "withdraw_daily_amount": "مقدار برداشت روزانه",
      "withdraw_available_amount": "مقدار قابل برداشت روزانه",
      "iban": "شماره شبا",
      "owners": [
        "نام صاحب حساب"
      ],
      "bank_name": "نام بانک",
      "status": "وضعیت درخواست",
      "is_default": 0,
      "bank_details": {
        "code": "کد بانک",
        "label": "نام بانک",
        "is_available": "در دسترس بودن"
      }
    },
    "details": [
      {
        "value": "مقدار برداشت تومان",
        "status": "وضعیت برداشت"
      }
    ]
  },
  "message": "درخواست برداشت ثبت شد",
  "success": true
}
```


====================================
FILE: basic-services-coin-wallets.md
SOURCE: https://developers.wallex.ir/docs/basic-services-coin-wallets
====================================

---
title: "دریافت آدرس کیف‌پول رمزارز"
source: https://developers.wallex.ir/docs/basic-services-coin-wallets
---

# دریافت آدرس کیف‌پول رمزارز

## دریافت آدرس کیف پول رمزارز

جهت دریافت ادرس شبکه کیف پول رمزارز خود میتوانید از Api زیر استفاده کنید

```curl
GET /v1/account/wallets/{symbol}
```

## توضیحات Response-Body

```json
{
  "result": {
    "coin_type": {
      "key": "نماد رمزارز",
      "name": "نام رمزارز",
      "name_en": "نام رمزارز(انگلیسی)",
      "type": "نوع",
      "deposit_availability": "در دتسرس بودن واریز",
      "withdrawal_availability": "در دسترس بودن برداشت",
      "deposit_unavailability_reason": "دلیل عیرفعال بودن واریز",
      "withdrawal_unavailability_reason": "دلیل غیرفعال بودن برداشت"
    },
    "wallets": {
      "نام شبکه": {
        "network": {
          "id": "شناسه یکتا",
          "name": "نام شبکه",
          "deposit_availability": "فعال بودن واریز",
          "withdrawal_availability": "فعال بودن برداشت",
          "deposit_unavailability_reason": "دلیل عیرفعال بودن واریز",
          "withdrawal_unavailability_reason": "دلیل غیرفعال بودن برداشت"
        },
        "address": "آدرس شبکه",
        "memo": "ممو",
        "expire_at": "زمان انقضا",
        "min_confirmation": "حداقل تاییددر شبکه",
        "transaction_fee": "کارمزد تراکنش",
        "min_withdrawal_value": "کمترین مقدار برداشت",
        "min_deposit_value": "کمترین مقدار واریز"
      }
    }
  },
  "message": "پیام موفقیت آمیز بودن درخواست",
  "success": "وضعیت موفقیت آمیز بودن درخواست"
}
```


====================================
FILE: generated-get-account-wallet-by-symbol.md
SOURCE: https://developers.wallex.ir/docs/generated/get-account-wallet-by-symbol
====================================

---
title: "دریافت آدرس کیف‌پول کاربر برای نماد مشخص"
source: https://developers.wallex.ir/docs/generated/get-account-wallet-by-symbol
---

# دریافت آدرس کیف‌پول کاربر برای نماد مشخص

```
GET /v1/account/wallets/:symbol
```

این API آدرس کیف‌پول مربوط به ارز مورد نظر را بر اساس شبکه انتخاب‌شده (مانند ERC20) بازمی‌گرداند. نیازمند API Key در هدر است.

## Request

## Responses

-   200

پاسخ موفق


====================================
FILE: generated-add-account-iban.md
SOURCE: https://developers.wallex.ir/docs/generated/add-account-iban
====================================

---
title: "افزودن شماره شبا جدید به حساب"
source: https://developers.wallex.ir/docs/generated/add-account-iban
---

# افزودن شماره شبا جدید به حساب

```
POST /v1/account/ibans
```

این API برای ثبت یک شماره شبا جدید در حساب کاربر استفاده می‌شود. نیازمند API Key در هدر است.

## Request

## Responses

-   200

پاسخ موفق


====================================
FILE: generated-get-account-ibans.md
SOURCE: https://developers.wallex.ir/docs/generated/get-account-ibans
====================================

---
title: "دریافت لیست شماره شباهای حساب"
source: https://developers.wallex.ir/docs/generated/get-account-ibans
---

# دریافت لیست شماره شباهای حساب

```
GET /v1/account/ibans
```

این API لیست شماره شباهای بانکی کاربر را به همراه وضعیت، مالک و بانک مربوطه بازمی‌گرداند. نیازمند API Key در هدر است.

## Request

## Responses

-   200

پاسخ موفق


====================================
FILE: generated-create-money-withdrawal.md
SOURCE: https://developers.wallex.ir/docs/generated/create-money-withdrawal
====================================

---
title: "درخواست برداشت وجه از حساب"
source: https://developers.wallex.ir/docs/generated/create-money-withdrawal
---

# درخواست برداشت وجه از حساب

```
POST /v1/account/money-withdrawal
```

این API برای ثبت درخواست برداشت وجه از حساب کاربر استفاده می‌شود. نیازمند API Key در هدر است.

## Request

## Responses

-   201

درخواست برداشت با موفقیت ثبت شد


====================================
FILE: generated-get-account-card-numbers.md
SOURCE: https://developers.wallex.ir/docs/generated/get-account-card-numbers
====================================

---
title: "دریافت شماره کارت‌های بانکی حساب"
source: https://developers.wallex.ir/docs/generated/get-account-card-numbers
---

# دریافت شماره کارت‌های بانکی حساب

```
GET /v1/account/card-numbers
```

این API لیست کارت‌های بانکی کاربر را به همراه وضعیت، مالک و بانک مربوطه بازمی‌گرداند. نیازمند API Key در هدر است.

## Responses

-   200

پاسخ موفق


====================================
FILE: generated-get-account-fees.md
SOURCE: https://developers.wallex.ir/docs/generated/get-account-fees
====================================

---
title: "دریافت کارمزدهای حساب"
source: https://developers.wallex.ir/docs/generated/get-account-fees
---

# دریافت کارمزدهای حساب

```
GET /v1/account/fee
```

این API نرخ‌های کارمزد میکر و تیکر را برای هر بازار به همراه مجموع حجم معاملات چند روز اخیر باز می‌گرداند. نیازمند API Key در هدر است.

## Responses

-   200

پاسخ موفق


====================================
FILE: generated-get-latest-trades.md
SOURCE: https://developers.wallex.ir/docs/generated/get-latest-trades
====================================

---
title: "دریافت معاملات اخیر"
source: https://developers.wallex.ir/docs/generated/get-latest-trades
---

# دریافت معاملات اخیر

```
GET /v1/trades
```

این API آخرین معاملات انجام‌شده برای نماد مشخص‌شده را برمی‌گرداند.

## Request

## Responses

-   200

پاسخ موفق


====================================
FILE: generated-get-markets.md
SOURCE: https://developers.wallex.ir/docs/generated/get-markets
====================================

---
title: "Get all markets"
source: https://developers.wallex.ir/docs/generated/get-markets
---

# Get all markets

```
GET /hector/web/v1/markets
```

Retrieve all markets

## Responses

-   200

OK


====================================
FILE: generated-get-market-depth.md
SOURCE: https://developers.wallex.ir/docs/generated/get-market-depth
====================================

---
title: "دریافت عمق بازار"
source: https://developers.wallex.ir/docs/generated/get-market-depth
---

# دریافت عمق بازار

```
GET /v1/depth
```

این API، لیست سفارشات خرید (bid) و فروش (ask) را برای یک نماد خاص برمی‌گرداند.

## Request

## Responses

-   200

پاسخ موفق


====================================
FILE: generated-get-account-balances.md
SOURCE: https://developers.wallex.ir/docs/generated/get-account-balances
====================================

---
title: "Get account balances"
source: https://developers.wallex.ir/docs/generated/get-account-balances
---

# Get account balances

```
GET /v1/account/balances
```

Retrieve the list of all account balances. Requires API key.

## Responses

-   200

Successful response


====================================
FILE: generated-candle-history.md
SOURCE: https://developers.wallex.ir/docs/generated/candle-history
====================================

---
title: "Get historical market data (candles)"
source: https://developers.wallex.ir/docs/generated/candle-history
---

# Get historical market data (candles)

```
GET /v1/udf/history
```

Retrieve historical OHLCV data for a symbol. Useful for charting and analysis.

## Request

## Responses

-   200

Successful response


====================================
FILE: spot-intro.md
SOURCE: https://developers.wallex.ir/docs/spot-intro
====================================

---
title: "معامله اسپات چیست؟"
source: https://developers.wallex.ir/docs/spot-intro
---

# معامله اسپات چیست؟

معاملات اسپات یکی از متداول‌ترین روش‌های خرید و فروش رمزارزهاست.  
در این نوع معامله، سفارش‌های شما پس از قرارگرفتن در اوردربوک و وجود داشتن سفارش متناظر در سمت مخالف معامله میشوند.  
در ادامه، با انواع روش‌های سفارش‌گذاری در معاملات اسپات و اصطلاحات رایج آن آشنا می‌شویم.

## معاملات اسپات با اکانت اعتبار معاملاتی

توجه داشتید امکان معامله اسپات علاوه با اکانت اصلی با اکانت اعتبار معاملاتی نیز فراهم میباشد.

-   جهت انجام معامله با **اکانت اصلی** صرفا باید API-Key اکانت اصلی خود را در Request-Header ارسال کنید.
-   جهت انجام معامله با **اکانت اعتبار معاملاتی** خود ، باید API-Key اکانت اعتبار معاملاتی خود را در Request-Header ارسال کنید. که نحوه ساخت آن در قسمت [ساخت API-Key](create-api-key.md) آموزش داده شده است
-   همچنین برای انجام معامله اسپات با اکانت **اعتبار معاملاتی** خود باید کلید **sub-account-client-id** را نیز در Request-Header ارسال کنید. نحوه دریافت sub-account-client-id در [بخش اعتبار معاملاتی](index.md) آموزش داده شده هست.

```text
"sub-account-client-id" : "YOUR subAccount-ClientId"
```

## دانلود Swagger معامله اسپات

.تمامی API هایی که نحوه ارسال درخواست به آن ها در ادامه گفته میشود را میتوانید از طریق لینک زیر دانلود کنید

[دانلود Swagger معامله اسپات](/assets/files/spot-b9d06896d1009adc9ebc69b9a5495e7e.json)


====================================
FILE: spot-types.md
SOURCE: https://developers.wallex.ir/docs/spot-types
====================================

---
title: "اصطلاحات معامله اسپات"
source: https://developers.wallex.ir/docs/spot-types
---

# اصطلاحات معامله اسپات

## انواع سفارش در معاملات اسپات

## سفارش قیمت ثابت (Limit Order)

-   در این نوع سفارش، شما قیمتی را که مایل به خرید یا فروش رمزارز هستید، به‌صورت دستی مشخص می‌کنید.
-   سفارش شما پس از ثبت در لیست سفارش‌ها (Order Book) قرار میگیرد.

## سفارش قیمت بازار (Market Order)

-   در این نوع سفارش، معامله بلافاصله و با بهترین قیمت موجود در لیست سفارش‌ها انجام می‌شود.
-   نیازی به تعیین قیمت توسط شما نیست.
-   ممکن است بخش‌هایی از سفارش با قیمت‌های مختلف انجام شود.
-   دقت داشته باشید در صورتی که حجم درخواستی شما بیشتر از حجم اوردربوک باشد و یا باعث جابجایی قیمت 2 درصدی آخرین معامله شود ، سفارش مارکت شما به‌صورت اتوماتیک کنسل میشود

## حد ضرر (Stop Limit)

-   در این روش، می‌توانید برای سفارش خود یک قیمت توقف مشخص کنید.
-   تا زمانی که شروط قیمت توقف اجرا نشده باشد ، سفارش شما در اوردربوک قرار نخواهد گرفت.
-   شروط قیمت توقف:
    -   در زمان ساخت سفارش ، در صورتی که قیمت توقف کوچکتر از قیمت آخرین معامله باشد ، سفارش شما زمانی در اوردربوک قرار میگیرد که قیمت آخرین معامله کوچکتر یا مساوی قیمت توقف شود.
    -   در زمان ساخت سفارش ، در صورتی که قیمت توقف بزرگتر از قیمت آخرین معامله باشد ، سفارش شما زمانی در اوردربوک قرار میگیرد که قیمت آخرین معامله بزرگتر یا مساوی قیمت توقف شود.
-   زمانی که شرط قیمت توقف اجرا شود، سفارش شما در اوردربوک قرار میگیرد و مانند یک سفارش LIMIT رفتار میکند.

## حد ضرر با قیمت بازار (Stop Market)

-   در این روش، می‌توانید برای سفارش خود یک قیمت توقف مشخص کنید.
-   تا زمانی که شروط قیمت توقف اجرا نشده باشد ، سفارش مارکت شما انجام نخواهد شد.
-   شروط قیمت توقف:
    -   در زمان ساخت سفارش ، در صورتی که قیمت توقف کوچکتر از قیمت آخرین معامله باشد ، سفارش شما زمانی در اوردربوک قرار میگیرد که قیمت آخرین معامله کوچکتر یا مساوی قیمت توقف شود.
    -   در زمان ساخت سفارش ، در صورتی که قیمت توقف بزرگتر از قیمت آخرین معامله باشد ، سفارش شما زمانی در اوردربوک قرار میگیرد که قیمت آخرین معامله بزرگتر یا مساوی قیمت توقف شود.
-   زمانی که شرط قیمت توقف اجرا شوند، سفارش شما مانند یک سفارش MARKET رفتار میکند.


====================================
FILE: spot-active-markets.md
SOURCE: https://developers.wallex.ir/docs/spot-active-markets
====================================

---
title: "مارکت‌های فعال در معامله اسپات"
source: https://developers.wallex.ir/docs/spot-active-markets
---

# مارکت‌های فعال در معامله اسپات

## مارکت های فعال

در ابتدا برای شروع به معامله در اسپات ، باید بدانیم که چه بازارهایی در این نوع معامله فعال هستند با استفاده از API زیر میتوانید لیست تمامی مارکت ها را مشاهده کنید.

```curl
GET /hector/web/v1/markets
```

## توضیحات Response-Body

شما میتوانید در تمام مارکت هایی که فیلد is\_spot آن ها برابر true میباشد اقدام به معامله اسپات کنید.

```json
{
  "result": {
    "markets": [
      {
        "symbol": "بازار معامله",
        "base_asset": "رمزارز معامله شونده",
        "quote_asset": "ارز قیمت گذار",
        "fa_base_asset": "نماد ارز معامله شونده",
        "fa_quote_asset": "نماد ارز قیمت گذار",
        "en_base_asset": "نماد ارز معامله شونده",
        "en_quote_asset": "نماد ارز قیمت گذار",
        "categories": [
          "number"
        ],
        "price": "قیمت در لحظه فراخوانی ای پی آي",
        "change_24h": "تغییرات 24 ساعته",
        "volume_24h": "حجم 24 ساعته",
        "change_7D": "تغییرات هفت روزه",
        "quote_volume_24h": "حجم تغییرات 24 ساعته",
        "spot_is_new": "آیا به تازگی در بازار اسپات اضافه شده هست",
        "otc_is_new": "آیا به تازگی در بازار خریدفروش آنی اضافه شده هست",
        "is_new": "آیا ارز جدید هست",
        "is_spot": "وضعیت فعال بودن در بازار اسپات",
        "is_otc": "وضعیت فعال بودن در بازار خرید فروش آنی",
        "is_margin": "وضعیت فعال بودن در بازار تعهدی",
        "is_tmn_based": "وضعیت فعال بودن در پایه بازار تومان",
        "is_usdt_based": "وضعیت فعال بودن در پایه بازار تتر",
        "is_zero_fee": "وضعیت رایگان بودن کارمزد در این بازار",
        "leverage_step": "در معامله تعهدی توضیحات داده شده است",
        "max_leverage": "در معامله تعهدی توضیحات داده شده است",
        "created_at": "زمان اضافه شدن رمز ارز",
        "amount_precision": "تعداد رقم اعشار در حجم",
        "price_precision": "تعداد رقم اعشار در قیمت رمز ارز",
        "flags": [
          "-"
        ]
      }
    ],
    "message": "The operation was successful",
    "success": true
  }
}
```


====================================
FILE: spot-create-order.md
SOURCE: https://developers.wallex.ir/docs/spot-create-order
====================================

---
title: "ثبت سفارش اسپات"
source: https://developers.wallex.ir/docs/spot-create-order
---

# ثبت سفارش اسپات

## ثبت سفارش

این API برای ثبت سفارش جدید در بازار اسپات استفاده می‌شود. کاربر می‌تواند با مشخص کردن پارامترهای سفارش مثل نوع، قیمت، مقدار، و نماد معاملاتی، سفارش خود را ثبت کند.

```curl
POST /v1/account/orders
```

## توضیحات Request-Body

برای فراخوانی این API باید اطلاعات زیر را به‌صورت JSON در Request-Body ارسال کنید:

## API Parameters

| Parameter | Example | Data Type | Required | Valid Values | Definition |
| --- | --- | --- | --- | --- | --- |
| price | "82494" | String | true | — | قیمت واحد برای ثبت سفارش |
| quantity | "10" | String | true | — | حجم درخواستی برای ثبت سفارش |
| side | "BUY" | String | true | "BUY" | "SELL" | با توجه به سمت سفارش شما (خرید یا فروش) این پارامتر باید یکی از دو نوع گفته شده باشد |
| symbol | "BTCUSDT" | String | true | — | بازاری که قصد دارید تا در آن سفارش ثبت شود |
| type | "LIMIT" | String | true | "LIMIT" | "MARKET" | "STOP\_LIMIT" | "STOP\_MARKET" | با توجه به نوع سفارش شما این پارامتر باید یکی از چهار نوع سفارش گفته شده باشد |
| stop\_Price | "83000" | String | Conditional | — | در صورتی که سفارش شما از نوع "STOP\_LIMIT" یا "STOP\_MARKET" باشد ارسال این فیلد الزامی است و در غیر این صورت نباید ارسال شود. این فیلد بیانگر قیمت توقف می‌باشد. |
| client\_id | "test\_clientId" | String | false | letters (A–Z), underscore(\_), digits (0–9) | در صورت عدم ارسال، clientOrderId توسط سیستم ساخته می‌شود. در صورت ارسال باید مقدار unique باشد، در غیر این صورت سفارش ثبت نمی‌شود. |

## توضیحات Response-Body

در صورت موفقیت آمیزبودن درخواست شما ، Response-Code دریافتی 201 میباشد.

```json
{
  "message": "پیام کلی درباره وضعیت سفارش یا پاسخ سرور",
  "result": {
    "active": "آیا سفارش فعال است یا خیر",
    "clientOrderId": "شناسه سفارش که برای دریافت جزییات سفارش یا لغو آن استفاده میگردد",
    "created_at": "زمان ایجاد سفارش",
    "executedPercent": "درصد اجراشده از سفارش",
    "executedPrice": " قیمت اجرا شده سفارش ",
    "executedQty": "مقدار اجرا شده از سفارش",
    "executedSum": "جمع مبلغ اجرا شده سفارش ",
    "fee": "کارمزد کل سفارش",
    "fills": [
      {
        "fee": "کارمزد بخش اجرا شده",
        "feeAsset": "نوع دارایی کارمزد (مثل USDT)",
        "feeCoefficient": "ضریب کارمزد آن بخش",
        "isBuyer": "آیا کاربر خریدار بود یا فروشنده",
        "makerFeeCoefficient": "ضریب کارمزد Maker",
        "price": "قیمت معامله در آن بخش",
        "quantity": "حجم معامله در آن بخش",
        "sum": "جمع کل مبلغ معامله در آن بخش",
        "symbol": "نماد معاملاتی مربوط به معامله",
        "takerFeeCoefficient": "ضریب کارمزد Taker",
        "timestamp": " زمان انجام معامله در آن بخش"
      }
    ],
    "origQty": "مقدار اولیه سفارش",
    "price": "قیمت سفارش",
    "side": "سمت سفارش",
    "status": "وضعیت سفارش",
    "stopPrice": "قیمت توقف",
    "stopPriceCondition": "شرط مربوط به قیمت توقف",
    "sum": "جمع کل ارزش سفارش",
    "symbol": "نماد معاملاتی سفارش",
    "transactTime": "زمان تراکنش ",
    "type": "نوع سفارش ",
    "updated_at": "زمان آخرین به‌روزرسانی سفارش"
  },
  "success": "موفقیت آمیز بودن درخواست"
}
```

محدودیت نرخ ثبت سفارش

تعداد درخواست‌های مجاز برای ثبت سفارش **حداکثر ۲۰ درخواست در هر ۱۰ ثانیه** می‌باشد.


====================================
FILE: spot-cancel-order.md
SOURCE: https://developers.wallex.ir/docs/spot-cancel-order
====================================

---
title: "لغو سفارش"
source: https://developers.wallex.ir/docs/spot-cancel-order
---

# لغو سفارش

در صورتی که وضعیت سفارش شما هنوز FINISHED نشده باشد. به عبارت دیگر درصورتی که سفارش شما به‌طور کامل اجرا نشده باشد و یا قسمتی از آن اجرا شده باشد. شما میتوانید سفارش خود را با API زیر لغو کنید.  
توجه داشته باشید که Client-Order-id خود را باید به عنوان path-variable ارسال کنید.

```curl
DELETE /v1/account/orders/{client_id}
```

## توضیحات Path-Variable

برای فراخوانی این API باید Client-Order-id خود را به عنوان path-variable در مسیر API ارسال کنید :

## API Parameters

| Parameter | Example | Data Type | Required | Definition |
| --- | --- | --- | --- | --- |
| clientOrderId | "test-clientId" | String | true | عبارت Client-order-id یک عبارت یکتا می‌باشد که در زمان ساخت سفارش در Response-Body ارسال می‌شود. جهت آشنایی برای گرفتن Client-order-id به قسمت [ثبت سفارش](spot-create-order.md) مراجعه کنید. |

## توضیحات Response-Body

```json
{
  "message": "پیام پاسخ از سرور (مثلا موفقیت یا خطا)",
  "result": {
    "active": "وضعیت فعال بودن سفارش",
    "clientOrderId": "شناسه سفارش اختصاصی مشتری",
    "created_at": "زمان ایجاد سفارش (مثلا به صورت رشته تاریخ)",
    "executedPercent": "درصد اجراشده از سفارش شما",
    "executedPrice": "قیمت اجرا شده سفارش",
    "executedQty": "مقدار اجرا شده از سفارش",
    "executedSum": "مجموع مقدار اجرا شده ",
    "fee": "هزینه انجام سفارش",
    "fills": [
      {
        "fee": "کارمزد هر معامله",
        "feeAsset": " کارمزد به چه ارزی پرداخت شده",
        "feeCoefficient": "ضریب هزینه معامله",
        "isBuyer": "وضعیت خرید با فروش بودن سفارش",
        "makerFeeCoefficient": "ضریب کارمزد میکر",
        "price": "قیمت معامله",
        "quantity": "مقدار معامله شده",
        "sum": "مجموع معامله",
        "symbol": "نماد معامله",
        "takerFeeCoefficient": "ضریب کارمزد  ",
        "timestamp": "زمان معامله"
      }
    ],
    "origQty": "مقدار اصلی سفارش ثبت شده",
    "price": "قیمت ثبت شده سفارش",
    "side": "سمت سفارش: خرید یا فروش",
    "status": "وضعیت سفارش (مثلا فعال، لغو شده، تکمیل شده)",
    "stopPrice": "قیمت توقف",
    "stopPriceCondition": "شرط فعال‌سازی قیمت توقف",
    "sum": "مجموع کل سفارش ",
    "symbol": " نماد معاملاتی سفارش",
    "transactTime": 0,
    "type": " نوع سفارش ",
    "updated_at": "زمان آخرین به‌روزرسانی سفارش"
  },
  "success": true
}
```


====================================
FILE: spot-single-order-detail.md
SOURCE: https://developers.wallex.ir/docs/spot-single-order-detail
====================================

---
title: "دریافت جزئیات سفارش"
source: https://developers.wallex.ir/docs/spot-single-order-detail
---

# دریافت جزئیات سفارش

برای مشاهده جزئیات یک سفارش میتوانید از API زیر استفاده کنید. این جزئیات شامل وضعیت سفارش، مقدار پر شده، کارمزدها و ... سفارش شما میباشد.  
توجه داشته باشید که Client-Order-id خود را باید به عنوان path-variable ارسال کنید.

```curl
GET /v1/account/orders/{client_id}
```

## توضیحات Path-Variable

برای فراخوانی این API باید Client-Order-id خود را به عنوان path-variable در مسیر API ارسال کنید :

| Parameter | Example | Data Type | Required | Definition |
| --- | --- | --- | --- | --- |
| clientOrderId | "test-clientId" | String | true | عبارت Client-order-id یک عبارت یکتا می‌باشد که در زمان ساخت سفارش در Response-Body ساخت سفارش دریافت می‌شود. جهت آشنایی برای گرفتن Client-order-id به قسمت [ثبت سفارش](spot-create-order.md) مراجعه کنید. |

## توضیحات Response-Body

```json
{
  "message": "پیام متنی درباره وضعیت پاسخ",
  "result": {
    "active": "وضعیت فعال بودن سفارش",
    "clientOrderId": "شناسه سفارش اختصاصی مشتری",
    "created_at": "زمان ایجاد سفارش (رشته تاریخ و زمان)",
    "executedPercent": 0,
    "executedPrice": "قیمت اجرا شده سفارش",
    "executedQty": "تعداد اجرا شده از سفارش",
    "executedSum": "مجموع مبلغ اجرا شده",
    "fee": "کارمزد کل سفارش",
    "fills": [
      {
        "fee": "کارمزد این معامله خاص",
        "feeAsset": "نوع دارایی که کارمزد به آن تعلق گرفته",
        "feeCoefficient": "ضریب کارمزد",
        "isBuyer": "وضعیت خرید با فروش بودن سفارش",
        "makerFeeCoefficient": "ضریب کارمزد سازنده سفارش",
        "price": "قیمت معامله",
        "quantity": " تعداد معامله شده",
        "sum": "مجموع مبلغ معامله",
        "symbol": "نماد دارایی معامله شده",
        "takerFeeCoefficient": "ضریب کارمزد گیرنده سفارش",
        "timestamp": "زمان معامله"
      }
    ],
    "origQty": " تعداد اولیه سفارش",
    "price": " قیمت سفارش",
    "side": " وضعیت سفارش ",
    "stopPrice": "قیمت توقف سفارش ",
    "stopPriceCondition": "شرط فعال شدن قیمت توقف",
    "sum": "مجموع کل سفارش",
    "symbol": "نماد دارایی مربوط به سفارش",
    "transactTime": 0,
    "type": " نوع سفارش ",
    "updated_at": " زمان آخرین به‌روزرسانی سفارش"
  },
  "success": true
}
```


====================================
FILE: spot-order-list.md
SOURCE: https://developers.wallex.ir/docs/spot-order-list
====================================

---
title: "لیست تمامی سفارشات"
source: https://developers.wallex.ir/docs/spot-order-list
---

# لیست تمامی سفارشات

## دریافت لیست سفارش‌ها

جهت مشاهده تمامی سفارش‌های خود در والکس میتوانید از این API استفاده کنید.  
با استفاده از فیلترهای مختلف میتوانید نتایج دلخواه خود را دریافت کنید.  
توجه داشته باشید تمامی فیلترها را باید به‌صورت Query-parameters ارسال کنید

```curl
GET /v1/account/orders
```

## توضیحات Query-parameters

برای فراخوانی این API میتوانید پارارمترهای مختلف خود را به عنوان Query-parameters در مسیر API ارسال کنید :

| Parameter | Example | Data Type | Required | Valid Values | Definition |
| --- | --- | --- | --- | --- | --- |
| from | 2024-10-01 | String | false | — | با ارسال این Query-parameter میتوانید سفارش‌های خود را از تاریخ X دریافت کنید |
| to | 2024-10-02 | String | false | — | با ارسال این Query-parameter میتوانید سفارش‌های خود را تا تاریخ X دریافت کنید |
| page | 1 | Number | false | Numbers ≥ 1 | با ارسال این Query-parameter میتوانید سفارشات را به صورت صفحه‌بندی‌شده مشاهده کنید (برای مثال page=2 برای دریافت صفحه دوم سفارشات) |
| per\_page | 10 | Number | false | Numbers ≥ 1 | تعداد سفارشات نمایش داده‌شده در هر صفحه را مشخص می‌کند (برای مثال per\_page=20 برای دریافت ۲۰ سفارش در هر صفحه) |
| type | LIMIT | String | false | LIMIT | MARKET | STOP\_LIMIT | STOP\_MARKET | فیلتر سفارشات بر اساس نوع آن |
| side | BUY | String | false | BUY | SELL | فیلتر سفارشات بر اساس سمت آن |
| market | BTCUSDT | String | false | — | فیلتر سفارشات بر اساس مارکت |

## توضیحات Response-Body

```json
{
  "message": " پیام کلی از سرور درباره وضعیت پاسخ",
  "result": {
    "additionalProp1": [
      {
        "active": "وضعیت فعال بودن سفارش",
        "clientOrderId": "شناسه سفارش در سمت کلاینت",
        "created_at": "زمان ایجاد سفارش",
        "executedPercent": "مقدار اجرا شده از سفارش",
        "executedPrice": "میانگین قیمت سفارش اجرا شده",
        "executedQty": "مقدار سفارش که اجرا شده",
        "executedSum": "جمع مبلغ سفارش اجرا شده",
        "fee": "  کارمزد سفارش",
        "fills": [
          {
            "fee": "کارمزد معامله",
            "feeAsset": "نوع دارایی کارمزد (مثلاً USDT)",
            "feeCoefficient": "ضریب کارمزد",
            "isBuyer": "وضعیت خرید یا فروش بودن سفارش",
            "makerFeeCoefficient": "ضریب کارمزد Maker",
            "price": " قیمت معامله",
            "quantity": " تعداد معامله شده در این قسمت",
            "sum": " مجموع قیمت در این قسمت",
            "symbol": " نماد معاملاتی",
            "takerFeeCoefficient": " ضریب کارمزد Taker",
            "timestamp": "زمان اجرای این بخش"
          }
        ],
        "origQty": "مقدار اولیه سفارش",
        "price": " قیمت سفارش",
        "side": "نوع سفارش (buy یا sell)",
        "status": "وضعیت سفارش (مثلاً NEW، FILLED، CANCELED)",
        "stopPrice": "قیمت توقف (در صورت سفارش شرطی)",
        "stopPriceCondition": " شرط اجرای قیمت توقف",
        "sum": "جمع کل ارزش سفارش",
        "symbol": " نماد معاملاتی سفارش",
        "transactTime": 0,
        "type": "نوع سفارش (LIMIT, MARKET, STOP_LIMIT و...)",
        "updated_at": "زمان آخرین به‌روزرسانی سفارش"
      }
    ],
    "additionalProp2": [
      "ساختاری مشابه additionalProp1"
    ],
    "additionalProp3": [
      "ساختاری مشابه additionalProp1"
    ]
  },
  "result_info": "اطلاعات اضافی درباره نتیجه (مثل پیغام یا توضیح)",
  "success": true
}
```


====================================
FILE: spot-active-orders.md
SOURCE: https://developers.wallex.ir/docs/spot-active-orders
====================================

---
title: "لیست سفارشات فعال"
source: https://developers.wallex.ir/docs/spot-active-orders
---

# لیست سفارشات فعال

این API برای دریافت لیست سفارش‌های فعال (Active Orders) طراحی شده است.  
سفارش‌های فعال، سفارشاتی هستند که هنوز به طور کامل اجرا نشدند یا لغو نشده‌اند.  
این API به شما امکان می‌دهد تا سفارش‌ها فعال خود را به‌صورت لحظه‌ای بررسی کرده و اطلاعات کامل مربوط به آن‌ها را دریافت کنید.  
همچنین با استفاده از فیلترهای مختلف میتوانید نتایج دلخواه خود را فیلتر کنید.  
توجه داشته باشید تمامی فیلترها را باید به‌صورت Query-parameters ارسال کنید

```curl
GET /v1/account/openOrders
```

## توضیحات Query-parameters

برای فراخوانی این API میتوانید پارارمترهای مختلف خود را به عنوان Query-parameters در مسیر API ارسال کنید :

| Parameter | Example | Data Type | Required | Valid Values | Definition |
| --- | --- | --- | --- | --- | --- |
| symbol | USDTTMN | String | false | — | با ارسال این Query-parameter میتوانید سفارشات را بر اساس مارکت مورد نظر مشاهده کنید |
| page | 1 | Number | false | Numbers ≥ 1 | با ارسال این Query-parameter میتوانید سفارشات را به صورت صفحه‌بندی‌شده مشاهده کنید (برای مثال page=2 برای دریافت صفحه دوم سفارشات) |
| per\_page | 10 | Number | false | Numbers ≥ 1 | تعداد سفارشات نمایش داده‌شده در هر صفحه را مشخص می‌کند (برای مثال per\_page=20 برای دریافت ۲۰ سفارش در هر صفحه) |

## توضیحات Response-Body

```json
{
  "message": "پیام وضعیت پاسخ از سمت سرور",
  "result": {
    "additionalProp1": [
      {
        "active": true,
        "clientOrderId": "شناسه سفارش از سمت کلاینت",
        "created_at": " زمان ایجاد سفارش",
        "executedPercent": 0,
        "executedPrice": "میانگین قیمت اجرای سفارش",
        "executedQty": "مقدار اجرایی‌شده از سفارش",
        "executedSum": "ارزش کل سفارش اجرا شده",
        "fills": [
          {
            "fee": "مقدار کارمزد برای این اجرای خاص",
            "feeAsset": "نوع دارایی کارمزد (مثلاً USDT)",
            "feeCoefficient": "ضریب کارمزد کلی",
            "isBuyer": "وضعیت خرید با فروش بودن سفارش",
            "makerFeeCoefficient": "ضریب کارمزد به عنوان Maker",
            "price": "قیمت این اجرای خاص",
            "quantity": "مقدار معامله شده",
            "sum": "جمع ارزش اجرای سفارش",
            "symbol": " نماد معاملاتی (مثلاً BTCUSDT)",
            "takerFeeCoefficient": "ضریب کارمزد به عنوان Taker",
            "timestamp": "زمان دقیق اجرای این بخش از سفارش"
          }
        ],
        "origQty": "مقدار اولیه سفارش",
        "price": " قیمت سفارش",
        "side": "نوع سفارش (buy/sell)",
        "status": "وضعیت سفارش (مثل: NEW، FILLED، CANCELED)",
        "stopPrice": "قیمت توقف (برای سفارشات شرطی)",
        "stopPriceCondition": "شرط اجرا شدن stopPrice",
        "sum": " جمع کلی ارزش سفارش",
        "symbol": " نماد معاملاتی مربوط به سفارش",
        "transactTime": 0,
        "type": "نوع سفارش (مثل: LIMIT، MARKET، STOP_LIMIT)",
        "updated_at": " زمان آخرین به‌روزرسانی سفارش"
      }
    ],
    "additionalProp2": [
      "ساختاری مشابه additionalProp1"
    ],
    "additionalProp3": [
      "ساختاری مشابه additionalProp1"
    ]
  },
  "result_info": "اطلاعات یا توضیحات اضافی ",
  "success": true
}
```


====================================
FILE: generated-get-depth.md
SOURCE: https://developers.wallex.ir/docs/generated/get-depth
====================================

---
title: "Get all markets depth"
source: https://developers.wallex.ir/docs/generated/get-depth
---

# Get all markets depth

```
GET /depth/all
```

Retrieve market depth for all markets

## Responses

-   200
-   500

OK

Internal server error


====================================
FILE: generated-get-open-order.md
SOURCE: https://developers.wallex.ir/docs/generated/get-open-order
====================================

---
title: "List active orders"
source: https://developers.wallex.ir/docs/generated/get-open-order
---

# List active orders

```
GET /v1/account/openOrders
```

Get a list of currently active orders

## Request

## Responses

-   200
-   400
-   401
-   422

OK

Invalid request parameters

Unauthorized

Validation error


====================================
FILE: generated-get-orders.md
SOURCE: https://developers.wallex.ir/docs/generated/get-orders
====================================

---
title: "List margin orders"
source: https://developers.wallex.ir/docs/generated/get-orders
---

# List margin orders

```
GET /margin-trade/v1/orders
```

List margin orders

## Request

## Responses

-   200
-   408
-   500

scheme of `result` field in success response

Request time out

Internal server error


====================================
FILE: generated-post-account-orders.md
SOURCE: https://developers.wallex.ir/docs/generated/post-account-orders
====================================

---
title: "Submit a new trading order"
source: https://developers.wallex.ir/docs/generated/post-account-orders
---

# Submit a new trading order

```
POST /v1/account/orders
```

Create a new order for trading with specified parameters

## Request

## Responses

-   201
-   400
-   401
-   422

Order created successfully

Invalid request parameters

Unauthorized

Validation error


====================================
FILE: generated-delete-account-orders.md
SOURCE: https://developers.wallex.ir/docs/generated/delete-account-orders
====================================

---
title: "Cancel an existing order"
source: https://developers.wallex.ir/docs/generated/delete-account-orders
---

# Cancel an existing order

```
DELETE /v1/account/orders
```

Cancel a trading order by its client ID

## Request

## Responses

-   200
-   400
-   401
-   422

Order cancelled successfully

Invalid request parameters

Unauthorized

Validation error


====================================
FILE: generated-get-orders-client.md
SOURCE: https://developers.wallex.ir/docs/generated/get-orders-client
====================================

---
title: "Get order details"
source: https://developers.wallex.ir/docs/generated/get-orders-client
---

# Get order details

```
GET /v1/account/orders/:client_id
```

Get detailed information about a specific order

## Request

## Responses

-   200
-   400
-   401
-   404

Order details retrieved successfully

Invalid request parameters

Unauthorized

Order not found


====================================
FILE: generated-delete-orders-client.md
SOURCE: https://developers.wallex.ir/docs/generated/delete-orders-client
====================================

---
title: "Cancel an order by path parameter"
source: https://developers.wallex.ir/docs/generated/delete-orders-client
---

# Cancel an order by path parameter

```
DELETE /v1/account/orders/:client_id
```

Cancel a trading order using the client ID in the URL path

## Request

## Responses

-   200
-   400
-   401
-   422

Order cancelled successfully

Invalid request parameters

Unauthorized

Validation error


====================================
FILE: margin-intro.md
SOURCE: https://developers.wallex.ir/docs/margin-intro
====================================

---
title: "معامله تعهدی چیست؟"
source: https://developers.wallex.ir/docs/margin-intro
---

# معامله تعهدی چیست؟

## معامله تعهدی چیست ؟

معامله تعهدی یک روش معامله است که در آن امکان استفاده از اعتبار، نسبت اعتبار و همچنین ایجاد موقعیت لانگ یا شورت وجود دارد. معامله تعهدی از جمله معاملات پرریسک محسوب می‌شود زیرا شما می‌توانید در صورت موفقیت در معامله، سود بیشتری کسب کنید و همچنین حرکت در سمت مخالف بازار، می‌تواند ضرر‌های قابل توجهی به دنبال داشته باشد.

## دانلود Swagger معامله تعهدی

تمامی API هایی که نحوه ارسال درخواست به آن ها در ادامه گفته میشود را میتوانید از طریق لینک زیر دریافت کنید.

[دانلود Swagger معامله تعهدی](/assets/files/margin-c709e1f52cb44387a2e35ffd678c6dfa.json)


====================================
FILE: margin-types.md
SOURCE: https://developers.wallex.ir/docs/margin-types
====================================

---
title: "اصطلاحات معامله تعهدی"
source: https://developers.wallex.ir/docs/margin-types
---

# اصطلاحات معامله تعهدی

## موقعیت شورت/short (فروش):

در این نوع معامله، شما انتظار دارید که قیمت رمزارز انتخابی‌ شما کاهش پیدا کند.  
در این صورت با فروش آن رمزارز در قیمت بالا و سپس خرید در قیمت پایین کسب سود می‌کنید.  
لازم است تا قبل از باز کردن موقعیت شورت، از روند و سمت‌ و سوی بازار انتخابی اطلاع کافی داشته باشید.

## موقعیت لانگ/Long (خرید):

در این نوع معامله، شما انتظار دارید که قیمت رمزارز انتخابی‌ شما افزایش پیدا کند.  
در این صورت با خرید در قیمت پایین و سپس فروش در قیمت بالا کسب سود می‌کنید.  
لازم است تا قبل از باز کردن موقعیت لانگ، از روند و سمت‌ و سوی بازار انتخابی اطلاع کافی داشته باشید.

## نسبت اعتبار:

با تنظیم نسبت اعتبار شما می‌توانید اعتبار دریافتی را تا چندین برابر نسبت به وثیقه‌ خود افزایش دهید.  
بدیهی است که هر چه مقدار نسبت اعتبار بیشتر باشد، ریسک معامله تعهدی شما نیز بیشتر می‌شود.

## وثیقه:

به ازای اعتباری که از والکس برای معامله تعهدی دریافت می‌کنید،  
مبلغی را به عنوان وجه تضمین پرداخت می‌کنید و در صورت سودده بودن موقعیت، پس از بستن موقعیت آن را دریافت می‌کنید.  
در صورتی که موقعیت ضرر ده باشد، مقدار ضرر از وثیقه شما کسر می‌گردد.

## کارمزد فعال‌سازی موقعیت:

این مبلغ، کارمزدی است که به ازای باز کردن هر موقعیت در نظر گرفته شده و هنگام بستن آن موقعیت از وثیقه کسر می‌گردد.

## کارمزد تمدید موقعیت:

این مبلغ، کارمزدی است که به ازای هر ۴ ساعت تمدید موقعیت محاسبه شده و هنگام بستن موقعیت از وثیقه کسر می‌گردد.

## موقعیت:

موقعیت یا همان پوزیشن به وضعیت یک معامله تعهدی اشاره دارد.  
که نشان می‌دهد آیا در حال حاضر از نگه داشتن یک رمزارزی که انتظار افزایش قیمت آن را دارید (موقعیت لانگ) یا انتظار کاهش قیمت آن را دارید (موقعیت شورت) کسب سود می‌کنید یا خیر.  
لازم به ذکر است که در والکس حداکثر عمر یک موقعیت ۲۱ روز است.  
موقعیت‌ها در چهار حالت بسته می‌شوند:

-   در صورت اتمام عمر موقعیت
-   لیکویید شدن
-   بستن موقعیت توسط شما (دستی)
-   یا در صورت رسیدن قیمت به حد سود و ضرر


====================================
FILE: margin-active-markets.md
SOURCE: https://developers.wallex.ir/docs/margin-active-markets
====================================

---
title: "مارکت‌های فعال در معامله تعهدی"
source: https://developers.wallex.ir/docs/margin-active-markets
---

# مارکت‌های فعال در معامله تعهدی

## مارکت های فعال

در ابتدا برای شروع به معامله در معامله تعهدی ، باید بدانیم که چه بازارهایی در این نوع معامله فعال هستند

```curl
GET /margin-trade/v1/public/markets
```

## توضیحات Response-Body

```json
{
  "symbol": "متشکل از پایه بازار و بازاری که در آن معامله صورت میگیرد",
  "base": "ارز معامله شونده",
  "quote": "ارز قیمت گذار",
  "min_risk_coef": "حداقل نسبت اعتبار",
  "max_risk_coef": "حداکثر نسبت اعتبار",
  "risk_coef_step": "افزایش پله ای نسبت اعتبار",
  "liquidity_margin": "درصد باقی مانده پوزیشن با لیکوییدی",
  "max_age": "ماکزیمم عمر موقعیت"
}
```


====================================
FILE: margin-calculate-loan.md
SOURCE: https://developers.wallex.ir/docs/margin-calculate-loan
====================================

---
title: "محاسبه وثیقه"
source: https://developers.wallex.ir/docs/margin-calculate-loan
---

# محاسبه وثیقه

## محاسبه میزان حداقل و حداکثر وثیقه

در هر مارکت به نسبت اعتباری که قصد دریافت آن را دارید یک میزان حداقل و حداکثر وثیقه وجود دارد.  
برای محاسبه آن باید API زیر را فراخوانی کنید

```curl
POST /margin-trade/v1/public/loan
```

## توضیحات Request-Body

برای فراخوانی این API باید اطلاعات زیر را به‌صورت JSON در Request-Body ارسال کنید:

| Parameter | Example | Data Type | Required | Valid Values | Definition |
| --- | --- | --- | --- | --- | --- |
| collateral | "300000" | String | false | — | میزان وثیقه برای ساخت پوزیشن معامله تعهدی |
| market | "BTCUSDT" | String | true | — | بازاری که قصد دارید در آن پوزیشن معامله تعهدی ایجاد نمایید |
| open\_price | "80000000" | String | false | — | قیمتی که قصد دارید در آن پوزیشن معامله تعهدی ساخته شود |
| risk\_coef | "10" | String | true | — | نسبت اعتباری که قصد دارید دریافت کنید |
| side | long | String | true | long | short | \- |

## توضیحات Response-Body

```json
{
  "result": {
    "collateral": {
      "min": "حداقل وثیقه",
      "max": "حداکثر وثیقه"
    },
    "loan": {
      "value": "ارزش وام",
      "currency": "ارز"
    }
  },
  "success": "موفقیت آمیز بودن درخواست"
}
```


====================================
FILE: margin-dry-run.md
SOURCE: https://developers.wallex.ir/docs/margin-dry-run
====================================

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


====================================
FILE: margin-open-position.md
SOURCE: https://developers.wallex.ir/docs/margin-open-position
====================================

---
title: "باز کردن موقعیت تعهدی"
source: https://developers.wallex.ir/docs/margin-open-position
---

# باز کردن موقعیت تعهدی

## ایجاد موقعیت مارجین

شما میتوانید با استفاده از API زیر موقعیت تعهدی جدیدی باز کنید.

```curl
POST /margin-trade/v1/positions
```

## توضیحات Request-Body

برای فراخوانی این API باید اطلاعات زیر را به‌صورت JSON در Request-Body ارسال کنید:

| Parameter | Example | Data Type | Required | Valid Values | Definition |
| --- | --- | --- | --- | --- | --- |
| collateral | "300000" | String | true | — | میزان وثیقه درخواستی برای ایجاد موقعیت تعهدی |
| market | "BTCUSDT" | String | true | — | مارکتی که قصد دارید در آن موقعیت تعهدی ایجاد کنید |
| open\_price | "8900000" | String | true | — | قیمتی که در آن پوزیشن معامله تعهدی ایجاد می‌شود |
| risk\_coef | "10" | String | true | — | نسبت اعتباری که قصد دارید دریافت کنید |
| side | long | String | true | long | short | — |
| stop\_loss | "86000" | String | false | — | میزان حد ضرر که موقعیت تعهدی در آن بسته شود |
| take\_profit | "86000" | String | false | — | میزان حد سود که موقعیت تعهدی در آن بسته شود |

## توضیحات Response-Body

```json
{
  "result": {
    "call_price": "حد هشدار",
    "close_reason": "علت بستن ",
    "collateral": "وثیقه",
    "created_at": " زمان ایجاد سفارش",
    "expires_at": "تاریخ منقضی شدن",
    "extend_time": "زمان تمدید",
    "first_order_filled": " اولین سفارش انجام شده",
    "id": " ایدی سفارش",
    "interest": "کارمزد",
    "is_called": "به حد هشدار رسیده است یا خیر",
    "liquidity_price": "قیمت لیکوییدشدن",
    "loan": "وام",
    "market": "نام جفت ارز",
    "max_age": "حداکثر عمرموقعیت",
    "open_filled_price": "قیمت باز شدن سفارش",
    "open_price": "قیمت واحد",
    "opened_at": "زمانی که موقعیت ایجاد شده",
    "profit": "میزان سود یا ضرر",
    "risk_coef": "نسبت اعتبار",
    "side": " لانگ/شورت",
    "state": "وضعیت سفارش",
    "updated_at": "نمایش دهنده زمان بروزرسانی وثیقه یا حد سود و ضرر",
    "success": "موفقیت آمیز بودن درخواست"
  }
}
```


====================================
FILE: margin-get-positions.md
SOURCE: https://developers.wallex.ir/docs/margin-get-positions
====================================

---
title: "دریافت موقعیت‌های تعهدی"
source: https://developers.wallex.ir/docs/margin-get-positions
---

# دریافت موقعیت‌های تعهدی

شما میتوانید با استفاده از API زیر، موقعیت‌های تعهدی خود را مشاهده کنید. همچنین با استفاده از فیلترهای مختلف میتوانید نتایج دلخواه خود را فیلتر کنید. توجه داشته باشید تمامی فیلترها را باید به‌صورت Query-parameters ارسال کنید

```curl
GET /margin-trade/v1/positions
```

## توضیحات Query-parameters

برای فراخوانی این API میتوانید پارارمترهای مختلف خود را به عنوان Query-parameters در مسیر API ارسال کنید :

| Parameter | Example | Data Type | Required | Valid Values | Definition |
| --- | --- | --- | --- | --- | --- |
| active | true | boolean | false | true | false | با ارسال این Query-parameter میتوانید موقعیت‌های خود را بر اساس فعال یا غیرفعال بودن فیلتر کنید |
| position\_side | long | String | false | long | short | با ارسال این Query-parameter میتوانید موقعیت‌های خود را بر اساس long یا short بودن فیلتر کنید |
| market | BTCUSDT | String | false | — | با ارسال این Query-parameter میتوانید موقعیت‌های خود را بر اساس مارکت آن‌ها فیلتر کنید |

## توضیحات Response-Body

```json
{
  "result": {
    "call_price": "حد هشدار",
    "close_filled_price": "قیمت بسته شدن",
    "close_price": "قیمت بستن",
    "close_reason": "علت بستن",
    "closed_at": "زمان بسته شدن",
    "collateral": {
      "currency": "ارز",
      "value": "ارزش وثیقه"
    },
    "created_at": " زمان ساختن سفارش",
    "expires_at": "تاریخ منقضی شدن",
    "extend_time": "(هر ۴ ساعت)",
    "first_order_filled": " اولین سفارش پوزیشن ب فیلد شدن آن",
    "id": " ایدی سفارش",
    "interest": {
      "currency": "ارز",
      "value": " ارزش کارمزد"
    },
    "is_called": "به حد هشدار رسیده است یا خیر",
    "liquidity_price": "قیمت لیکوییدیتی",
    "loan": {
      "currency": "ارز",
      "value": "ارزش وام"
    },
    "market": "نام جفت ارز",
    "max_age": "حداکثر عمرموقعیت",
    "open_filled_price": "قیمت باز شدن سفارش",
    "open_price": "قیمت واحد",
    "opened_at": "زمانی که موقعیت ایجاد شده",
    "profit": {
      "currency": "ارز",
      "value": "ارزش سود و ضرر"
    },
    "profit_percentage": "درصد سود و ضرر",
    "risk_coef": "میزان اعتبار",
    "side": "لانگ / شورت",
    "state": "وضعیت سفارش",
    "stop_loss": "حد ضرر",
    "take_profit": "حد سود",
    "updated_at": "نمایش دهنده زمان بروزرسانی وثیقه یا حد سود و ضرر",
    "success": "موفقیت آمیز بودن درخواست"
  }
}
```


====================================
FILE: margin-edit-collateral.md
SOURCE: https://developers.wallex.ir/docs/margin-edit-collateral
====================================

---
title: "ویرایش وثیقه موقعیت تعهدی"
source: https://developers.wallex.ir/docs/margin-edit-collateral
---

# ویرایش وثیقه موقعیت تعهدی

شما می‌توانید با استفاده از API زیر، میزان وثیقه موقعیت تعهدی خود را به‌روزرسانی کنید.  
به یاد داشته باشید که به منظور این کار باید id موقعیت تعهدی که در [زمان ساخت](margin-open-position.md) دریافت کردید را به عنوان Path-Variable ارسال کنید

```curl
PATCH /margin-trade/v1/positions/{id}/collateral
```

## توضیحات Request-Body

برای فراخوانی این API باید اطلاعات زیر را به‌صورت JSON در Request-Body ارسال کنید:

| Parameter | Example | Data Type | Required | Definition |
| --- | --- | --- | --- | --- |
| change | "82494" | String | true | میزان مبلغ درخواستی برای افزایش وثیقه |

## توضیحات Path-Variable

برای فراخوانی این API باید ID موقعیت تعهدی خود را در Path-Variable ارسال کنید

| Parameter | Example | Data Type | Required | Definition |
| --- | --- | --- | --- | --- |
| id | "10" | number | true | هر موقعیت تعهدی یک ID یکتا دارد که برای افزایش وثیقه باید در این API ارسال شود |

## توضیحات Response-Body

```json
{
  "result": {
    "call_price": "حد هشدار",
    "close_filled_price": "قیمت بسته شدن",
    "close_price": "قیمت بستن",
    "close_reason": "علت بستن",
    "closed_at": "زمان بسته شدن",
    "collateral": {
      "currency": "ارز",
      "value": "ارزش وثیقه"
    },
    "created_at": " زمان ایجاد سفارش",
    "expires_at": "زمان منقضی شدن",
    "extend_time": "زمان تمدید",
    "first_order_filled": "اولین سفارش انجام شده",
    "id": " ایدی سفارش",
    "interest": {
      "currency": "ارز",
      "value": "ارزش کارمزد"
    },
    "is_called": "به حد هشدار رسیده است یا خیر",
    "liquidity_price": "قیمت لیکوییدیتی",
    "loan": {
      "currency": "ارز",
      "value": "ارزش وام",
      "market": "نام جفت ارز",
      "max_age": "حداکثر عمر موقعیت",
      "open_filled_price": "قیمت باز شدن سفارش",
      "open_price": "قیمت واحد",
      "opened_at": "زمان ایجاد سفارش",
      "profit": {
        "currency": "ارز",
        "value": "ارزش سود و ضرر"
      },
      "profit_percentage": "درصد سود و ضرر",
      "risk_coef": "میزان اعتبار",
      "side": "لانگ / شورت",
      "state": "وضعیت سفارش",
      "stop_loss": "حد ضرر",
      "take_profit": "حد سود",
      "updated_at": "نمایش دهنده زمان بروزرسانی وثیقه یا حد سود و ضرر",
      "success": "وموفقیت آمیز بودن درخواست"
    }
  }
}
```


====================================
FILE: margin-sltp-edit.md
SOURCE: https://developers.wallex.ir/docs/margin-sltp-edit
====================================

---
title: "ویرایش حد سود و ضرر"
source: https://developers.wallex.ir/docs/margin-sltp-edit
---

# ویرایش حد سود و ضرر

## ویرایش حد سود و حد ضرر موقعیت تعهدی

با استفاده از این API می‌توانید قیمت‌های حد ضرر (Stop-Loss) و حد سود (Take-Profit) موقعیت تعهدی خود را به‌روزرسانی کنید.  
به یاد داشته باشید که به منظور این کار باید id موقعیت تعهدی که در [زمان ساخت](margin-open-position.md) دریافت کردید را به عنوان Path-Variable ارسال کنید

```curl
PATCH /margin-trade/v1/positions/{id}/sltp
```

## توضیحات Request-Body

برای فراخوانی این API باید اطلاعات زیر را به‌صورت JSON در Request-Body ارسال کنید:

| Parameter | Example | Data Type | Required | Definition |
| --- | --- | --- | --- | --- |
| stop\_loss | "82494" | String | false | میزان حد ضرر مشخص شده برای موقعیت تعهدی |
| take\_profit | "82494" | String | false | میزان حد سود مشخص شده برای موقعیت تعهدی |

## توضیحات Path-Variable

برای فراخوانی این API باید ID موقعیت تعهدی خود را در Path-Variable ارسال کنید

| Parameter | Example | Data Type | Required | Definition |
| --- | --- | --- | --- | --- |
| id | "10" | number | true | هر موقعیت تعهدی یک ID یکتا دارد که برای تغییر حد سود یا ضرر باید در این API ارسال شود |

## توضیحات Response-Body

```json
{
  "result": {
    "call_price": "حد هشدار",
    "close_filled_price": "قیمت بسته شدن سفارش",
    "close_price": "قیمت بسته شدن",
    "close_reason": "علت بستن",
    "closed_at": "زمان بسته شدن",
    "collateral": {
      "currency": "ارز",
      "value": "ارزش وثیقه"
    },
    "created_at": " زمان ساختن سفارش",
    "expires_at": "تاریخ منقضی شدن",
    "extend_time": "(هر ۴ ساعت)",
    "first_order_filled": " اولین سفارش پوزیشن ب فیلد شدن آن",
    "id": " ایدی سفارش",
    "interest": {
      "currency": "ارز",
      "value": "ارزش کارمزد"
    },
    "is_called": "به حد هشدار رسیده است یا خیر",
    "liquidity_price": "قیمت لیکوییدیتی",
    "loan": {
      "currency": "ارز",
      "value": "ارزش وام"
    },
    "market": "نام جفت ارز",
    "max_age": "حداکثر عمرموقعیت",
    "open_filled_price": "قیمت باز شدن سفارش",
    "open_price": "قیمت واحد",
    "opened_at": "زمانی که موقعیت ایجاد شده",
    "profit": {
      "currency": "ارز",
      "value": "ارزش سود و ضرر"
    },
    "profit_percentage": "درصد سود و ضرر",
    "risk_coef": "میزان اعتبار",
    "side": "لانگ / شورت",
    "state": "وضعیت سفارش",
    "stop_loss": "حد ضرر",
    "take_profit": "حد سود",
    "updated_at": "نمایش دهنده زمان بروزرسانی وثیقه یا حد سود و ضرر"
  },
  "success": "موفقیت آمیز بودن درخواست"
}
```


====================================
FILE: margin-close-position.md
SOURCE: https://developers.wallex.ir/docs/margin-close-position
====================================

---
title: "بستن موقعیت"
source: https://developers.wallex.ir/docs/margin-close-position
---

# بستن موقعیت

## بستن موقعیت تعهدی

درصورتی که قصد بستن موقعیت تعهدی خود در قیمت مشخص را دارید میتوانید از API زیر استفاده کنید.  
به یاد داشته باشید که به منظور این کار باید id موقعیت تعهدی که در [زمان ساخت](margin-open-position.md) دریافت کردید را به عنوان Path-Variable ارسال کنید

```curl
PATCH /margin-trade/v1/positions/{id}/close
```

## توضیحات Request-Body

برای فراخوانی این API باید اطلاعات زیر را به‌صورت JSON در Request-Body ارسال کنید:

| Parameter | Example | Data Type | Required | Definition |
| --- | --- | --- | --- | --- |
| price | "82494" | String | true | قیمت واحدی که قصد دارید موقعیت تعهدی خود را ببندید |

## توضیحات Path-Variable

برای فراخوانی این API باید ID موقعیت تعهدی خود را در Path-Variable ارسال کنید

| \` | Parameter | Example | Data Type | Required / Optional | Definition |
| --- | --- | --- | --- | --- | --- |
| id | "10" | number | Required | هر موقعیت تعهدی یک ID یکتا دارد که برای بستن موقعیت تعهدی باید در این API ارسال شود |  |

## توضیحات Response-Body

```json
{
  "result": {
    "call_price": "حد هشدار",
    "close_filled_price": "قیمت بسته سفارش",
    "close_price": "قیمت بسته شدن",
    "close_reason": "علت بستن",
    "closed_at": "زمان بسته شدن",
    "collateral": {
      "currency": " ارز",
      "value": "ارزش وثیقه",
      "created_at": " زمان ساختن سفارش",
      "expires_at": "تاریخ منقضی شدن",
      "extend_time": "زمان تمدید",
      "first_order_filled": " اولین سفارش انجام شده",
      "id": " ایدی سفارش",
      "interest": {
        "currency": "ارز",
        "value": "ارزش کارمزد"
      },
      "is_called": "به حد هشدار رسیده است یا خیر",
      "liquidity_price": "قیمت لیکوییدیتی",
      "loan": {
        "currency": "ارز",
        "value": " ارزش وام"
      },
      "market": "نام جفت ارز",
      "max_age": "حداکثر عمرموقعیت",
      "open_filled_price": "قیمت باز شدن سفارش",
      "open_price": "قیمت واحد",
      "opened_at": "زمانی که موقعیت ایجاد شده",
      "profit": {
        "currency": "ارز",
        "value": "ارزش سود و ضرر"
      },
      "profit_percentage": "درصد سود و ضرر",
      "risk_coef": "میزان اعتبار",
      "side": "لانگ / شورت",
      "state": "وضعیت سفارش",
      "stop_loss": "حد ضرر",
      "take_profit": "حد سود",
      "updated_at": "نمایش دهنده زمان بروزرسانی وثیقه یا حد سود و ضرر"
    },
    "success": "موفقیت آمیز بودن درخواست"
  }
}
```


====================================
FILE: generated-get-positions.md
SOURCE: https://developers.wallex.ir/docs/generated/get-positions
====================================

---
title: "List margin positions"
source: https://developers.wallex.ir/docs/generated/get-positions
---

# List margin positions

```
GET /margin-trade/v1/positions
```

List margin positions

## Request

## Responses

-   200
-   408
-   500

scheme of `result` field in success response

Request time out

Internal server error


====================================
FILE: generated-open-position.md
SOURCE: https://developers.wallex.ir/docs/generated/open-position
====================================

---
title: "Open a margin position"
source: https://developers.wallex.ir/docs/generated/open-position
---

# Open a margin position

```
POST /margin-trade/v1/positions
```

Open a margin position

## Request

## Responses

-   200
-   408
-   500

scheme of `result` field in success response

Request time out

Internal server error


====================================
FILE: generated-get-position-id.md
SOURCE: https://developers.wallex.ir/docs/generated/get-position-id
====================================

---
title: "Get a margin position"
source: https://developers.wallex.ir/docs/generated/get-position-id
---

# Get a margin position

```
GET /margin-trade/v1/positions/:id
```

Get a margin position

## Request

## Responses

-   200
-   404
-   408
-   500

scheme of `result` field in success response

Not Found

Request time out

Internal server error


====================================
FILE: generated-close-position-id.md
SOURCE: https://developers.wallex.ir/docs/generated/close-position-id
====================================

---
title: "Close a margin position"
source: https://developers.wallex.ir/docs/generated/close-position-id
---

# Close a margin position

```
PATCH /margin-trade/v1/positions/:id/close
```

Close a margin position

## Request

## Responses

-   200
-   404
-   408
-   500

scheme of `result` field in success response

Not Found

Request time out

Internal server error


====================================
FILE: generated-edit-colateral.md
SOURCE: https://developers.wallex.ir/docs/generated/edit-colateral
====================================

---
title: "Update margin positions collateral"
source: https://developers.wallex.ir/docs/generated/edit-colateral
---

# Update margin positions collateral

```
PATCH /margin-trade/v1/positions/:id/collateral
```

Update margin positions collateral

## Request

## Responses

-   200
-   404
-   408
-   500

scheme of `result` field in success response

Not Found

Request time out

Internal server error


====================================
FILE: generated-profit-position-id.md
SOURCE: https://developers.wallex.ir/docs/generated/profit-position-id
====================================

---
title: "Calculate"
source: https://developers.wallex.ir/docs/generated/profit-position-id
---

# Calculate

```
POST /margin-trade/v1/positions/:id/profit
```

Calculate

## Request

## Responses

-   200
-   404
-   408
-   500

scheme of `result` field in success response

Not Found

Request time out

Internal server error


====================================
FILE: generated-edit-sltp.md
SOURCE: https://developers.wallex.ir/docs/generated/edit-sltp
====================================

---
title: "Update stop-loss and take-profit prices"
source: https://developers.wallex.ir/docs/generated/edit-sltp
---

# Update stop-loss and take-profit prices

```
PATCH /margin-trade/v1/positions/:id/sltp
```

Update stop-loss and take-profit prices

## Request

## Responses

-   200
-   404
-   408
-   500

scheme of `result` field in success response

Not Found

Request time out

Internal server error


====================================
FILE: generated-calculate-loan.md
SOURCE: https://developers.wallex.ir/docs/generated/calculate-loan
====================================

---
title: "calculate min, max Collateral and loan"
source: https://developers.wallex.ir/docs/generated/calculate-loan
---

# calculate min, max Collateral and loan

```
POST /margin-trade/v1/public/loan
```

calculate min, max Collateral and loan

## Request

## Responses

-   200
-   408
-   500

scheme of `result` field in success response

Request time out

Internal server error


====================================
FILE: generated-detailed-information.md
SOURCE: https://developers.wallex.ir/docs/generated/detailed-information
====================================

---
title: "info a margin position before creation"
source: https://developers.wallex.ir/docs/generated/detailed-information
---

# info a margin position before creation

```
POST /margin-trade/v1/public/dry-run
```

info a margin position before creation

## Request

## Responses

-   200
-   408
-   500

scheme of `result` field in success response

Request time out

Internal server error


====================================
FILE: generated-public-ratio.md
SOURCE: https://developers.wallex.ir/docs/generated/public-ratio
====================================

---
title: "Positions Ratio of long and short"
source: https://developers.wallex.ir/docs/generated/public-ratio
---

# Positions Ratio of long and short

```
GET /margin-trade/v1/public/ratio/:market
```

Positions Ratio of long and short

## Request

## Responses

-   200
-   408
-   500

scheme of `result` field in success response

Request time out

Internal server error


====================================
FILE: generated-get-levels.md
SOURCE: https://developers.wallex.ir/docs/generated/get-levels
====================================

---
title: "margin trade user levels"
source: https://developers.wallex.ir/docs/generated/get-levels
---

# margin trade user levels

```
GET /margin-trade/v1/user/levels
```

margin trade user levels

## Responses

-   200
-   408
-   500

scheme of `result` field in success response

Request time out

Internal server error


====================================
FILE: generated-get-levels-market.md
SOURCE: https://developers.wallex.ir/docs/generated/get-levels-market
====================================

---
title: "margin trade user levels"
source: https://developers.wallex.ir/docs/generated/get-levels-market
---

# margin trade user levels

```
GET /margin-trade/v1/user/levels/:market
```

margin trade user levels

## Request

## Responses

-   200
-   408
-   500

scheme of `result` field in success response

Request time out

Internal server error


====================================
FILE: generated-get-pnl.md
SOURCE: https://developers.wallex.ir/docs/generated/get-pnl
====================================

---
title: "User PNL"
source: https://developers.wallex.ir/docs/generated/get-pnl
---

# User PNL

```
GET /margin-trade/v1/user/pnl
```

User PNL

## Responses

-   200
-   408
-   500

scheme of `result` field in success response

Request time out

Internal server error


====================================
FILE: trade-credit-intro.md
SOURCE: https://developers.wallex.ir/docs/trade-credit-intro
====================================

---
title: "اعتبار معاملاتی چیست؟"
source: https://developers.wallex.ir/docs/trade-credit-intro
---

# اعتبار معاملاتی چیست؟

اعتبار معاملاتی یک روش دریافت اعتبار است که نسبت به دارایی اولیه و با در نظر داشتن ضریب ریسک میتوانید از طرح های موجود اعتبار دریافت کنید.  
این اعتبار به دو روش ریالی و تتری پرداخت می شود و با مجموع دارایی ورودی و اعتبار دریافتی میتوانید در بازار های فعال اسپات ، معامله آنی و تبدیل به معامله بپردازید.

## نکات مهم

-   توجه داشته باشید که هر اکانت اعتبار معاملاتی کاملا مجزا از اکانت اصلی و سایر اکانت های اعتبار معاملاتی میباشد.
    -   هر اکانت اعتبار معاملاتی کیف پول مجزا دارد.
    -   هر اکانت اعتبار معاملاتی API-Key مجزا دارد.
    -   تاریخچه سفارش‌های اکانت اعتبار معاملاتی نیز مجزا از سایر اکانت ها میباشد.

## دانلود Swagger اعتبار معاملاتی

تمامی API هایی که نحوه ارسال درخواست به آن ها در ادامه گفته میشود را میتوانید از طریق لینک زیر دانلود کنید

[دانلود Swagger اعتبار معاملاتی](/assets/files/trade-credit-ff5c60b5b97b77a5b2c2e4800f07729c.yaml)


====================================
FILE: trade-credit-types.md
SOURCE: https://developers.wallex.ir/docs/trade-credit-types
====================================

---
title: "اصطلاحات اعتبار معاملاتی"
source: https://developers.wallex.ir/docs/trade-credit-types
---

# اصطلاحات اعتبار معاملاتی

## دارایی ورودی:

مقدار موجودی که به صورت تومان یا تتر جهت فعال سازی طرح مورد نظر استفاده میکنید.  
این مقدار دارایی در طرحی که فعال شده قابل معامله است.  
در صورت ضرر کردن، زمان بستن طرح ، به میزان ضرر از مقدار دارایی ورودی کسر خواهد شد

## اعتبار:

مقدار اعتباری که از والکس میتوانید دریافت کنید و با آن معامله انجام دهید.

## مدت طرح:

مدت زمان تمام طرح ها ۳۰ روز است.  
طرح بعد از ۳۰ روز به‌صورت اتوماتیک بسته میشود.  
در صورتی که قصد دارید بیشتر از ۳۰ روز طرح مورد نظر را فعال نگه دارید ، میتوانید طرح خود را تمدید کنید

## کارمزد اعتبار:

برای استفاده از اعتبار معاملاتی ، به ازای هر روزی که از طرح شما سپری میشود کارمزد روزانه پرداخت میکنید.

## حد هشدار:

حد هشدار قیمتی است که در زمان فعال سازی پکیج به شما نمایش داده می شود.  
زمانی که پکیج فعال شده به حد هشدار برسد ، کاربران میتوانند به منظور جلوگیری از لیکویید شدن پکیج مورد نظر را ببندند یا نسبت به افزایش وثیقه خود اقدام کنند

## حد لیکوییدی:

حد لیکوییدی قیمتی است که در زمان فعال سازی پکیج به شما نمایش داده میشود.  
زمانی که ارزش پکیج فعال شده به حد لیکوییدی برسد ، پکیج به‌صورت اتوماتیک بسته میشود.

## اتصال به کیف پول:

با فعالسازی اتصال کیف پول ، زمانی که ارزش دارایی پکیج فعال شده به زیر حد هشدار برسد ، به منظور جلوگیری از لیکوییدی ، دارایی به‌صورت اتوماتیک از کیف پول اصلی به اکانت اعتبار معاملاتی واریز میشود.

## انتقال دارایی:

از این قسمت میتوانید هر نوع دارایی که در کیف پول اصلی دارید به طرح فعال انتقال دهید

## تمدید طرح:

۵ روز قبل از زمان اتمام طرح فرصت دارید که نسبت به تمدید اکانت اعتبار معاملاتی خود اقدام کنید.


====================================
FILE: trade-credit-active-packages.md
SOURCE: https://developers.wallex.ir/docs/trade-credit-active-packages
====================================

---
title: "پکیج‌های فعال اعتبار معاملاتی"
source: https://developers.wallex.ir/docs/trade-credit-active-packages
---

# پکیج‌های فعال اعتبار معاملاتی

## پکیج های فعال اعتبار معاملاتی والکس

به منظور ایجاد اکانت اعتبار معاملاتی و استفاده از پکیج های اعتبار معاملاتی والکس ، میتوانید با استفاده از API زیر لیست پکیج های فعال والکس را دریافت کنید.  
حتما توجه داشته باشید که STATUS پکیج ها ACTIVE باشد.

```curl
GET /v1/prop/packages
```

## توضیحات Response-Body

```json
{
  "result": {
    "id": "شناسه پکیج",
    "title": "نام پکیج",
    "currency": "ارز پایه",
    "destination_currency": "ارز مقصد",
    "assurance": "وثیقه مورد نیاز برای دریافت اعتبار",
    "loan": "میزان اعتبار دریافتی",
    "warning_limit": "حد هشدار",
    "liquidity_limit": "حد لیکویید شدن",
    "status": "وضعیت پکیج فعال/غیر فعال",
    "expire_days": "تعداد روز منقضی شدن پکیج",
    "dark_image_url": "حالت تاریک",
    "light_image_url": "حالت روشن",
    "daily_fee": "کارمزد روزانه",
    "daily_fee_discount": " تخفیف کارمزد",
    "daily_fee_after_discount": "کارمزد روزانه بعد از کسر تخفیف",
    "final_fee": "کارمزد نهایی",
    "final_fee_discount": "تخفیف کارمزد نهایی",
    "final_fee_after_discount": "کارمزد نهایی بعد از کسر تخفیف",
    "usage_count_step": "تعداد دفعاتی که پکیج فعال شده"
  }
}
```


====================================
FILE: trade-credit-package-details.md
SOURCE: https://developers.wallex.ir/docs/trade-credit-package-details
====================================

---
title: "دریافت جزیيات پکیج و لیست بازارهای غیر فعال"
source: https://developers.wallex.ir/docs/trade-credit-package-details
---

# دریافت جزیيات پکیج و لیست بازارهای غیر فعال

به منظور بررسی جزییات پکیج میتوانید API زیر را فراخوانی کنید در این API علاوه بر جزئیات پکیج ، لیست بازارهایی را که نمی‌توانید با استفاده از اکانت اعتبار معاملاتی به معامله بپردازید را میتوانید دریافت کنید

```curl
GET /v1/prop/packages/{id}
```

## توضیحات Path-Variable

به منظور استفاده از این API جهت دریافت جزئیات پکیج باید ID پکیج مورد نظر را به عنوان Path-Variable ارسال کنید. نحوه دریافت ID پکیج ها در [پکیج های اعتبار مهاملاتی والکس](trade-credit-active-packages.md) آموزش داده شده است.

| Parameter | Example | Data Type | Required | Definition |
| --- | --- | --- | --- | --- |
| id | "10" | Number | true | شناسه یکتای پکیج اعتبار معاملاتی |

## توضیحات Response-Body

```json
{
  "result": {
    "detail": {
      "id": "شناسه پکیج",
      "title": "نام پکیج",
      "currency": "ارز پایه",
      "destination_currency": "ارز مقصد",
      "assurance": "وثیقه مورد نیاز برای دریافت اعتبار",
      "loan": "میزان اعتبار دریافتی",
      "warning_limit": "حد هشدار",
      "liquidity_limit": "حد لیکویید شدن",
      "status": "وضعیت پکیج فعال/غیر فعال",
      "expire_days": "تعداد روز منقضی شدن پکیج",
      "dark_image_url": "حالت تاریک",
      "light_image_url": "حالت روشن",
      "daily_fee": "کارمزد روزانه",
      "daily_fee_discount": "تخفیف کارمزد",
      "daily_fee_after_discount": "کارمزد روزانه بعد از کسر تخفیف",
      "final_fee": "کارمزد نهایی",
      "final_fee_discount": "تخفیف کارمزد نهایی",
      "final_fee_after_discount": "کارمزد نهایی بعد از کسر تخفیف",
      "usage_count_step": "تعداد دفعاتی که پکیج فعال شده"
    },
    "unavailableMarkets": [
      " بازار های غیر فعال"
    ]
  }
}
```


====================================
FILE: trade-credit-condition-check.md
SOURCE: https://developers.wallex.ir/docs/trade-credit-condition-check
====================================

---
title: "بررسی شرایط کاربر برای دریافت اعتبار معاملاتی"
source: https://developers.wallex.ir/docs/trade-credit-condition-check
---

# بررسی شرایط کاربر برای دریافت اعتبار معاملاتی

برای دریافت اعتبار معاملاتی ، کاربران باید شروط زیر را داشته باشند:

-   سطح احراز هویت کافی
-   داشتن دارایی کافی در کیف پول کاربر جهت وثیقه برای دریافت اعتبار معاملاتی.  
    برای بررسی این موارد میتوانید از API زیر استفاده کنید.

به یاد داشته باشید که به منظور این کار باید id پکیج مورد نیاز را که در [پکیج های فعال والکس](trade-credit-active-packages.md) دریافت کردید، به عنوان Path-Variable ارسال کنید

```curl
GET /v1/prop/user/packages/{id}/check-availability
```

## توضیحات Path-Variable

برای فراخوانی این API باید ID موقعیت تعهدی خود را در Path-Variable ارسال کنید

| Parameter | Example | Data Type | Required | Definition |
| --- | --- | --- | --- | --- |
| id | "10" | number | true | هر پکیج اعتبار معاملاتی یک ID یکتا دارد که برای بررسی شروط کاربر برای دریافت اعتبار معاملاتی باید در این API ارسال شود |

## توضیحات Response-Body

```json
{
  "result": [
    {
      "key": "سطح کاربری ",
      "isValid": "سطح احراز هویت مورد تایید است یا خیر"
    },
    {
      "key": "مقدار موجودی",
      "isValid": "وضعیت میزان دارایی کاربر در کیف پول جهت دریافت اعتبار معاملاتی"
    }
  ]
}
```


====================================
FILE: trade-credit-activate-sub-account.md
SOURCE: https://developers.wallex.ir/docs/trade-credit-activate-sub-account
====================================

---
title: "فعال کردن پکیج اعتبار معاملاتی"
source: https://developers.wallex.ir/docs/trade-credit-activate-sub-account
---

# فعال کردن پکیج اعتبار معاملاتی

جهت فعال کردن پکیج اعتباری و ساخت اکانت اعتبار معاملاتی ، میتوانید از API زیر استفاده کنید.  
توجه داشته باشید که باید prop\_package\_id را در Request-Body ارسال کنید.  
این شناسه در Response-Body [پکیج های اعتبار معاملاتی والکس](trade-credit-active-packages.md) قابل مشاهده میباشد.

```curl
POST /v1/prop/user/packages
```

## توضیحات Request-Body

برای فراخوانی این API باید اطلاعات زیر را به‌صورت JSON در Request-Body ارسال کنید:

| Parameter | Example | Data Type | Required | Definition |
| --- | --- | --- | --- | --- |
| prop\_package\_id | "130" | String | true | شناسه یکتای هر پکیج فعال اعتبار معاملاتی والکس |

## توضیحات Response-Body

```json
{
  "message": "پیام موفقیت آمیز ساخت اکانت اعتبار معاملاتی",
  "result": {
    "clientId": "شناسه حساب فرعی ",
    "createdAt": "زمان ایجاد اکانت اعتبار معاملاتی",
    "darkAvatarUrl": "حالت تاریک",
    "isActive": "وضعیت فعال بودن اکانت اعتبار معاملاتی",
    "isSuspend": "وضعیت تعلیق پکیج",
    "lightAvatarUrl": "حالت روشن",
    "title": "نام پکیج دریافتی",
    "type": "نوع حساب",
    "userId": "شناسه کاربری "
  },
  "success": "موفقیت آمیز بودن درخواست"
}
```


====================================
FILE: trade-credit-connect-wallet.md
SOURCE: https://developers.wallex.ir/docs/trade-credit-connect-wallet
====================================

---
title: "اتصال کیف پول اصلی به اکانت اعتبار معاملاتی"
source: https://developers.wallex.ir/docs/trade-credit-connect-wallet
---

# اتصال کیف پول اصلی به اکانت اعتبار معاملاتی

برای متصل کردن کیف پول اصلی به اکانت اعتبار معاملاتی میتوانید از API زیر استفاده کنید.  
به یاد داشته باشید که به منظور این کار باید id اکانت اعتبار معاملاتی خود را که در [زمان ساخت](trade-credit-activate-sub-account.md) دریافت کردید را در Request-Header ارسال کنید

```curl
POST /v1/prop/user/packages/connect-to-wallet
```

## توضیحات Request-Body

برای فراخوانی این API باید اطلاعات زیر را به‌صورت JSON در Request-Body ارسال کنید:

| Parameter | Example | Data Type | Required | Valid Values | Definition |
| --- | --- | --- | --- | --- | --- |
| credit | "30000" | String | true | — | مبلغ در هر انتقال (اگر پکیج دریافتی بر پایه تومان باشد، 30000 تومان در هر انتقال منتقل می‌شود) |
| currency | "TMN" | String | true | TMN | USDT | واحد انتقال (در پکیج‌های تومانی واحد انتقال باید تومانی باشد و در پکیج‌های تتری واحد انتقال باید تتر باشد) |
| usageCount | 3 | Number | true | — | حداکثر تعداد دفعات انتقال |

## توضیحات Request-Header

| Parameter | Example | Data Type | Required | Definition |
| --- | --- | --- | --- | --- |
| sub\_account\_client\_id | "test-123" | String | true | id اکانت اعتبار معاملاتی |

## توضیحات Response-Body

```json
{
  "message": "اتصال کیف پول با موفقیت انجام شد",
  "result": {
    "credit": "مقدار انتقال",
    "currency": "ارز پایه",
    "status": "وضعیت",
    "usageCount": "تعداد دفعات انتقال",
    "usedCount": "تعداد انتقال های انجام شده"
  },
  "success": "موفقیت آمیز بودن درخواست"
}
```


====================================
FILE: trade-credit-disconnect-wallet.md
SOURCE: https://developers.wallex.ir/docs/trade-credit-disconnect-wallet
====================================

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


====================================
FILE: trade-credit-close-sub-account.md
SOURCE: https://developers.wallex.ir/docs/trade-credit-close-sub-account
====================================

---
title: "بستن اکانت اعتبار معاملاتی"
source: https://developers.wallex.ir/docs/trade-credit-close-sub-account
---

# بستن اکانت اعتبار معاملاتی

برای بستن اکانت اعتبار معاملاتی خود میتوانید از API زیر استفاده کنید.  
به یاد داشته باشید که به منظور این کار باید id اکانت اعتبار معاملاتی خود را که در [زمان ساخت](trade-credit-activate-sub-account.md) دریافت کردید را در Request-Header ارسال کنید

```curl
DELETE /v1/prop/user/packages
```

## توضیحات Request-Header

| Parameter | Example | Data Type | Required / Optional | Definition |
| --- | --- | --- | --- | --- |
| sub\_account\_client\_id | "test-123" | String | Required | id اکانت اعتبار معاملاتی |

## توضیحات Response-Body

```json
{
  "result": {
    "client_id": "شناسه حساب فرعی",
    "start_balance": "دارایی اولیه طرح",
    "final_balance": "دارایی باقی مانده طرح",
    "final_balance_without_transfers": "دارایی باقی مانده بدون در نظر گرفتن انتقال ها",
    "currency": "ارز پایه",
    "prop_package_id": " شناسه پکیج",
    "user_id": "شناسه کاربر"
  }
}
```


====================================
FILE: trade-credit-sub-account-history.md
SOURCE: https://developers.wallex.ir/docs/trade-credit-sub-account-history
====================================

---
title: "دریافت تاریخچه طرح های اعتبار معاملاتی"
source: https://developers.wallex.ir/docs/trade-credit-sub-account-history
---

# دریافت تاریخچه طرح های اعتبار معاملاتی

برای دریافت تاریخچه های طرح های اعتبار معاملاتی میتوانید از API زیر استفاده کنید.

```curl
GET /v1/prop/user/packages/history
```

## توضیحات Response-Body

```json
{
  "result": [
    {
      "user_id": "شناسه کاربر",
      "client_id": "شناسه حساب فرعی",
      "package_title": "نام پکیج",
      "dark_image_url": "حالت تاریک",
      "light_image_url": "حالت روشن",
      "currency": "ارز پایه",
      "destination_currency": "ارز مقصد",
      "assurance": "وثیقه",
      "loan": "مقدار اعتبار",
      "final_balance": "دارایی نهایی",
      "final_balance_without_transfers": "دارایی نهایی بدون محاسبه انتقال ها",
      "start_balance": "دارایی اولیه",
      "warning_limit": "حد هشدار",
      "liquidity_limit": "حد لیکویید شدن",
      "created_at": "تاریخ فعال کردن پکیج",
      "finished_at": "تاریخ بستن پکیج",
      "expire_at": "تاریخ انقضای پکیج",
      "close_reason": "دلیل بستن پکیج",
      "status": "وضعیت پکیج",
      "expire_days": "تعداد روز  ها تا انقضای پکیج",
      "daily_fee": "کارمزد روزانه",
      "daily_fee_discount": "تخفیف روزانه کارمزد",
      "daily_fee_after_discount": "کارمزد روزانه بعد از کسر تخفیف",
      "final_fee": "کارمزد نهایی",
      "final_fee_discount": "تخفیف نهایی کارمزد",
      "final_fee_after_discount": "کارمزد نهایی بعد از کسر تخفیف",
      "open_days": " تعداد روز های فعال",
      "total_days": "مجموع روز های فعال",
      "applicable_daily_fee": "کارمزد روزانه قابل دریافت ",
      "applicable_daily_fee_discount": "تخفیف قابل کسر از کارمزد روزانه ",
      "applicable_daily_fee_after_discount": "کارمزد روزانه قابل دریافت بعد از تخفیف",
      "profit": "مقدار سود و ضرر",
      "profit_percentage": "درصد سود و ضرر",
      "final_assurance": "وثیقه نهایی",
      "final_payBack": "مبلغ نهایی باز پرداخت"
    }
  ]
}
```


====================================
FILE: trade-credit-active-sub-account-list.md
SOURCE: https://developers.wallex.ir/docs/trade-credit-active-sub-account-list
====================================

---
title: "لیست حساب های اعتبار معاملاتی"
source: https://developers.wallex.ir/docs/trade-credit-active-sub-account-list
---

# لیست حساب های اعتبار معاملاتی

برای دریافت لیست حساب های فرعی API زیر را فراخوانی می کنیم

```curl
GET /sub-accounts
```

## توضیحات Response-Body

```json
{
  "result": {
    "userId": "شناسه کاربری",
    "title": " نام پکیج",
    "darkAvatarUrl": "حالت تاریک",
    "lightAvatarUrl": "حالت روشن",
    "clientId": "شناسه حساب اعتبار معاملاتی",
    "isActive": "وضعیت فعال بودن",
    "type": "نوع حساب",
    "createdAt": "زمان ساخت حساب اعتبار معاملاتی",
    "isSuspend": " وضعیت معلق بودن"
  }
}
```


====================================
FILE: generated-active-sub-accounts-list.md
SOURCE: https://developers.wallex.ir/docs/generated/active-sub-accounts-list
====================================

---
title: "Active Sub Accounts List"
source: https://developers.wallex.ir/docs/generated/active-sub-accounts-list
---

# Active Sub Accounts List

```
GET /sub-accounts
```

# GET /sub-accounts

This endpoint retrieves the list of active sub-accounts.

## Headers

This request does not require any custom header.

## Request Body Parameters

This request does not require a request body.

## Query Parameters

This request does not require any query parameters.

## Response

-   `result` (array\[object\])
    
    -   `userId` (number)
        
    -   `title` (string)
        
    -   `darkAvatarUrl` (string)
        
    -   `lightAvatarUrl` (string)
        
    -   `clientId` (string)
        
    -   `isActive` (bool)
        
    -   `type` (string)
        
    -   `isSuspend` (bool)
        
    -   `createdAt` (string)
        
-   `message` (string)
    
-   `success` (boolean)
    
-   `result_info` (object)
    
    -   `page` (number)
        
    -   `per_page` (number)
        
    -   `count` (number)
        
    -   `total_count` (number)
        

## Example Response

```json
{
  "result": [
    {
      "userId": 0,
      "title": "تست اولیه عادی",
      "darkAvatarUrl": "https://s3.thr1.sotoon.ir/phinix-public-staging/packages/clHyoeip3vrFmJvxRbjMP42h8PYDSWcKeo0zkQZO.jpg",
      "lightAvatarUrl": "https://s3.thr1.sotoon.ir/phinix-public-staging/packages/clHyoeip3vrFmJvxRbjMP42h8PYDSWcKeo0zkQZO.jpg",
      "clientId": "CLIENTID",
      "isActive": true,
      "type": "prop",
      "createdAt": "2025-04-06T11:53:18Z",
      "isSuspend": false
    },
    {
      "userId": 0,
      "title": null,
      "darkAvatarUrl": "https://s3.thr1.sotoon.ir/phinix-public-staging/packages/clHyoeip3vrFmJvxRbjMP42h8PYDSWcKeo0zkQZO.jpg",
      "lightAvatarUrl": "https://s3.thr1.sotoon.ir/phinix-public-staging/packages/clHyoeip3vrFmJvxRbjMP42h8PYDSWcKeo0zkQZO.jpg",
      "clientId": "CLIENTID",
      "isActive": true,
      "type": "trading_bot_trade",
      "createdAt": "2024-11-19T09:20:37Z",
      "isSuspend": false
    }
  ],
  "message": "عملیات با موفقیت انجام شد",
  "success": true,
  "result_info": {
    "page": 1,
    "per_page": 11,
    "count": 11,
    "total_count": 11
  }
}
```

## Responses

-   200

200

**Response Headers**

**Connection**

**Content-Encoding**

**Date**

**Server**

**Transfer-Encoding**

**Vary**

**alt-svc**

**cache-control**

**vary**

**x-auth-cache-status**

**x-authenticated**

**x-envoy-upstream-service-time**


====================================
FILE: generated-sub-account-transfer.md
SOURCE: https://developers.wallex.ir/docs/generated/sub-account-transfer
====================================

---
title: "List Sub Account Transfers"
source: https://developers.wallex.ir/docs/generated/sub-account-transfer
---

# List Sub Account Transfers

```
GET /sub-accounts/transfers
```

# GET /sub-accounts/transfers

This endpoint retrieves transfer details for a sub-account.

## Headers

This request does not require any custom header.

## Request Body Parameters

This request does not require a request body.

## Query Parameters

This request does not require any query parameters.

## Response

-   `result` (array\[object\])
    
    -   `unique_id` (number)
        
    -   `source_client_id` (string)
        
    -   `source_client_title` (string)
        
    -   `destination_client_id` (string)
        
    -   `destination_client_title` (string)
        
    -   `source_user_type` (string)
        
    -   `destination_user_type` (string)
        
    -   `fa_source_user_type` (string)
        
    -   `fa_destination_user_type` (string)
        
    -   `currency` (string)
        
    -   `value` (string)
        
    -   `reason` (string)
        
    -   `createdAt` (string)
        
-   `message` (string)
    
-   `success` (boolean)
    
-   `result_info` (object)
    
    -   `page` (number)
        
    -   `per_page` (number)
        
    -   `count` (number)
        
    -   `total_count` (number)
        

## Example Response

```json
{
  "result": [
    {
      "unique_id": 0,
      "source_client_id": "",
      "source_client_title": "",
      "destination_client_id": "",
      "destination_client_title": null,
      "source_user_type": "",
      "destination_user_type": "",
      "fa_source_user_type": "",
      "fa_destination_user_type": "",
      "currency": "",
      "value": "",
      "reason": "",
      "createdAt": ""
    }
  ],
  "message": "",
  "success": true,
  "result_info": {
    "page": 0,
    "per_page": 0,
    "count": 0,
    "total_count": 0
  }
}
```

## Request

## Responses

-   200

200

**Response Headers**

**Connection**

**Content-Encoding**

**Date**

**Server**

**Transfer-Encoding**

**Vary**

**alt-svc**

**cache-control**

**vary**

**x-auth-cache-status**

**x-authenticated**

**x-envoy-upstream-service-time**


====================================
FILE: generated-create-transfer-to-sub-account.md
SOURCE: https://developers.wallex.ir/docs/generated/create-transfer-to-sub-account
====================================

---
title: "Create Transfer To Sub Account"
source: https://developers.wallex.ir/docs/generated/create-transfer-to-sub-account
---

# Create Transfer To Sub Account

```
POST /sub-accounts/transfers
```

# POST /sub-accounts/transfers

This endpoint Submits Transfer from master account to sub-account.

## Headers

This request does not require any custom header.

## Request Body Parameters

-   `currency` (string)
    
-   `value` (number)
    
-   `subAccount_client_id` (string)
    

## Query Parameters

This request does not require any query parameters.

## Response

-   `result` (array\[object\])
    
    -   `userId` (number)
        
    -   `title` (string)
        
    -   `darkAvatarUrl` (string)
        
    -   `lightAvatarUrl` (string)
        
    -   `clientId` (string)
        
    -   `isActive` (bool)
        
    -   `type` (string)
        
    -   `isSuspend` (bool)
        
    -   `createdAt` (string)
        
-   `message` (string)
    
-   `success` (boolean)
    

## Example Response

200

```json
{
  "result": {
    "userId": 0,
    "title": "تست اولویت",
    "darkAvatarUrl": "https://s3.thr1.sotoon.ir/phinix-public-staging/packages/clHyoeip3vrFmJvxRbjMP42h8PYDSWcKeo0zkQZO.jpg",
    "lightAvatarUrl": "https://s3.thr1.sotoon.ir/phinix-public-staging/packages/clHyoeip3vrFmJvxRbjMP42h8PYDSWcKeo0zkQZO.jpg",
    "clientId": "CLIENTID",
    "isActive": true,
    "type": "prop",
    "createdAt": "2024-09-08T13:35:27Z",
    "isSuspend": false
  },
  "message": "عملیات با موفقیت انجام شد",
  "success": true
}
```

## 422

```json
{
  "result": {
    "currency": [
      "انتقال ارز BTC به این اکانت مجاز نمی باشد."
    ]
  },
  "message": "اطلاعات وارد شده اشتباه است",
  "success": false,
  "code": 422
}
```

## Request

## Responses

-   200
-   422

200

**Response Headers**

**Cache-Control**

**Connection**

**Content-Encoding**

**Date**

**Server**

**Transfer-Encoding**

**Vary**

**X-Robots-Tag**

**alt-svc**

422

**Response Headers**

**Cache-Control**

**Connection**

**Date**

**Server**

**Transfer-Encoding**

**Vary**

**X-Robots-Tag**


====================================
FILE: generated-sub-account-balances-details.md
SOURCE: https://developers.wallex.ir/docs/generated/sub-account-balances-details
====================================

---
title: "Sub Account Balances Details"
source: https://developers.wallex.ir/docs/generated/sub-account-balances-details
---

# Sub Account Balances Details

```
GET /v1/account/balances-detail
```

# GET /v1/account/balances-detail

This endpoint retrieves the detailed balance information for the account.

## Headers

This request does not require any custom header.

## Request Body Parameters

This request does not require a request body.

## Query Parameters

This request does not require any query parameters.

## Response

-   `result` (object)
    
    -   `CURRENCY` (object) // balance currency symbol
        
        -   `symbol` (string)
            
        -   `total` (string)
            
        -   `freeze` (string)
            
        -   `available` (string)
            
        -   `stats` (object)
            
            -   `BTC` (object)
                
                -   `baseMarketName` (string)
                    
                -   `changePercentage` (string)
                    
                -   `estimatedValue` (string)
                    
                -   `last24HoursEstimatedValueChange` (string)
                    
            -   `USDT` (object)
                
                -   `baseMarketName` (string)
                    
                -   `changePercentage` (string)
                    
                -   `estimatedValue` (string)
                    
                -   `last24HoursEstimatedValueChange` (string)
                    
            -   `TMN` (object)
                
                -   `changePercentage` (string)
                    
                -   `estimatedValue` (string)
                    
                -   `last24HoursEstimatedValueChange` (string)
                    
-   `message` (string)
    
-   `success` (boolean)
    

## Example Response

```json
{    "result": {        "TMN": {            "symbol": "TMN",            "total": "0",            "freeze": "0",            "available": "0",            "stats": {                "BTC": {                    "baseMarketName": "BTC",                    "changePercentage": "7.69",                    "estimatedValue": "0.00",                    "last24HoursEstimatedValueChange": "0.00"                },                "USDT": {                    "baseMarketName": "USDT",                    "changePercentage": "-1.00",                    "estimatedValue": "0.00",                    "last24HoursEstimatedValueChange": "0.00"                },                "TMN": {                    "changePercentage": "0.00",                    "estimatedValue": "0",                    "last24HoursEstimatedValueChange": "0"                }            }        },        "USDT": {            // similar to TMN        },        "BTC": {            // similar to BTC        }    },    "message": "عملیات با موفقیت انجام شد",    "success": true}
```

## Request

## Responses

-   200

200

**Response Headers**

**Connection**

**Content-Encoding**

**Date**

**Server**

**Transfer-Encoding**

**Vary**

**alt-svc**

**cache-control**

**vary**

**x-auth-cache-status**

**x-authenticated**

**x-envoy-upstream-service-time**

**x-ratelimit-limit**

**x-ratelimit-remaining**


====================================
FILE: generated-prop-packages-list.md
SOURCE: https://developers.wallex.ir/docs/generated/prop-packages-list
====================================

---
title: "Prop Packages List"
source: https://developers.wallex.ir/docs/generated/prop-packages-list
---

# Prop Packages List

```
GET /v1/prop/packages
```

# GET v1/prop/packages

This endpoint retrieves a list of existing prop packages.

## Headers

This request does not require any custom header.

## Request Body Parameters

This request does not require a request body.

## Query Parameters

This request does not require any query parameters.

## Response

The response for this request is a JSON object with the following properties:

-   `result` (array\[object\])
    
    -   `id` (number)
        
    -   `title` (string)
        
    -   `currency` (string)
        
    -   `destination_currency` (string|null)
        
    -   `assurance` (string)
        
    -   `loan` (string)
        
    -   `warning_limit` (string)
        
    -   `liquidity_limit` (string)
        
    -   `status` (string)
        
    -   `expire_days` (number)
        
    -   `dark_image_url` (string)
        
    -   `light_image_url` (string)
        
    -   `daily_fee` (string)
        
    -   `daily_fee_discount` (string)
        
    -   `daily_fee_after_discount` (string)
        
    -   `final_fee` (string)
        
    -   `final_fee_discount` (string)
        
    -   `final_fee_after_discount` (string)
        
-   `message` (string)
    
-   `success` (boolean)
    

## Example Response

```json
{    "result": [        {            "id": 81,            "title": "طرح ۱۷",            "currency": "TMN",            "destination_currency": null,            "assurance": "20000000",            "loan": "200000000",            "warning_limit": "250000000",            "liquidity_limit": "240000000",            "status": "INACTIVE",            "expire_days": 30,            "dark_image_url": "https://s3.thr1.sotoon.ir/phinix-public-staging/packages/clHyoeip3vrFmJvxRbjMP42h8PYDSWcKeo0zkQZO.jpg",            "light_image_url": "https://s3.thr1.sotoon.ir/phinix-public-staging/packages/clHyoeip3vrFmJvxRbjMP42h8PYDSWcKeo0zkQZO.jpg",            "daily_fee": "300000",            "daily_fee_discount": "0",            "daily_fee_after_discount": "300000",            "final_fee": "9000000",            "final_fee_discount": "0",            "final_fee_after_discount": "9000000"        },    ],    "message": "عملیات با موفقیت انجام شد",    "success": true}
```

## Request

## Responses

-   200

200

**Response Headers**

**Connection**

**Content-Encoding**

**Date**

**Server**

**Transfer-Encoding**

**Vary**

**alt-svc**

**cache-control**

**vary**

**x-auth-cache-status**

**x-authenticated**

**x-envoy-upstream-service-time**


====================================
FILE: generated-prop-package-details.md
SOURCE: https://developers.wallex.ir/docs/generated/prop-package-details
====================================

---
title: "Prop Package Details"
source: https://developers.wallex.ir/docs/generated/prop-package-details
---

# Prop Package Details

```
GET /v1/prop/packages/:id
```

# GET v1/prop/packages/{id}

This endpoint retrieves the details for a prop package.

## Headers

This request does not require any custom header.

## Request Body Parameters

This request does not require a request body.

## Query Parameters

This request does not require any query parameters.

## Response

The response for this request is a JSON object with the following properties:

-   `result` (object)
    
    -   `detail` (number)
        
        -   `id` (string)
            
        -   `title` (string)
            
        -   `currency` (string)
            
        -   `destination_currency` (string)
            
        -   `assurance` (string)
            
        -   `loan` (string)
            
        -   `warning_limit` (string)
            
        -   `liquidity_limit` (string)
            
        -   `status` (string)
            
        -   `expire_days` (number)
            
        -   `dark_image_url` (string)
            
        -   `light_image_url` (string)
            
        -   `daily_fee` (string)
            
        -   `daily_fee_discount` (string)
            
        -   `daily_fee_after_discount` (string)
            
        -   `final_fee` (string)
            
        -   `final_fee_discount` (string)
            
        -   `final_fee_after_discount` (string)
            
    -   `unavailableMarkets` (array\[string\])
        
    -   faq (array\[string\])
        
-   `message` (string)
    
-   `success` (boolean)
    

## Example Response

```json
{
  "result": {
    "detail": {
      "id": 147,
      "title": "600 میلیون اعتبار معاملاتی",
      "currency": "TMN",
      "destination_currency": null,
      "assurance": "60000000",
      "loan": "600000000",
      "warning_limit": "642000000",
      "liquidity_limit": "624000000",
      "status": "INACTIVE",
      "expire_days": 30,
      "dark_image_url": "https://s3.thr1.sotoon.ir/wallex-public/packages/QrOWJudTqCA4BxKlRZ99vFcnkUG5SEWNBoK5ayu2.png",
      "light_image_url": "https://s3.thr1.sotoon.ir/wallex-public/packages/ceY4TTn6yQXvmUHZvy2g3e5B8zt6sGsI2XAQuhFl.png",
      "daily_fee": "600000",
      "daily_fee_discount": "0",
      "daily_fee_after_discount": "600000",
      "final_fee": "18000000",
      "final_fee_discount": "0",
      "final_fee_after_discount": "18000000"
    },
    "unavailableMarkets": [
      "WTMN",
      "METMN",
      "WUSDT"
    ],
    "faq": []
  },
  "message": "عملیات با موفقیت انجام شد",
  "success": true
}
```

## Request

## Responses

-   200

200

**Response Headers**

**Connection**

**Content-Encoding**

**Date**

**Server**

**Transfer-Encoding**

**Vary**

**alt-svc**

**cache-control**

**vary**

**x-auth-cache-status**

**x-authenticated**

**x-envoy-upstream-service-time**


====================================
FILE: generated-user-package-history-list.md
SOURCE: https://developers.wallex.ir/docs/generated/user-package-history-list
====================================

---
title: "User Package History List"
source: https://developers.wallex.ir/docs/generated/user-package-history-list
---

# User Package History List

```
GET /v1/prop/user/packages/history
```

# GET /v1/prop/user/packages/history

This endpoint retrieves the user packages history for a user.

## Headers

This request does not require any custom header.

## Request Body Parameters

This request does not require a request body.

## Query Parameters

This request does not require any query parameters.

## Response

-   `result` (array\[object\]):
    
    -   `user_id` (number)
        
    -   `client_id` (string)
        
    -   `package_title` (string)
        
    -   `dark_image_url` (string)
        
    -   `light_image_url` (string)
        
    -   `currency` (string)
        
    -   `destination_currency` (string)
        
    -   `assurance` (string)
        
    -   `loan` (string)
        
    -   `final_balance` (string)
        
    -   `final_balance_without_transfers` (string)
        
    -   `start_balance` (string)
        
    -   `warning_limit` (string)
        
    -   `liquidity_limit` (string)
        
    -   `created_at` (string)
        
    -   `finished_at` (string)
        
    -   `expire_at` (string)
        
    -   `close_reason` (string)
        
    -   `status` (string)
        
    -   `expire_days` (number)
        
    -   `daily_fee` (string)
        
    -   `daily_fee_discount` (string)
        
    -   `daily_fee_after_discount` (string)
        
    -   `final_fee` (string)
        
    -   `final_fee_discount` (string)
        
    -   `final_fee_after_discount` (string)
        
    -   `open_days` (number)
        
    -   `total_days` (number)
        
    -   `applicable_daily_fee` (string)
        
    -   `applicable_daily_fee_discount` (string)
        
    -   `applicable_daily_fee_after_discount` (string)
        
    -   `profit` (string)
        
    -   `profit_percentage` (string)
        
    -   `final_assurance` (string)
        
    -   `final_payBack` (string)
        
-   `message` (string)
    
-   `success` (boolean)
    
-   `result_info` (object):
    
    -   `page` (number)
        
    -   `per_page` (number)
        
    -   `count` (number)
        
    -   `total_count` (number)
        

## Example Response

```json
{
  "result": [
    {
      "unique_id": 0,
      "source_client_id": "",
      "source_client_title": "",
      "destination_client_id": "",
      "destination_client_title": null,
      "source_user_type": "",
      "destination_user_type": "",
      "fa_source_user_type": "",
      "fa_destination_user_type": "",
      "currency": "",
      "value": "",
      "reason": "",
      "createdAt": ""
    }
  ],
  "message": "",
  "success": true,
  "result_info": {
    "page": 0,
    "per_page": 0,
    "count": 0,
    "total_count": 0
  }
}
```

## Responses

-   200

200

**Response Headers**

**Connection**

**Content-Encoding**

**Date**

**Server**

**Transfer-Encoding**

**Vary**

**alt-svc**

**cache-control**

**vary**

**x-auth-cache-status**

**x-authenticated**

**x-envoy-upstream-service-time**

**x-ratelimit-limit**

**x-ratelimit-remaining**


====================================
FILE: generated-user-package-history-details.md
SOURCE: https://developers.wallex.ir/docs/generated/user-package-history-details
====================================

---
title: "User Package History Details"
source: https://developers.wallex.ir/docs/generated/user-package-history-details
---

# User Package History Details

```
GET /v1/prop/user/packages/history/:subAccountClientId
```

# GET /v1/prop/user/packages/history/{subAccountClientId}

This endpoint retrieves the details for a historical user package.

## Headers

This request does not require any custom header.

## Request Body Parameters

This request does not require a request body.

## Query Parameters

This request does not require any query parameters.

## Response

-   `result` (object):
    
    -   `user_id` (number)
        
    -   `client_id` (string)
        
    -   `package_title` (string)
        
    -   `dark_image_url` (string)
        
    -   `light_image_url` (string)
        
    -   `currency` (string)
        
    -   `destination_currency` (string)
        
    -   `assurance` (string)
        
    -   `loan` (string)
        
    -   `final_balance` (string)
        
    -   `final_balance_without_transfers` (string)
        
    -   `start_balance` (string)
        
    -   `warning_limit` (string)
        
    -   `liquidity_limit` (string)
        
    -   `created_at` (string)
        
    -   `finished_at` (string)
        
    -   `expire_at` (string)
        
    -   `close_reason` (string)
        
    -   `status` (string)
        
    -   `expire_days` (number)
        
    -   `daily_fee` (string)
        
    -   `daily_fee_discount` (string)
        
    -   `daily_fee_after_discount` (string)
        
    -   `final_fee` (string)
        
    -   `final_fee_discount` (string)
        
    -   `final_fee_after_discount` (string)
        
    -   `open_days` (number)
        
    -   `total_days` (number)
        
    -   `applicable_daily_fee` (string)
        
    -   `applicable_daily_fee_discount` (string)
        
    -   `applicable_daily_fee_after_discount` (string)
        
    -   `profit` (string)
        
    -   `profit_percentage` (string)
        
    -   `final_assurance` (string)
        
    -   `final_payBack` (string)
        
-   `message` (string)
    
-   `success` (boolean)
    

## Example Response

```json
{    "result": {        "user_id": testUserId,        "client_id": "testClientId",        "package_title": "طرح ۱۰",        "dark_image_url": "https://s3.thr1.sotoon.ir/phinix-public-staging/packages/clHyoeip3vrFmJvxRbjMP42h8PYDSWcKeo0zkQZO.jpg",        "light_image_url": "https://s3.thr1.sotoon.ir/phinix-public-staging/packages/clHyoeip3vrFmJvxRbjMP42h8PYDSWcKeo0zkQZO.jpg",        "currency": "USDT",        "destination_currency": "USDT",        "assurance": "300",        "loan": "1000",        "final_balance": "1298.62",        "final_balance_without_transfers": "1298.62",        "start_balance": "1300",        "warning_limit": "1001",        "liquidity_limit": "1081",        "created_at": "2025-02-08T08:47:00.000000Z",        "finished_at": "2025-02-08T09:05:49.000000Z",        "expire_at": "2025-03-10T08:47:00.000000Z",        "close_reason": "بستن طرح",        "status": "SUSPEND",        "expire_days": 30,        "daily_fee": "1",        "daily_fee_discount": "0",        "daily_fee_after_discount": "1",        "final_fee": "30",        "final_fee_discount": "0",        "final_fee_after_discount": "30",        "open_days": 1,        "total_days": 1,        "applicable_daily_fee": "1",        "applicable_daily_fee_discount": "0",        "applicable_daily_fee_after_discount": "1",        "profit": "-2.38",        "profit_percentage": "-0.18",        "final_assurance": "297.62",        "final_payBack": "1001"    },    "message": "عملیات با موفقیت انجام شد",    "success": true}
```

## Request

## Responses

-   200

200

**Response Headers**

**Connection**

**Content-Encoding**

**Date**

**Server**

**Transfer-Encoding**

**Vary**

**alt-svc**

**cache-control**

**vary**

**x-auth-cache-status**

**x-authenticated**

**x-envoy-upstream-service-time**

**x-ratelimit-limit**

**x-ratelimit-remaining**


====================================
FILE: generated-active-user-packages-overview.md
SOURCE: https://developers.wallex.ir/docs/generated/active-user-packages-overview
====================================

---
title: "Active User Packages Overview"
source: https://developers.wallex.ir/docs/generated/active-user-packages-overview
---

# Active User Packages Overview

```
GET /v1/prop/user/packages/overview
```

# GET /v1/prop/user/packages/overview

This endpoint retrieves an overview of active user packages

## Headers

This request does not require any custom header.

## Request Body Parameters

This request does not require a request body.

## Query Parameters

This request does not require any query parameters.

## Response

-   `result` (object)
    
    -   `aggregatedDetail` (object)
        
        -   `currency` (string)
            
        -   `assurance` (string)
            
        -   `loan` (string)
            
        -   `profit` (string)
            
        -   `profitPercentage` (string)
            
    -   `userPackages` (array\[object\])
        
        -   `packageDetail` (object)
            
            -   `title` (string)
                
            -   `assurance` (string)
                
            -   `loan` (string)
                
            -   `currency` (string)
                
            -   `darkImageUrl` (string)
                
            -   `lightImageUrl` (string)
                
            -   `expireDays` (number)
                
    -   `userPackageDetail` (object)
        
        -   `id` (number)
            
        -   `subAccountClientId` (string)
            
        -   `status` (string)
            
        -   `createdAt` (string)
            
        -   `expireAt` (string)
            
        -   `profit` (string)
            
        -   `profitPercentage` (string)
            
    -   `balancesHistory` (object)
        
        -   `total` (object)
            
            -   `TMN` (number)
                
            -   `USDT` (number)
                
            -   `BTC` (number)
                
        -   `perDay` (object)
            
            -   (object)
                
                -   `TMN` (number)
                    
                -   `USDT` (number)
                    
                -   `BTC` (number)
                    
-   `message` (string)
    
-   `success` (boolean)
    

## Example Response

```json
{
  "result": {
    "aggregatedDetail": {
      "currency": "TMN",
      "assurance": "1000000",
      "loan": "200000000",
      "profit": "-1999995000",
      "profitPercentage": "-995.02"
    },
    "userPackages": [
      {
        "packageDetail": {
          "title": "طرح ۵",
          "assurance": "1000000",
          "loan": "200000000",
          "currency": "TMN",
          "darkImageUrl": "https://s3.thr1.sotoon.ir/phinix-public-staging/packages/clHyoeip3vrFmJvxRbjMP42h8PYDSWcKeo0zkQZO.jpg",
          "lightImageUrl": "https://s3.thr1.sotoon.ir/phinix-public-staging/packages/clHyoeip3vrFmJvxRbjMP42h8PYDSWcKeo0zkQZO.jpg",
          "expireDays": 30
        },
        "userPackageDetail": {
          "id": 339,
          "subAccountClientId": "CLIENTID",
          "status": "liquid",
          "createdAt": "2025-04-06T11:50:11.000000Z",
          "expireAt": "2025-05-06T11:50:11.000000Z",
          "profit": "-1999995000",
          "profitPercentage": "-995.02"
        },
        "balancesHistory": {
          "total": {
            "TMN": 201000000,
            "USDT": 1939.087567651003,
            "BTC": 0.023551144650712032
          },
          "perDay": {
            "2025-04-06": {
              "TMN": 201000000,
              "USDT": 1939.087567651003,
              "BTC": 0.023551144650712032
            }
          }
        }
      }
    ]
  },
  "message": "عملیات با موفقیت انجام شد",
  "success": true
}
```

## Responses

-   200

200

**Response Headers**

**Connection**

**Content-Encoding**

**Date**

**Server**

**Transfer-Encoding**

**Vary**

**alt-svc**

**cache-control**

**vary**

**x-auth-cache-status**

**x-authenticated**

**x-envoy-upstream-service-time**

**x-ratelimit-limit**

**x-ratelimit-remaining**


====================================
FILE: generated-active-user-package-details.md
SOURCE: https://developers.wallex.ir/docs/generated/active-user-package-details
====================================

---
title: "Active User Package Details"
source: https://developers.wallex.ir/docs/generated/active-user-package-details
---

# Active User Package Details

```
GET /v1/prop/user/packages/active
```

# GET /v1/prop/user/packages/active

This endpoint retrieves the details of a user package based on sub account.

## Headers

-   `Sub-Account-Client-id` (string)

## Request Body Parameters

This request does not require a request body.

## Query Parameters

This request does not require any query parameters.

## Response

-   `result` (object)
    
    -   `packageDetail` (object)
        
        -   `id` (number)
            
        -   `title` (string)
            
        -   `assurance` (string)
            
        -   `loan` (string)
            
        -   `currency` (string)
            
        -   `destination_currency` (null|string)
            
        -   `dailyFee` (string)
            
        -   `dailyFeeDiscount` (string)
            
        -   `dailyFeeAfterDiscount` (string)
            
        -   `darkImageUrl` (string)
            
        -   `lightImageUrl` (string)
            
        -   `startBalance` (string)
            
        -   `expireDays` (number)
            
    -   `userPackageDetail` (object)
        
        -   `id` (number)
            
        -   `status` (string)
            
        -   `createdAt` (string)
            
        -   `expireAt` (string)
            
        -   `type` (string)
            
        -   `openDays` (number)
            
        -   `totalDays` (number)
            
        -   `cyclesCount` (number)
            
        -   `debtCyclesCount` (number)
            
        -   `paidCyclesCount` (number)
            
        -   `warningLimit` (string)
            
        -   `liquidityLimit` (string)
            
        -   `profit` (string)
            
        -   `profitPercentage` (string)
            
        -   `connectToWallet` (null|string)
            
        -   `finalFeeAfterDiscount` (string)
            
        -   `finalFee` (string)
            
        -   `finalPayableFeeAmount` (string)
            
        -   `finalPayback` (string)
            
    -   `alertsData` (array\[object\])
        
        -   `type` (string)
    -   `balancesHistory` (object)
        
        -   `total` (object)
            
            -   `TMN` (number)
                
            -   `USDT` (number)
                
            -   `BTC` (number)
                
        -   `perDay` (object)
            
            -   (object)
                
                -   `TMN` (number)
                    
                -   `USDT` (number)
                    
                -   `BTC` (number)
                    
-   `message` (string)
    
-   `success` (boolean)
    

## Example Response

```json
{
  "result": {
    "packageDetail": {
      "id": 69,
      "title": "طرح ۵",
      "assurance": "1000000",
      "loan": "200000000",
      "currency": "TMN",
      "destination_currency": null,
      "dailyFee": "2000000000",
      "dailyFeeDiscount": "5000",
      "dailyFeeAfterDiscount": "1999995000",
      "darkImageUrl": "https://s3.thr1.sotoon.ir/phinix-public-staging/packages/clHyoeip3vrFmJvxRbjMP42h8PYDSWcKeo0zkQZO.jpg",
      "lightImageUrl": "https://s3.thr1.sotoon.ir/phinix-public-staging/packages/clHyoeip3vrFmJvxRbjMP42h8PYDSWcKeo0zkQZO.jpg",
      "startBalance": "201000000",
      "expireDays": 30
    },
    "userPackageDetail": {
      "id": 339,
      "status": "liquid",
      "createdAt": "2025-04-06T11:50:11.000000Z",
      "expireAt": "2025-05-06T11:50:11.000000Z",
      "type": "prop-public",
      "openDays": 1,
      "totalDays": 1,
      "cyclesCount": 1,
      "debtCyclesCount": 1,
      "paidCyclesCount": 0,
      "warningLimit": "2200795000",
      "liquidityLimit": "2200495000",
      "profit": "-1999995000",
      "profitPercentage": "-995.02",
      "connectToWallet": null,
      "finalFeeAfterDiscount": "59999850000",
      "finalFee": "60000000000",
      "finalPayableFeeAmount": "1999995000",
      "finalPayback": "2199995000"
    },
    "alertsData": [
      {
        "type": "public_warning_low_credit"
      }
    ],
    "balancesHistory": {
      "total": {
        "TMN": 201000000,
        "USDT": 1939.087567651003,
        "BTC": 0.023551144650712032
      },
      "perDay": {
        "2025-04-06": {
          "TMN": 201000000,
          "USDT": 1939.087567651003,
          "BTC": 0.023551144650712032
        }
      }
    }
  },
  "message": "عملیات با موفقیت انجام شد",
  "success": true
}
```

## Request

## Responses

-   200

200

**Response Headers**

**Connection**

**Content-Encoding**

**Date**

**Server**

**Transfer-Encoding**

**Vary**

**alt-svc**

**cache-control**

**vary**

**x-auth-cache-status**

**x-authenticated**

**x-envoy-upstream-service-time**

**x-ratelimit-limit**

**x-ratelimit-remaining**


====================================
FILE: generated-check-prop-package-availability.md
SOURCE: https://developers.wallex.ir/docs/generated/check-prop-package-availability
====================================

---
title: "Check Prop Package Availability"
source: https://developers.wallex.ir/docs/generated/check-prop-package-availability
---

# Check Prop Package Availability

```
GET /v1/prop/user/packages/:id/check-availability
```

# GET /v1/prop/user/packages/{id}/check-availability

This endpoint checks the availability of a prop package for a user based on different criteria.

## Headers

This request does not require any custom header.

## Request Body Parameters

This request does not require a request body.

## Query Parameters

This request does not require any query parameters.

## Response

-   `result` (array\[object\])
    
    -   `key` (string)
        
    -   `isValid` (boolean)
        
-   `message` (string)
    
-   `success`
    

## Example Response

```json
{
  "result": [
    {
      "key": "kyc",
      "isValid": true
    }
  ],
  "message": "عملیات با موفقیت انجام شد",
  "success": true
}
```

## Request

## Responses

-   200

200

**Response Headers**

**Cache-Control**

**Connection**

**Content-Encoding**

**Date**

**Server**

**Transfer-Encoding**

**Vary**

**X-RateLimit-Limit**

**X-RateLimit-Remaining**

**X-Robots-Tag**

**alt-svc**


====================================
FILE: generated-activate-user-package.md
SOURCE: https://developers.wallex.ir/docs/generated/activate-user-package
====================================

---
title: "Activate User Package"
source: https://developers.wallex.ir/docs/generated/activate-user-package
---

# Activate User Package

```
POST /v1/prop/user/packages
```

# POST /v1/prop/user/packages

This endpoint retrieves transfer details for sub-accounts.

## Headers

This request does not require any custom header.

## Request Body Parameters

-   `prop_package_id` (string)

## Query Parameters

This request does not require any query parameters.

## Response

-   `result` (object)
    
    -   `userId` (string)
        
    -   `title` (string)
        
    -   `darkAvatarUrl` (string)
        
    -   `lightAvatarUrl` (string)
        
    -   `clientId` (string)
        
    -   `isActive` (boolean)
        
    -   `type` (string)
        
    -   `createdAt` (string)
        
    -   `isSuspend` (boolean)
        
-   `message` (string)
    
-   `success` (boolean)
    

## Example Response

```json
{
  "result": {
    "userId": "0",
    "title": "تست اولیه عادی",
    "darkAvatarUrl": "https://s3.thr1.sotoon.ir/phinix-public-staging/packages/clHyoeip3vrFmJvxRbjMP42h8PYDSWcKeo0zkQZO.jpg",
    "lightAvatarUrl": "https://s3.thr1.sotoon.ir/phinix-public-staging/packages/clHyoeip3vrFmJvxRbjMP42h8PYDSWcKeo0zkQZO.jpg",
    "clientId": "CLIENTID",
    "isActive": true,
    "type": "prop",
    "createdAt": "2025-04-06T11:53:18Z",
    "isSuspend": false
  },
  "message": "عملیات با موفقیت انجام شد",
  "success": true
}
```

## Request

## Responses

-   201

201

**Response Headers**

**Connection**

**Date**

**Server**

**Transfer-Encoding**

**alt-svc**

**cache-control**

**vary**

**x-auth-cache-status**

**x-authenticated**

**x-envoy-upstream-service-time**

**x-ratelimit-limit**

**x-ratelimit-remaining**


====================================
FILE: generated-cancel-user-package.md
SOURCE: https://developers.wallex.ir/docs/generated/cancel-user-package
====================================

---
title: "Cancel User Package"
source: https://developers.wallex.ir/docs/generated/cancel-user-package
---

# Cancel User Package

```
DELETE /v1/prop/user/packages
```

# DELETE /v1/prop/user/packages

This endpoint cancels a user package based on sub account.

## Headers

-   `Sub-Account-Client-id` (string)

## Request Body Parameters

This request does not require a request body.

## Query Parameters

This request does not require any query parameters.

## Response

-   `result` (object)
    
    -   `client_id` (string)
        
    -   `start_balance` (string)
        
    -   `final_balance` (string)
        
    -   `final_balance_without_transfers` (string)
        
    -   `currency` (string)
        
    -   `prop_package_id` (number)
        
    -   `user_id` (string)
        
-   `message` (string)
    
-   `success` (boolean)
    

## Example Response

```json
{
  "result": {
    "client_id": "testClientId",
    "start_balance": "201000000",
    "final_balance": "201000000",
    "final_balance_without_transfers": "201000000",
    "currency": "TMN",
    "prop_package_id": 69,
    "user_id": "testUserId"
  },
  "message": "عملیات با موفقیت انجام شد",
  "success": true
}
```

## Request

## Responses

-   200

200

**Response Headers**

**Connection**

**Content-Encoding**

**Date**

**Server**

**Transfer-Encoding**

**Vary**

**alt-svc**

**cache-control**

**vary**

**x-auth-cache-status**

**x-authenticated**

**x-envoy-upstream-service-time**

**x-ratelimit-limit**

**x-ratelimit-remaining**


====================================
FILE: generated-enable-connect-to-wallet.md
SOURCE: https://developers.wallex.ir/docs/generated/enable-connect-to-wallet
====================================

---
title: "Enable Connect To Wallet"
source: https://developers.wallex.ir/docs/generated/enable-connect-to-wallet
---

# Enable Connect To Wallet

```
POST /v1/prop/user/packages/connect-to-wallet
```

# POST /v1/prop/user/packages/connect-to-wallet

This endpoint enables connect to wallet for a user package based on sub account.

## Headers

-   `Sub-Account-Client-id` (string)

## Request Body Parameters

-   `credit` (string)
-   `usageCount` (number)
-   `currency` (string)

## Query Parameters

This request does not require any query parameters.

## Response

-   `result` (object)
    
    -   `currency` (string)
        
    -   `credit` (string)
        
    -   `usageCount` (number)
        
    -   `usedCount` (number)
        
    -   `status` (string)
        
-   `message` (string)
    
-   `success` (boolean)
    

## Example Response

```json
{
  "result": {
    "currency": "USDT",
    "credit": "10000",
    "usageCount": 3,
    "usedCount": 0,
    "status": "active"
  },
  "message": "اتصال کیف پول با موفقیت انجام شد",
  "success": true
}
```

## Request

## Responses

-   200

200

**Response Headers**

**Cache-Control**

**Connection**

**Content-Encoding**

**Date**

**Server**

**Transfer-Encoding**

**Vary**

**X-RateLimit-Limit**

**X-RateLimit-Remaining**

**X-Robots-Tag**

**alt-svc**


====================================
FILE: generated-disable-connect-to-wallet.md
SOURCE: https://developers.wallex.ir/docs/generated/disable-connect-to-wallet
====================================

---
title: "Disable Connect To Wallet"
source: https://developers.wallex.ir/docs/generated/disable-connect-to-wallet
---

# Disable Connect To Wallet

```
DELETE /v1/prop/user/packages/connect-to-wallet
```

# DELETE /v1/prop/user/packages/connect-to-wallet

This endpoint disables connect to wallet for a user package based on sub account.

## Headers

-   `Sub-Account-Client-id` (string)

## Request Body Parameters

This request does not require a request body.

## Query Parameters

This request does not require any query parameters.

## Response

-   `result` (array)
-   `message` (string)
-   `success` (boolean)

## Example Response

```json
{
  "result": [],
  "message": "قطع اتصال کیف پول با موفقیت انجام شد",
  "success": true
}
```

## Request

## Responses

-   200

200

**Response Headers**

**Cache-Control**

**Connection**

**Content-Encoding**

**Date**

**Server**

**Transfer-Encoding**

**Vary**

**X-RateLimit-Limit**

**X-RateLimit-Remaining**

**X-Robots-Tag**

**alt-svc**


====================================
FILE: generated-enable-user-package-renew.md
SOURCE: https://developers.wallex.ir/docs/generated/enable-user-package-renew
====================================

---
title: "Enable User Package Renew"
source: https://developers.wallex.ir/docs/generated/enable-user-package-renew
---

# Enable User Package Renew

```
POST /v1/prop/user/packages/enable-renew
```

# POST /v1/prop/user/packages/enable-renew

This endpoint enables renewal for a user package based on sub account.

## Headers

-   `Sub-Account-Client-id` (string)

## Request Body Parameters

This request does not require any body parameters.

## Query Parameters

This request does not require any query parameters.

## Response

-   `result` (array)
    
-   `message` (string)
    
-   `success` (boolean)
    

## Example Response

```json
{
  "result": [],
  "message": "عملیات با موفقیت انجام شد",
  "success": true
}
```

## Request

## Responses

-   200

200

**Response Headers**

**Cache-Control**

**Connection**

**Content-Encoding**

**Date**

**Server**

**Transfer-Encoding**

**Vary**

**X-RateLimit-Limit**

**X-RateLimit-Remaining**

**X-Robots-Tag**

**alt-svc**


====================================
FILE: otc-intro.md
SOURCE: https://developers.wallex.ir/docs/otc-intro
====================================

---
title: "خرید و فروش در بازار معاملاتی آنی چیست ؟"
source: https://developers.wallex.ir/docs/otc-intro
---

# خرید و فروش در بازار معاملاتی آنی چیست ؟

با استفاده از معاملات آنی والکس، به گستره‌ی وسیع و متنوعی از کوین‌ها دسترسی یافته و می‌توانید کوین مورد نظر را در سریع‌‌ترین زمان و با مناسب‌ترین قیمت خریداری کرده یا به فروش برسانید.

## دانلود Swagger معامله آنی

تمامی API هایی که نحوه ارسال درخواست به آن ها در ادامه گفته میشود را میتوانید از طریق لینک زیر دریافت کنید.

[دانلود Swagger اعتبار معاملاتی](/assets/files/otc-8e321a32f4509cbf103b3127bf7c9918.json)


====================================
FILE: otc-markets.md
SOURCE: https://developers.wallex.ir/docs/otc-markets
====================================

---
title: "بازارهای فعال در معاملات آنی"
source: https://developers.wallex.ir/docs/otc-markets
---

# بازارهای فعال در معاملات آنی

## مارکت های فعال

در ابتدا برای شروع به معامله آنی ، باید بدانیم که چه بازارهایی در این نوع معامله فعال هستند به منظور این کار شما میتوانید API زیر را فراخوانی کنید.

```curl
GET /v1/otc/markets
```

## توضیحات Response-Body

```json
{
  "result": {
    "USDTTMN": {
      "symbol": "سیمبل",
      "baseAsset": "نام ارز",
      "quoteAsset": "پایه بازار",
      "faName": "نام به فارسی",
      "enName": "نام به انگلیسی",
      "minQty": "حداقل مقدار قابل سفارش به واحد دارایی پایه",
      "minNotional": "حداقل ارزش سفارش",
      "maxNotional": "حداکثر ارزش سفارش",
      "stats": {
        "24h_ch": "تغییرات ۲۴ ساعته",
        "lastPrice": "آخرین قیمت"
      },
      "buyStatus": "وضعیت فعال بودن خرید کوین",
      "sellStatus": "وضعیت فعال بودن فروش کوین",
      "exchangeStatus": "وضعیت فعال بودن در اسپات"
    }
  },
  "message": "عملیات با موفقیت انجام شد",
  "success": true
}
```


====================================
FILE: otc-price.md
SOURCE: https://developers.wallex.ir/docs/otc-price
====================================

---
title: "دریافت قیمت ها در بازار آنی"
source: https://developers.wallex.ir/docs/otc-price
---

# دریافت قیمت ها در بازار آنی

جهت دریافت قیمت ها در بازار معاملاتی آنی میتوانید از API زیر استفاده کنید. به منظور این کار باید نماد و سمت معامله به عنوان Query-Param ارسال کنید

```curl
GET /v1/account/otc/price
```

## توضیحات Query-parameters

برای فراخوانی این API میتوانید پارارمترهای مختلف خود را به عنوان Query-parameters در مسیر API ارسال کنید :

| Parameter | Example | Data Type | Required | Valid Values | Definition |
| --- | --- | --- | --- | --- | --- |
| side | BUY | string | true | BUY | SELL | جهت تعیین سمت سفارش خود، ارسال این مقدار الزامی می‌باشد |
| symbol | BTCUSDT | String | true | — | جهت دریافت قیمت باید نام مارکت را ارسال کنید |

## توضیحات Response-Body

```json
{
  "result": {
    "price": "قیمت",
    "price_expires_at": "تاریخ منقضی شدن قیمت",
    "ttl": "ttl",
    "current_time": "زمان اکنون"
  },
  "message": "عملیات با موفقیت انجام شد",
  "success": true
}
```


====================================
FILE: otc-create-order.md
SOURCE: https://developers.wallex.ir/docs/otc-create-order
====================================

---
title: "ثبت سفارش در بازار آنی"
source: https://developers.wallex.ir/docs/otc-create-order
---

# ثبت سفارش در بازار آنی

به منظور ثبت سفارش جدید در بازار معاملاتی آنی ، میتوانید از API زیر استفاده کنید.

```curl
POST /v1/account/easy-trade/orders
```

## توضیحات Request-Body

| Parameter | Example | Data Type | Required | Valid Values | Definition |
| --- | --- | --- | --- | --- | --- |
| side | BUY | string | true | BUY | SELL | جهت تعیین سمت سفارش خود ارسال این مقدار الزامی می‌باشد |
| symbol | BTCUSDT | String | true | — | جهت دریافت قیمت باید نام مارکت را ارسال کنید |
| quantity | 10 | Number | true | — | مقدار حجمی که قصد خریداری کوین را دارید |
| from | otc | String | true | — | جهت ثبت سفارش در بازار معاملاتی آنی باید این مقدار را ارسال کنید |

## توضیحات Response-Body

```json
{
  "symbol": "نام ارز معامله شونده و پایه بازار",
  "sourceMarket": "ارز معامله شونده",
  "destinationMarket": "پایه بازار",
  "type": "OTC",
  "side": "سمت معامله",
  "clientOrderId": "شناسه یکتای سفارش ",
  "transactTime": "زمان معامله",
  "price": "قیمت واحد",
  "origQty": "تعداد ارز معامله شده",
  "executedSum": "حجم معامله به پایه بازار",
  "executedQty": "جچم معامله به ارز معامله شونده",
  "executedPrice": "قیمتی که در آن معامله انجام شده است.",
  "sum": "مجموع حجم معامله",
  "executedPercent": "درصد اجرا شده",
  "status": "وضعیت سفارش",
  "active": "وضعیت فعال بودن سفارش",
  "fills": [
    {
      "price": "قیمت",
      "quantity": "حجم",
      "fee": "کامزد",
      "feeCoefficient": "ضریب کارمزد",
      "feeAsset": {},
      "timestamp": "زمان انجام معامله",
      "symbol": "نام ارز معامله شومده و پایه بازار",
      "sum": "مجموع حجم معامله",
      "makerFeeCoefficient": "ضریب کارمزد میکر",
      "takerFeeCoefficient": "ضریب کارمزد تیکر",
      "isBuyer": "وضعیت خرید یا فروش بودن"
    }
  ]
}
```


====================================
FILE: generated-get-otc-markets.md
SOURCE: https://developers.wallex.ir/docs/generated/get-otc-markets
====================================

---
title: "get otc markets"
source: https://developers.wallex.ir/docs/generated/get-otc-markets
---

# get otc markets

```
GET /v1/otc/markets
```

retrieves markets which are enabled in otc

## Responses

-   200

پاسخ موفق


====================================
FILE: generated-get-otc-price.md
SOURCE: https://developers.wallex.ir/docs/generated/get-otc-price
====================================

---
title: "get otc price"
source: https://developers.wallex.ir/docs/generated/get-otc-price
---

# get otc price

```
GET /v1/account/otc/price
```

retrieves otc prices

## Request

## Responses

-   200

پاسخ موفق


====================================
FILE: generated-place-easy-trade-order.md
SOURCE: https://developers.wallex.ir/docs/generated/place-easy-trade-order
====================================

---
title: "create otc trade"
source: https://developers.wallex.ir/docs/generated/place-easy-trade-order
---

# create otc trade

```
POST /v1/account/easy-trade/orders
```

create otc order

## Request

## Responses

-   201

پاسخ موفق


====================================
FILE: socket-intro.md
SOURCE: https://developers.wallex.ir/docs/socket-intro
====================================

---
title: "سوکت های والکس"
source: https://developers.wallex.ir/docs/socket-intro
---

# سوکت های والکس

## مقدمه

در دنیای پرتغییر بازارهای مالی، دسترسی به اطلاعات لحظه‌ای یکی از عوامل حیاتی موفقیت است.  
**سوکت های والکس** به عنوان یک راهکار حرفه‌ای و به‌روز، امکان دریافت داده‌های real-time از بازار رمزارزها را فراهم می‌کنند و جایگزینی قدرتمند برای مدل‌های سنتی درخواست/پاسخ مبتنی بر REST هستند.

بر خلاف APIهای REST که نیازمند ارسال مکرر درخواست برای دریافت داده‌های جدید هستند، سوکت ها با ایجاد یک اتصال پایدار و دوطرفه، اطلاعات را **به محض وقوع تغییرات در بازار** برای شما ارسال می‌کنند. این معماری باعث کاهش چشمگیر تاخیر (latency)، مصرف منابع، و بار شبکه می‌شود و تجربه‌ای سریع، سبک و روان را فراهم می‌سازد.

## مزیت‌های کلیدی سوکت های والکس

-   ✅ **دریافت آنی و بدون وقفه** اطلاعات بازار، مناسب برای الگوریتم‌های ترید و تحلیل‌های حساس به زمان
-   ✅ **کاهش مصرف منابع سرور و کلاینت** نسبت به REST API
-   ✅ **پایداری اتصال در بلندمدت**، بدون نیاز به ارسال مجدد درخواست
-   ✅ پشتیبانی از **کانال‌های متنوع** مانند عمق بازار، معاملات، قیمت‌ها و...

## عملکرد پایدار و بدون قطعی

زیرساخت سوکت والکس به گونه‌ای طراحی شده است که اتصال شما را تا حد امکان پایدار نگه دارد.

## مناسب چه کسانی است؟

سوکت والکس برای گروه‌های زیر توصیه می‌شود:

-   توسعه‌دهندگان ربات‌های ترید خودکار (Auto-Trading Bots)
-   سازندگان داشبوردهای تحلیلی Real Time
-   ارائه‌دهندگان API واسط و سرویس‌های بازار داده

## محدودیت‌ها

به منظور ارائه خدمات بهتر به کاربران والکس محدودیت هایی برای کانکشن به وب سوکت در نظر گرفته شده است. این محدودیت ها به شرح زیر میباشد:

-   قطع کانکشن کاربران به وب سوکت پس از مدت سی دقیقه
-   در هر channel حداکثر میتوانند پنجاه message ارسال کنید
-   از طرف سرور هر بیست ثانیه PING ارسال میشود و در صورتی که کاربران PONG ارسال کنند ، سی ثایه به مدت زمان اتصال کانکشن شما اضافه میشود.
-   دقت داشته باشید حداکثر میتوانید صد PONG ارسال کنید

در ادامه این مستند، نحوه اتصال، لیست کانال‌های موجود، و نمونه‌کدهایی در زبان‌های مختلف برای استفاده از این قابلیت قدرتمند ارائه شده است.


====================================
FILE: socket-buy-depth.md
SOURCE: https://developers.wallex.ir/docs/socket-buy-depth
====================================

---
title: "دریافت عمق بازار خرید"
source: https://developers.wallex.ir/docs/socket-buy-depth
---

# دریافت عمق بازار خرید

## دریافت عمق بازار خرید (buyDepth)

از طریق این کانال می‌توانید سفارش‌های خرید موجود در Order Book یک بازار خاص را به‌صورت لحظه‌ای دریافت کنید.  
این داده‌ها برای نمایش لیست سفارش‌های خرید، تحلیل عمق بازار، و طراحی ابزارهای معاملاتی بسیار کاربردی هستند.

## آدرس اتصال WebSocket

برای اتصال باید از آدرس زیر استفاده کنید.

```text
wss://api.wallex.ir/ws
```

## فرمت پیام Subscribe

برای دریافت عمق بازار باید پیام خود را با فرمت زیر ارسال کنید و میتوانید هر مارکتی را جایگزین MARKET قرار دهید

```text
["subscribe", { "channel": "MARKET@buyDepth" }]
```

مثال

```text
["subscribe", { "channel": "َUSDTTMN@buyDepth" }]["subscribe", { "channel": "َBTCUSDT@buyDepth" }]
```

## نمونه Response-Body

پس از ارسال پیام در سوکت ، فرمت جواب هایی که دریافت میکنید به‌صورت زیر میباشد که هر آبجکت بیانگر یک اوردر در اوردربوک میباشد.

| فیلد | توضیحات |
| --- | --- |
| quantity | مقدار سفارش |
| price | قیمت هر واحد |
| sum | مجموع مقدار سفارش |

```json
[
  "USDTTMN@buyDepth",
  [
    {
      "quantity": 255.75,
      "price": 82131,
      "sum": 21005003.25
    },
    {
      "quantity": 103.07,
      "price": 82083,
      "sum": 8460294.81
    },
    {
      "quantity": 139.05,
      "price": 82066,
      "sum": 11411277.3
    }
  ]
]
```


====================================
FILE: socket-sell-depth.md
SOURCE: https://developers.wallex.ir/docs/socket-sell-depth
====================================

---
title: "دریافت عمق بازار فروش"
source: https://developers.wallex.ir/docs/socket-sell-depth
---

# دریافت عمق بازار فروش

## دریافت عمق بازار فروش (sellDepth)

از طریق این کانال می‌توانید سفارش‌های فروش موجود در Order Book یک بازار خاص را به‌صورت لحظه‌ای دریافت کنید.  
این داده‌ها برای نمایش لیست سفارش‌های فروش ، تحلیل عمق بازار، و طراحی ابزارهای معاملاتی بسیار کاربردی هستند.

## آدرس اتصال WebSocket

برای اتصال باید از آدرس زیر استفاده کنید

```text
wss://api.wallex.ir/ws
```

## فرمت پیام Subscribe

برای دریافت عمق بازار باید پیام خود را با فرمت زیر ارسال کنید و میتوانید هر مارکتی را جایگزین MARKET قرار دهید

```text
["subscribe", { "channel": "MARKET@sellDepth" }]
```

مثال

```text
["subscribe", { "channel": "َUSDTTMN@sellDepth" }]["subscribe", { "channel": "َBTCUSDT@sellDepth" }]
```

## نمونه Response-Body

پس از ارسال پیام در سوکت ، فرمت جواب هایی که دریافت میکنید به‌صورت زیر میباشد که هر آبجکت بیانگر یک اوردر در اوردربوک میباشد.

| فیلد | توضیحات |
| --- | --- |
| quantity | مقدار سفارش |
| price | قیمت هر واحد |
| sum | مجموع مقدار سفارش |

```json
[
  "USDTTMN@sellbuyDepth",
  [
    {
      "quantity": 255.75,
      "price": 82131,
      "sum": 21005003.25
    },
    {
      "quantity": 103.07,
      "price": 82083,
      "sum": 8460294.81
    },
    {
      "quantity": 139.05,
      "price": 82066,
      "sum": 11411277.3
    }
  ]
]
```


====================================
FILE: socket-trade.md
SOURCE: https://developers.wallex.ir/docs/socket-trade
====================================

---
title: "دریافت معاملات انجام‌شده"
source: https://developers.wallex.ir/docs/socket-trade
---

# دریافت معاملات انجام‌شده

## دریافت معاملات انجام‌شده (Trade)

کانال `@trade` اطلاعات لحظه‌ای مربوط به **معاملات انجام‌شده** در بازار انتخاب‌شده را فراهم می‌کند. این داده‌ها برای تحلیل رفتار بازار، ساخت نمودار تیک (Tick Chart)، و الگوریتم‌های معاملاتی با حساسیت بالا نسبت به قیمت بسیار کاربردی هستند.

هر پیامی که در این کانال دریافت می‌کنید نمایانگر یک معامله‌ی است که بین خریدار و فروشنده اتفاق افتاده است.

## آدرس اتصال WebSocket

برای اتصال باید از آدرس زیر استفاده کنید

```text
wss://api.wallex.ir/ws
```

## فرمت پیام Subscribe

برای دریافت معاملات انجام‌شده در هر بازار باید پیام خود را با فرمت زیر ارسال کنید و میتوانید هر مارکتی را جایگزین MARKET قرار دهید

```text
["subscribe", { "channel": "MARKET@trade" }]
```

مثال

```text
["subscribe", { "channel": "َUSDTTMN@trade" }]["subscribe", { "channel": "َBTCUSDT@trade" }]
```

## نمونه پاسخ دریافتی

پس از ارسال پیام در سوکت ، جواب هایی که دریافت میکنید به‌صورت زیر میباشد که هر آبجکت بیانگر یک معامله انجام‌شده میباشد.

| فیلد | نوع | توضیح |
| --- | --- | --- |
| isBuyOrder | Boolean | نشان می‌دهد آیا این معامله در سمت خرید انجام شده است یا فروش |
| quantity | String (decimal) | مقدار معامله‌شده |
| price | String (decimal) | قیمت انجام معامله |
| timestamp | ISO 8601 String | زمان دقیق انجام معامله |

```json
[
  "USDTTMN@trade",
  {
    "isBuyOrder": true,
    "quantity": "255.7500000000000000",
    "price": "82131.0000000000000000",
    "timestamp": "2025-06-01T09:33:41Z"
  }
]
```


====================================
FILE: socket-all-price.md
SOURCE: https://developers.wallex.ir/docs/socket-all-price
====================================

---
title: "دریافت قیمت لحظه‌ای"
source: https://developers.wallex.ir/docs/socket-all-price
---

# دریافت قیمت لحظه‌ای

## معرفی

کانال `all@price` برای دریافت **قیمت لحظه‌ای تمام بازارهای فعال** در والکس طراحی شده است. این کانال به‌صورت پیوسته، اطلاعات قیمتی جدید را برای مارکت‌هایی که قیمت آن‌ها تغییر کرده است ارسال می‌کند.

با استفاده از این کانال می‌توانید بدون نیاز به subscribe کردن به هر مارکت به‌صورت جداگانه، تغییرات قیمت همه بازارها را در لحظه دریافت کرده و آن‌ها را در جدول‌ها، داشبوردها یا ویجت‌های قیمت نمایش دهید.

## آدرس اتصال WebSocket

برای اتصال باید از آدرس زیر استفاده کنید `wss://api.wallex.ir/ws`

## فرمت پیام Subscribe

برای دریافت قیمت تمامی کوین ها باید پیام خود را در قالب زیر ارسال کنید

```json
[
  "subscribe",
  {
    "channel": "all@price"
  }
]
```

## نمونه پاسخ دریافتی

پس از ارسال پیام در سوکت ، جواب هایی که دریافت میکنید بصورت زیر میباشد .

| فیلد | نوع | توضیح |
| --- | --- | --- |
| symbol | string | نماد بازار (مانند BTCUSDT, PEPEUSDT) |
| price | String (decimal) | قیمت لحظه‌ای فعلی |
| 24h\_ch | Float | درصد تغییر قیمت در ۲۴ ساعت گذشته |

```json
[
  "all@price",
  {
    "symbol": "PEPEUSDT",
    "price": "0.00001136",
    "24h_ch": 1.15
  }
]
```


====================================
FILE: socket-private-channel.md
SOURCE: https://developers.wallex.ir/docs/socket-private-channel
====================================

---
title: "event های خصوصی کاربران"
source: https://developers.wallex.ir/docs/socket-private-channel
---

# event های خصوصی کاربران

کانال‌های خصوصی WebSocket در والکس به کاربران احراز هویت‌شده اجازه می‌دهند تا تغییرات شخصی مربوط به حساب خود را به‌صورت **لحظه ای** دریافت کنند.  
این event ها شامل به‌روزرسانی موجودی، وضعیت سفارش‌ها، و پیام‌های اطلاع‌رسانی هستند.

## آدرس اتصال WebSocket

برای اتصال باید از آدرس زیر استفاده کنید

```text
wss://api.wallex.ir/ws
```

## فرمت پیام Subscribe

برای دریافت ایونت های خصوصی باید پیام خود را با فرمت زیر ارسال کنید

```text
["subscribe", { "channel": "STREAMKEY" }]
```

توجه داشته باشید در هنگام لاگین به والکس در مرحله ی آخر یک کلید به نام `stream_key` در پاسخ ای پی آی دریافت میکنید که باید جایگزین STREAMKEY قرار دهید

## event های بروزرسانی موجودی کیف پول(balanceUpdated)

پس از هرگونه واریز ، برداشت ، یا ساخت سفارش و انجام معامله که در پی آن موجودی کیف پول شما آپدیت میشود ، شما یک ایونت دریافت میکنید

| فیلد | نوع | توضیح |
| --- | --- | --- |
| event | string | balanceUpdated |
| timestamp | timestamp | زمان بروزرسانی موجودی |
| price | String (decimal) | قیمت انجام معامله |
| asset | String | ارز اپدیت شده در کیف پول کاربر |
| value | String | مقدار موجود در کیف پول |
| locked | String | میزان دارایی فریز شده کاربر(زمان برداشت یا انجام یک معامله) |

```json
[
  "STREAMKEY",
  {
    "event": "balanceUpdated",
    "timestamp": 1748773416376,
    "data": {
      "TMN": {
        "asset": "TMN",
        "faName": "تومان",
        "value": "16033085",
        "locked": "2507491"
      }
    }
  }
]
```

## ثبت سفارش جدید یا بروزرسانی سفارش (orderSaved)

پس از ثبت سفارش جدید و یا بروزرسانی سفارش ها ، eventهایی که در خصوص آن دریافت میکنید به شرح زیر میباشد.

| فیلد | نوع | توضیح |
| --- | --- | --- |
| event | string | orderSaved |
| timestamp | timestamp | زمان بوجود آمدن اوردر جدید |
| price | String (decimal) | قیمت هر واحد |
| symbol | String | نام مارکت |
| side | String | BUY , SELL |
| origiQty | String | حجم سفارش |
| executedQty | String | مقدار معامله شده |
| status | String | NEW |
| active | Boolean | وضعیت فعال بودن سفارش گذاشته شده |

```json
[
  "streamKey",
  {
    "event": "orderSaved",
    "timestamp": 1748773416414,
    "data": {
      "symbol": "USDTTMN",
      "side": "BUY",
      "clientOrderId": "LIMIT-xxxx",
      "price": "82102.0000000000000000",
      "origQty": "10.0000000000000000",
      "executedQty": "0.0000000000000000",
      "status": "NEW",
      "active": true
    }
  }
]
```

## جزئیات معاملات (tradeDetails)

این کانال اطلاعات مربوط به هر معامله انجام‌شده روی سفارش‌های شما را به‌صورت لحظه‌ای ارسال می‌کند. با هر بار انجام شدن بخشی یا تمام یک سفارش، یک رویداد `tradeDetails` دریافت خواهید کرد که شامل اطلاعات معامله انجام‌شده، کارمزد، قیمت و مقدار معامله است.

## فرمت پیام Subscribe

برای دریافت رویدادهای جزئیات معاملات، پیام زیر را ارسال کنید:

```json
[
  "subscribe",
  {
    "channel": "STREAMKEY@tradeDetails"
  }
]
```

در این پیام، مقدار `STREAMKEY` همان `stream_key` دریافتی در پاسخ API لاگین است.

## رویداد جزئیات معامله (tradeDetails)

پس از انجام هر معامله روی سفارش‌های شما، رویدادی با مشخصات زیر ارسال می‌شود.

| فیلد | نوع | توضیح |
| --- | --- | --- |
| event | String | مقدار ثابت `tradeDetails` |
| timestamp | Timestamp | زمان انجام معامله |
| symbol | String | نام مارکت |
| side | String | سمت سفارش (`BUY` یا `SELL`) |
| price | String (decimal) | قیمت انجام معامله |
| quantity | String (decimal) | مقدار معامله انجام‌شده |
| sum | String (decimal) | ارزش کل معامله |
| feeAmount | String (decimal) | مقدار کارمزد معامله |
| feeCurrency | String | ارز کارمزد |
| isMaker | Boolean | مشخص می‌کند معامله از نوع Maker بوده یا Taker |
| clientOrderID | String | شناسه سفارش کاربر |

## نمونه پیام

```json
[
  "STREAMKEY@tradeDetails",
  {
    "event": "tradeDetails",
    "timestamp": 1782663892725,
    "user_id": "3464",
    "data": {
      "clientOrderID": "LIMIT-e441b494-730d-11f1-8a2a-9afca993d5d3",
      "feeAmount": "0.003",
      "feeCurrency": "USDT",
      "isMaker": false,
      "price": "172000",
      "quantity": "2",
      "side": "BUY",
      "sum": "344000",
      "symbol": "USDTTMN"
    }
  }
]
```
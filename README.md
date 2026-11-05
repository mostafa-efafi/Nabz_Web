## دیپلوی قدم‌به‌قدم روی اوبونتو

### قدم ۱: نصب Node.js

ترمینال را باز کنید (`Ctrl+Alt+T`) و این دو دستور را بزنید:

```bash
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt-get install -y nodejs
```

بررسی کنید درست نصب شده:

```bash
node -v
```

باید نسخه‌ای مثل `v22.x` ببینی.

---

### قدم ۲: ساخت پوشهٔ پروژه

```bash
mkdir -p ~/nabz-web/public ~/nabz-web/functions/api
cd ~/nabz-web
```

---

### قدم ۳: ساخت دو فایل

فایل صفحهٔ اصلی:

```bash
nano public/index.html
```

کد `index.html` (که در پیام اول دادم) را داخل ترمینال **Paste** کنید (در ترمینال لینوکس با `Ctrl+Shift+V`)، سپس:
- `Ctrl+O` → Enter (ذخیره)
- `Ctrl+X` (خروج)

فایل تابع سرور:

```bash
nano functions/api/check.js
```

کد `check.js` را Paste کنید و مثل بالا ذخیره کنید.

بررسی ساختار:

```bash
ls -R
```

باید این را ببینید:

```
.:
functions  public

./functions:
api

./functions/api:
check.js

./public:
index.html
```

---

### قدم ۴: ورود به حساب کلودفلر

```bash
npx wrangler login
```

(اولین بار چند فایل دانلود می‌کنید؛ کمی صبر کنید.)

یک **لینک** در ترمینال نمایش داده می‌شود. آن لینک را در مرورگر باز کنید، دکمهٔ **Allow** را بزنید و به ترمینال برگرد — پیام موفقیت می‌بینی.

---

### قدم ۵: دیپلوی

```bash
npx wrangler pages deploy public --project-name nabz-web
```

> ⚠️ نکتهٔ مهم: اگر قبلاً پروژه‌ای با **Direct Upload** ساخته بودی، آن پروژه Functions ندارد. این دستور پروژهٔ **جدید** می‌سازد که درست است. در پیام پایانی ترمینال، آدرس `*.pages.dev` پروژهٔ جدید را یادداشت کنید.

---

### قدم ۶: اتصال دامنهٔ `example.ir`

اگر دامنه قبلاً به پروژهٔ قدیمی وصل بود:
1. در داشبورد → پروژهٔ قدیمی → **Custom domains** → دامنه را حذف کنید.
2. به پروژهٔ جدید (`nabz-web`) برو → تب **Custom domains** → دکمهٔ **Set up a custom domain** → بنویس `example.ir` → **Activate**.
3. همین کار را برای `www.example.ir` تکرار کنید.

چند دقیقه برای فعال‌شدن SSL صبر کنید.

---

### قدم ۷: تست نهایی

**۱. تست تابع** — در مرورگر:

```
https://example.ir/api/check?url=google.com
```

باید متن JSON ببینی که با `{"ok":true` شروع می‌شود. ✅

**۲. تست صفحه** — آدرس اصلی را با `Ctrl+Shift+R` (رفرش کامل) باز کنید و یک سایت را آنالیز کنید.

---

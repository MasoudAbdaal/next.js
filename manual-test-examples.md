# مثال‌های تست دستی

این فایل شامل مثال‌های مختلف برای تست دستی امنیت برنامه است.

## تست با curl

### 1. تست احرازهویت

```bash
# ورود با اطلاعات صحیح
curl -X POST http://localhost:3000/login \
  -d "username=admin&password=admin123" \
  -c cookies.txt \
  -L

# ورود با اطلاعات نادرست
curl -X POST http://localhost:3000/login \
  -d "username=wrong&password=wrong" \
  -L

# تست دسترسی به داشبورد بدون احرازهویت
curl http://localhost:3000/dashboard -L

# تست دسترسی به داشبورد با احرازهویت
curl http://localhost:3000/dashboard \
  -b cookies.txt \
  -L
```

### 2. تست کنترل دسترسی

```bash
# ورود با حساب کاربر عادی
curl -X POST http://localhost:3000/login \
  -d "username=user&password=user123" \
  -c user_cookies.txt \
  -L

# تست دسترسی به پنل ادمین با نقش کاربر عادی
curl http://localhost:3000/admin \
  -b user_cookies.txt \
  -L
```

### 3. تست API Endpoints

```bash
# تست دسترسی به API بدون احرازهویت
curl http://localhost:3000/api/users

# تست دسترسی به API با احرازهویت
curl http://localhost:3000/api/users \
  -b cookies.txt

# تست API پروفایل
curl http://localhost:3000/api/profile \
  -b cookies.txt
```

### 4. تست SQL Injection

```bash
# تست SQL Injection در فرم ورود
curl -X POST http://localhost:3000/login \
  -d "username=admin' OR 1=1--&password=anything" \
  -L

# تست SQL Injection در فرم ثبت‌نام
curl -X POST http://localhost:3000/register \
  -d "username=test' OR 1=1--&password=test123" \
  -L
```

### 5. تست XSS

```bash
# تست XSS در نام کاربری
curl -X POST http://localhost:3000/register \
  -d "username=<script>alert('xss')</script>&password=test123" \
  -L

# تست XSS در پسورد
curl -X POST http://localhost:3000/register \
  -d "username=test&password=<script>alert('xss')</script>" \
  -L
```

### 6. تست نشست

```bash
# ورود و ذخیره کوکی
curl -X POST http://localhost:3000/login \
  -d "username=admin&password=admin123" \
  -c session_cookies.txt \
  -L

# تست دسترسی با کوکی
curl http://localhost:3000/dashboard \
  -b session_cookies.txt \
  -L

# خروج
curl http://localhost:3000/logout \
  -b session_cookies.txt \
  -L

# تست دسترسی پس از خروج
curl http://localhost:3000/dashboard \
  -b session_cookies.txt \
  -L
```

## تست با wget

```bash
# دریافت صفحه اصلی
wget -qO- http://localhost:3000/

# تست دسترسی به صفحه محافظت شده
wget -qO- http://localhost:3000/dashboard

# تست با کوکی
wget --load-cookies cookies.txt -qO- http://localhost:3000/dashboard
```

## تست با Postman

### Collection برای Postman

```json
{
  "info": {
    "name": "Passport.js Security Tests",
    "description": "Security testing collection for Passport.js demo"
  },
  "item": [
    {
      "name": "Login - Admin",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/x-www-form-urlencoded"
          }
        ],
        "body": {
          "mode": "urlencoded",
          "urlencoded": [
            {
              "key": "username",
              "value": "admin"
            },
            {
              "key": "password",
              "value": "admin123"
            }
          ]
        },
        "url": {
          "raw": "http://localhost:3000/login",
          "protocol": "http",
          "host": ["localhost"],
          "port": "3000",
          "path": ["login"]
        }
      }
    },
    {
      "name": "Access Dashboard",
      "request": {
        "method": "GET",
        "url": {
          "raw": "http://localhost:3000/dashboard",
          "protocol": "http",
          "host": ["localhost"],
          "port": "3000",
          "path": ["dashboard"]
        }
      }
    },
    {
      "name": "API - Get Users",
      "request": {
        "method": "GET",
        "url": {
          "raw": "http://localhost:3000/api/users",
          "protocol": "http",
          "host": ["localhost"],
          "port": "3000",
          "path": ["api", "users"]
        }
      }
    }
  ]
}
```

## تست با Burp Suite

### مراحل تست:

1. **تنظیم پروکسی**: Burp Suite را روی پورت 8080 تنظیم کنید
2. **فعال‌سازی Intercept**: درخواست‌ها را برای تغییر دستی فعال کنید
3. **تست احرازهویت**: درخواست‌های ورود را تغییر دهید
4. **تست API**: درخواست‌های API را بدون احرازهویت ارسال کنید
5. **تست نشست**: کوکی‌های نشست را تغییر دهید

### مثال‌های تست:

```http
# تغییر درخواست ورود
POST /login HTTP/1.1
Host: localhost:3000
Content-Type: application/x-www-form-urlencoded

username=admin' OR 1=1--&password=anything

# درخواست API بدون احرازهویت
GET /api/users HTTP/1.1
Host: localhost:3000

# تغییر کوکی نشست
GET /dashboard HTTP/1.1
Host: localhost:3000
Cookie: connect.sid=FAKE_SESSION_ID
```

## تست با OWASP ZAP

### اسکن خودکار:

1. **Spider**: برای کشف تمام صفحات
2. **Active Scan**: برای اسکن امنیتی فعال
3. **Passive Scan**: برای اسکن امنیتی غیرفعال
4. **API Scan**: برای اسکن API endpoints

### تنظیمات اسکن:

```yaml
# ZAP Configuration
target: http://localhost:3000
context: passport-demo
user: admin
password: admin123
scan_policy: Default Policy
```

## نکات مهم تست

### 1. تست Rate Limiting
```bash
# ارسال درخواست‌های متعدد
for i in {1..100}; do
  curl -X POST http://localhost:3000/login \
    -d "username=admin&password=wrong" &
done
```

### 2. تست Session Fixation
```bash
# ایجاد نشست و سپس ورود
curl -c session.txt http://localhost:3000/login
curl -X POST http://localhost:3000/login \
  -d "username=admin&password=admin123" \
  -b session.txt \
  -c session.txt
```

### 3. تست CSRF
```html
<!-- ایجاد صفحه تست CSRF -->
<html>
<body>
  <form action="http://localhost:3000/register" method="POST">
    <input type="hidden" name="username" value="hacker">
    <input type="hidden" name="password" value="hacker123">
    <input type="submit" value="Click me!">
  </form>
</body>
</html>
```

### 4. تست Directory Traversal
```bash
# تست دسترسی به فایل‌های سیستم
curl http://localhost:3000/../../../etc/passwd
curl http://localhost:3000/..%2F..%2F..%2Fetc%2Fpasswd
```

## گزارش‌گیری

### فرمت گزارش ساده:

```markdown
# گزارش تست امنیتی

## تاریخ تست: [تاریخ]
## تست‌کننده: [نام]

### 1. احرازهویت
- [ ] ورود با اطلاعات صحیح
- [ ] ورود با اطلاعات نادرست
- [ ] تست پسوردهای ضعیف

### 2. کنترل دسترسی
- [ ] دسترسی به صفحات محافظت شده
- [ ] دسترسی به API بدون احرازهویت
- [ ] دسترسی به پنل ادمین

### 3. مدیریت نشست
- [ ] باطل شدن نشست پس از خروج
- [ ] تست نشست‌های همزمان
- [ ] تست تزریق نشست

### 4. اعتبارسنجی ورودی
- [ ] SQL Injection
- [ ] XSS
- [ ] CSRF

### نتیجه: [گذر/شکست]
```
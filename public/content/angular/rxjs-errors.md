خطا در Observable جریان را **می‌کشد**: بعد از `error` دیگر مقداری نمی‌آید. پس خطا را باید جایی بگیری که جریان زنده بماند.

## مثال

```typescript
import { Subject, of, timer } from 'rxjs';
import { catchError, finalize, retry, switchMap } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';

declare const http: HttpClient;
const query$ = new Subject<string>();

query$
  .pipe(
    switchMap((q) =>
      http.get<string[]>(`/api/search?q=${q}`).pipe(
        retry({
          count: 3,
          // backoff نمایی: ۲۰۰، ۴۰۰، ۸۰۰ میلی‌ثانیه
          delay: (_error, attempt) => timer(2 ** attempt * 100),
        }),
        // catchError داخل switchMap: خطای یک جست‌وجو کل جریان را نمی‌کشد
        catchError(() => of<string[]>([])),
      ),
    ),
    finalize(() => console.log('stream closed')),
  )
  .subscribe((results) => console.log(results));
```

## نکته‌های سنیور

- اگر `catchError` را **بیرون** `switchMap` بگذاری، بعد از اولین خطا کل جریان (و جست‌وجوی بعدی کاربر) تمام می‌شود. درونش بگذار.
- فقط خطاهای قابل‌تکرار را retry کن (شبکه، ۵xx)؛ `4xx` را retry نکن. شرط را در `delay` یا با `throwError` کنترل کن.
- `catchError` می‌تواند مقدار جایگزین بدهد، یا با `throwError(() => new Error(...))` خطا را تبدیل و دوباره پرتاب کند.
- `finalize` هم برای complete، هم error و هم unsubscribe اجرا می‌شود؛ برای خاموش‌کردن loading مناسب است.
- پیش‌فرض Angular: خطای subscribe بدون handler به `ErrorHandler` سراسری می‌رسد؛ برای UI یک interceptor مرکزی بساز.

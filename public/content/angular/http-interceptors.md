Interceptor تابعی است که روی **همهٔ** درخواست‌ها/پاسخ‌های `HttpClient` اجرا می‌شود: مکان مرکزی برای توکن، خطا، لاگ و cache.

## مثال: توکن + refresh یک‌باره

```typescript
import { HttpErrorResponse, HttpInterceptorFn, provideHttpClient, withInterceptors } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthStore } from './auth-store';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthStore);
  const withToken = auth.token()
    ? req.clone({ setHeaders: { Authorization: `Bearer ${auth.token()}` } }) // req تغییرناپذیر است
    : req;

  return next(withToken).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && error.status === 401 && !req.url.includes('/auth/')) {
        // یک بار refresh کن و درخواست اصلی را تکرار کن
        return auth.refresh().pipe(
          switchMap(() => next(req.clone({ setHeaders: { Authorization: `Bearer ${auth.token()}` } }))),
        );
      }
      return throwError(() => error);
    }),
  );
};

export const httpProviders = [provideHttpClient(withInterceptors([authInterceptor]))];
```

## نکته‌های سنیور

- ترتیب `withInterceptors([a, b])` ترتیب اجرای **درخواست** است و برعکس برای **پاسخ**. interceptor خطا را معمولاً **قبل** از auth بگذار تا ۴۰۱ خام به auth برسد.
- چند ۴۰۱ هم‌زمان باید **یک** refresh مشترک بزنند (`shareReplay`)؛ وگرنه refresh token چرخشی باطل می‌شود.
- `HttpContext` + `HttpContextToken` به یک درخواست پرچم می‌دهد (مثلاً «لودینگ نشان نده») بدون هدر ساختگی.
- Cache و dedupe: `shareReplay` در سرویس یا interceptor با Map کلید `req.urlWithParams` (فقط `GET`).
- `withFetch()` از fetch API استفاده می‌کند (برای SSR توصیه می‌شود).
- مسیرهای بیرونی (دامنهٔ ثالث) را نباید توکن برنامه بفرستی؛ `req.url.startsWith('/api')` را بررسی کن.

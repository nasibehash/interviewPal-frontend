## ۱. guard، resolver و canMatch چه فرقی دارند؟

**جواب:** `canMatch` تصمیم می‌گیرد route اصلاً **match شود یا نه** و قبل از دانلود chunk lazy اجرا می‌شود (مناسب مسیرهای نقش‌محور). `canActivate` بعد از match اجازهٔ ورود می‌دهد. `canDeactivate` برای خروج (فرم ذخیره‌نشده). `resolve` داده‌ای را قبل از نمایش صفحه می‌آورد؛ فقط برای داده‌ای که صفحه بدون آن معنا ندارد، چون ناوبری تا پایان آن معطل می‌ماند. در guard به‌جای `router.navigate` یک `UrlTree` برگردان تا ناوبری اتمیک باشد.

## ۲. چند درخواست هم‌زمان ۴۰۱ بگیرند، refresh token را چطور مدیریت می‌کنی؟

**جواب:** باید **فقط یک** refresh زده شود و بقیه منتظر همان نتیجه بمانند؛ وگرنه با refresh token چرخشی، دومین refresh توکن را باطل می‌کند و کاربر خارج می‌شود. راه‌حل: نگه‌داشتن یک Observable مشترک refresh.

```typescript
import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, catchError, finalize, shareReplay, switchMap, throwError } from 'rxjs';
import { AuthStore } from './auth-store';

let refreshing$: Observable<string> | null = null;

export const refreshInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthStore);
  return next(req).pipe(
    catchError((error: unknown) => {
      if (!(error instanceof HttpErrorResponse) || error.status !== 401) return throwError(() => error);

      // همهٔ ۴۰۱های هم‌زمان به همین یک refresh وصل می‌شوند
      refreshing$ ??= auth.refreshToken().pipe(
        shareReplay(1),
        finalize(() => (refreshing$ = null)),
      );
      return refreshing$.pipe(
        switchMap((token) => next(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }))),
      );
    }),
  );
};
```

اگر خود refresh هم ۴۰۱ بدهد، باید کاربر را خارج کنی و به صفحهٔ ورود ببری؛ و درخواست‌های `/auth/*` را از این منطق مستثنا می‌کنم تا حلقه نسازد.

## ۳. فرم تایپ‌شده، validator بین‌فیلدی و async validator

**جواب:** در Reactive Forms از `fb.nonNullable` و `getRawValue()` استفاده می‌کنم تا نوع‌ها دقیق باشند. validator **تک‌فیلدی** روی خود control، **بین‌فیلدی** (تکرار رمز) روی `FormGroup`. async validator فقط وقتی همگام‌ها معتبرند اجرا می‌شود؛ با `timer` + `switchMap` debounce و لغو می‌گیرد. جزئیات و مثال در مبحث «فرم‌ها» آمده.

## ۴. Signal Forms یا Reactive Forms؟

**جواب:** در پروژهٔ جدید Signal Forms: مدل فرم یک signal ساده است، `computed` و `effect` به آن وصل می‌شوند و بدون `ControlValueAccessor` و `valueChanges`. Reactive Forms بالغ‌تر است و اکوسیستم و کد موجود زیادی دارد؛ لازم نیست فوراً مهاجرت کنی، و هر دو کنار هم کار می‌کنند.

## ۵. چرا همیشه `HttpClient` در سرویس و نه در کامپوننت؟

**جواب:** کامپوننت باید فقط UI باشد: تست‌پذیری، استفادهٔ مجدد و تغییر منبع داده بدون دست‌زدن به UI. استثنا: `httpResource` برای خواندن داده‌ای که فقط همان صفحه می‌خواهد، چون خودش reactive، قابل‌لغو و با `isLoading/error` است.

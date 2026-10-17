## ۱. Angular چطور از XSS جلوگیری می‌کند و کجا دور زده می‌شود؟

**جواب:** مقدارهای interpolation (`{{ }}`) و property binding به‌صورت پیش‌فرض escape یا sanitize می‌شوند، حتی در `[innerHTML]` (script و `onerror` حذف می‌شود). خطر زمانی است که این محافظت را خاموش کنی: `bypassSecurityTrustHtml` (و نسخه‌های `Url`، `Script`...)، نوشتن مستقیم در DOM (`nativeElement.innerHTML`)، و ساخت قالب از رشتهٔ کاربر. قاعده: اگر ناچار به bypass هستی، **اول** با کتابخانهٔ sanitize (DOMPurify) پاک کن، بعد bypass.

```typescript
import { Pipe, PipeTransform, inject } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import DOMPurify from 'dompurify';

@Pipe({ name: 'safeHtml' })
export class SafeHtmlPipe implements PipeTransform {
  private readonly sanitizer = inject(DomSanitizer);

  transform(html: string): SafeHtml {
    // ابتدا پاک‌سازی، بعد bypass (فقط روی خروجی پاک‌شده)
    return this.sanitizer.bypassSecurityTrustHtml(DOMPurify.sanitize(html));
  }
}
```

## ۲. توکن را کجا نگه می‌دارم؟

**جواب:** `localStorage` برای هر اسکریپتی (و در نتیجه هر XSS) قابل‌خواندن است. بهتر: **توکن دسترسی کوتاه‌عمر در حافظه** و **refresh token در کوکی `httpOnly` + `Secure` + `SameSite`** با `Path` محدود به مسیر refresh. این کوکی را جاوااسکریپت نمی‌بیند. هزینه: با کوکی باید CSRF را هم در نظر بگیری؛ `SameSite=Strict` و محدودکردن کوکی به endpoint refresh بیشتر خطر را می‌برد. این همان الگوی همین پروژه است.

## ۳. CSRF چیست و Angular چه کمکی می‌کند؟

**جواب:** وقتی مرورگر کوکی را خودکار با درخواست از سایت دیگر می‌فرستد. دفاع: `SameSite`، و الگوی double-submit: سرور کوکی `XSRF-TOKEN` می‌دهد و `HttpClient` مقدارش را در هدر `X-XSRF-TOKEN` می‌گذارد (برای درخواست‌های تغییردهنده و همان origin). اگر **بدون کوکی** و با هدر `Authorization` کار کنی، CSRF کلاسیک عملاً موضوع نیست، ولی XSS و ذخیرهٔ توکن را باید جدی بگیری.

```typescript
import { provideHttpClient, withXsrfConfiguration } from '@angular/common/http';

export const httpProviders = [
  provideHttpClient(withXsrfConfiguration({ cookieName: 'XSRF-TOKEN', headerName: 'X-XSRF-TOKEN' })),
];
```

## ۴. guard در Angular امنیت است؟

**جواب:** نه. guard فقط **تجربهٔ کاربری** است؛ کد فرانت در دست کاربر است و می‌شود دور زد. امنیت واقعی را **API** با احراز هویت و مجوز روی هر endpoint اعمال می‌کند. در همین پروژه: guard کاربر مهمان را به صفحهٔ ورود می‌برد، ولی بک‌اند هم بدون توکن `401` می‌دهد.

## ۵. CSP و secretها در فرانت

**جواب:** هر چیزی که در bundle باشد **عمومی** است؛ کلید API محرمانه، رمز یا اتصال دیتابیس در فرانت جایی ندارد (متغیر build هم secret نیست). برای کلید ثالث، یک endpoint واسط (BFF) بساز. **CSP** (هدر `Content-Security-Policy`) حتی اگر XSS رخ دهد، اجرای اسکریپت ناشناس را محدود می‌کند؛ Angular برای استایل‌های inline از `nonce` پشتیبانی می‌کند (توکن `CSP_NONCE` یا attribute `ngCspNonce` روی عنصر ریشه). به‌علاوه `npm audit` و قفل‌کردن وابستگی‌ها برای زنجیرهٔ تأمین.

## ۱. چه چیزی را unit و چه چیزی را e2e تست می‌کنی؟

**جواب:** منطق (سرویس‌ها، store با signal، pipeها، validatorها) را با unit test سریع و بدون DOM؛ رفتار کامپوننت را با `TestBed` از دید کاربر (چیزی که در DOM می‌بینی، نه فیلدهای داخلی)؛ و فقط مسیرهای **حیاتی** (ورود، پرداخت) را با e2e (Playwright). e2e کند و شکننده است، پس برای هر چیزی نمی‌نویسمش. تست باید رفتار را بسنجد تا refactor آن را نشکند.

```typescript
import { TestBed } from '@angular/core/testing';
import { Component, input } from '@angular/core';

@Component({ selector: 'app-hello', template: `<p>سلام {{ name() }}</p>` })
class Hello {
  readonly name = input.required<string>();
}

it('renders the name from the input', async () => {
  const fixture = TestBed.createComponent(Hello);
  fixture.componentRef.setInput('name', 'نسیم'); // مثل والد، حتی برای input()
  await fixture.whenStable();
  expect(fixture.nativeElement.textContent).toContain('نسیم');
});
```

## ۲. تست flaky را چطور برخورد می‌کنی؟

**جواب:** نه skip و نه retry کورکورانه؛ ریشه را پیدا می‌کنم. علت‌های رایج: وابستگی به زمان واقعی (به `vi.useFakeTimers()` یا `TestScheduler` تبدیل می‌کنم)، ترتیب تست‌ها و state مشترک بین آن‌ها (هر تست `TestBed` تازه)، انتظار ناکافی برای async (`await fixture.whenStable()` به‌جای `setTimeout`) و شبکهٔ واقعی (با `HttpTestingController` یا mock).

## ۳. SSR و hydration چه مسئله‌ای را حل می‌کنند و چه چیزی در آن می‌شکند؟

**جواب:** SSR HTML کامل را از سرور می‌فرستد: نمایش اولیهٔ سریع‌تر (LCP) و SEO. **Hydration** همان DOM را در مرورگر دوباره استفاده و فعال می‌کند به‌جای رندر دوباره. چیزی که می‌شکند: کدی که سمت سرور `window`، `document` یا `localStorage` را مستقیم می‌خواند (روی Node وجود ندارد)، و DOM دستی که با HTML سرور نمی‌خواند (خطای mismatch). راه‌حل: کد مخصوص مرورگر را در `afterNextRender` یا پشت `isPlatformBrowser` بگذار.

```typescript
import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({ providedIn: 'root' })
export class Prefs {
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID));

  get(key: string): string | null {
    return this.browser ? localStorage.getItem(key) : null; // روی سرور null
  }
}
```

نکته‌ها: `HttpClient` در SSR پاسخ‌ها را به مرورگر منتقل می‌کند (transfer cache) تا درخواست تکراری نزند؛ و با incremental hydration می‌توانی `@defer (hydrate on viewport)` بگذاری تا بخش‌های سنگین تنبل فعال شوند.

## ۴. یک پروژهٔ قدیمی را به Angular مدرن چطور مهاجرت می‌دهی؟

**جواب:** تدریجی، با schematicهای رسمی و در PRهای کوچک، نه یک‌جا:

1. `ng update` یک نسخه یک نسخه تا آخرین نسخه، با تست سبز بعد از هر قدم.
2. `ng generate @angular/core:standalone` (مهاجرت به standalone در چند مرحله).
3. `ng generate @angular/core:control-flow` (از `*ngIf/*ngFor` به `@if/@for`).
4. `ng generate @angular/core:inject`، و مهاجرت `@Input`/`@Output`/`@ViewChild` به `input()`/`output()`/`viewChild()` با schematicهای signal.
5. بعد از آن OnPush و zoneless، قدم به قدم، با اندازه‌گیری.

نکته: هر قدم را جدا commit کن تا اگر چیزی شکست، علتش مشخص باشد.

## ۵. ابزار کیفیت کد در پروژهٔ Angular

**جواب:** ESLint با `angular-eslint` (قواعد قالب و OnPush)، Prettier برای فرمت یکدست، TypeScript در حالت `strict`، و `strictTemplates` برای خطای نوع در قالب. همه در CI اجرا می‌شوند و build قبل از merge سبز می‌ماند.

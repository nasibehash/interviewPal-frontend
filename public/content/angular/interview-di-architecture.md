## ۱. injectorها چطور کار می‌کنند؟ فرق providedIn root با provider در کامپوننت؟

**جواب:** درخواست `inject(X)` از injector کامپوننت شروع می‌شود و تا root بالا می‌رود تا اولین provider را پیدا کند. `providedIn: 'root'` یک نمونهٔ singleton برای کل برنامه می‌سازد (و tree-shakable است). provider در `providers` کامپوننت یا route برای هر نمونهٔ آن کامپوننت/feature **نمونهٔ جدا** می‌سازد که با نابودی آن پاک می‌شود. برای state فرم یا ویزاردی که نباید بین صفحه‌ها نشت کند عالی است.

```typescript
import { Component, Injectable, inject, signal } from '@angular/core';

@Injectable() // بدون providedIn: فقط وقتی provide شود وجود دارد
export class WizardState {
  readonly step = signal(1);
}

@Component({
  selector: 'app-wizard',
  providers: [WizardState], // هر <app-wizard> state مستقل خودش را دارد
  template: `<p>{{ state.step() }}</p>`,
})
export class Wizard {
  protected readonly state = inject(WizardState);
}
```

## ۲. InjectionToken چه وقت لازم است؟

**جواب:** برای چیزی که کلاس نیست: تنظیمات (`API_URL`)، تابع، یا abstraction با چند پیاده‌سازی که در تست یا محیط‌های مختلف عوض می‌شود. `multi: true` برای ثبت چند مقدار روی یک توکن (پلاگین، validator).

```typescript
import { InjectionToken, inject } from '@angular/core';

export const API_URL = new InjectionToken<string>('API_URL', {
  providedIn: 'root',
  factory: () => '/api', // پیش‌فرض؛ در تست یا محیط دیگر override می‌شود
});

export const apiUrl = () => inject(API_URL);
```

## ۳. یک اپ بزرگ را چطور ساختاردهی می‌کنی؟

**جواب:**

- **feature-محور:** `features/orders/` شامل صفحه‌ها، کامپوننت‌ها، سرویس و route همان feature؛ نه پوشه‌های `components/` و `services/` جهانی.
- **قاعدهٔ وابستگی:** `core` (سرویس‌های سراسری) ← `shared` (UI مشترک) ← `features`. feature به feature دیگر مستقیم import نمی‌کند، فقط از مرز عمومی (`index.ts`).
- این قاعده با lint اعمال می‌شود (Nx `enforce-module-boundaries` یا `eslint-plugin-boundaries`)، نه با قرارداد شفاهی.
- هر feature **lazy** لود می‌شود و provider خودش را در route دارد.

## ۴. NgRx کِی ارزش دارد؟

**جواب:** وقتی تیم بزرگ است و به الگوی یکسان، devtools (time travel)، رویدادمحوری و سایدافکت‌های پیچیده نیاز دارد، یا state واقعاً سراسری و پیچیده است. در بقیهٔ موارد سرویس با signal (یا NgRx SignalStore برای ساختار سبک‌تر) کافی است. هزینهٔ NgRx کد boilerplate و منحنی یادگیری است. state **سرور** (cache) را جدا از state **رابط** نگه می‌دارم.

## ۵. کامپوننت smart و dumb؟

**جواب:** dumb فقط `input` می‌گیرد و `output` می‌دهد و سرویس نمی‌شناسد؛ تست و استفادهٔ مجدد آن ساده است. smart با سرویس‌ها حرف می‌زند و داده را به dumbها می‌دهد. مرز را دور فرم، لیست و کارت می‌کشم.

## ۶. micro-frontend یا monorepo کِی؟

**جواب:** monorepo (Nx) وقتی چند اپ و کتابخانهٔ مشترک دارید: کش build، گراف وابستگی و lint مرز. micro-frontend (Module/Native Federation) وقتی **تیم‌ها مستقل** deploy می‌کنند؛ هزینه‌اش پیچیدگی نسخه‌بندی، اشتراک وابستگی‌ها و UX یکپارچه است، پس برای اپ تک‌تیمی معمولاً بیش‌ازحد است.

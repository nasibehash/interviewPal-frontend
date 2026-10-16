اول **اندازه بگیر** (Lighthouse، Angular DevTools Profiler، `ng build --stats-json`)، بعد بهینه کن. بیشترین سود معمولاً از این‌هاست:

| مشکل | راه‌حل |
|---|---|
| bundle اولیهٔ بزرگ | `loadComponent`/`@defer`، حذف import سنگین، budget در `angular.json` |
| رندرهای زیاد | OnPush/zoneless + signal، `track` در `@for` |
| لیست طولانی | `cdk-virtual-scroll` (فقط آیتم‌های دیده‌شده) |
| تصویر | `NgOptimizedImage` (lazy، `srcset`، جلوگیری از CLS) |
| اولین رندر کند | SSR + hydration، `@defer (hydrate on ...)` |
| محاسبهٔ سنگین در قالب | `computed` یا pure pipe |

## مثال

```typescript
import { Component, computed, input } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';

interface Row { id: number; name: string; avatar: string }

@Component({
  selector: 'app-users',
  imports: [NgOptimizedImage],
  template: `
    @for (u of visible(); track u.id) {
      <img [ngSrc]="u.avatar" width="48" height="48" [alt]="u.name" />
      {{ u.name }}
    }
    @defer (on viewport) {
      <app-heavy-chart />
    } @placeholder {
      <div style="height: 300px"></div>
    }
  `,
})
export class Users {
  readonly rows = input.required<Row[]>();
  readonly filter = input('');
  // یک‌بار برای هر تغییر ورودی؛ نه با هر change detection
  protected readonly visible = computed(() => this.rows().filter((r) => r.name.includes(this.filter())));
}
```

## نکته‌های سنیور

- `track` درست از ساخت دوبارهٔ DOM جلوگیری می‌کند؛ `track $index` در لیست قابل‌مرتب‌سازی باگ و کندی می‌سازد.
- Budget بگذار: در `angular.json` برای `initial` هشدار و خطا تا CI اندازهٔ bundle را کنترل کند.
- Hydration: `provideClientHydration(withIncrementalHydration())` + `@defer (hydrate on viewport)` بخش‌های SSR را تنبل فعال می‌کند.
- Preload ناوبری‌های محتمل (`withPreloading`)، و `preconnect` به دامنهٔ API.
- Memory leak = subscription/ listener رهاشده (درس RxJS: نشتی). با DevTools Memory دو snapshot مقایسه کن.

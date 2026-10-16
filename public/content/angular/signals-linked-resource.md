دو ابزار برای حالت‌هایی که `signal` و `computed` ساده کافی نیستند.

- **`linkedSignal`**: state قابل‌نوشتن که با تغییر منبعش **بازنشانی** می‌شود (مثلاً انتخاب فعلی وقتی فهرست عوض شد).
- **`resource` / `httpResource`**: داده async که با signalهای ورودی دوباره بارگیری می‌شود و `value`، `isLoading`، `error` و `reload` را می‌دهد.

## مثال

```typescript
import { Component, computed, input, linkedSignal, signal } from '@angular/core';
import { httpResource } from '@angular/common/http';

interface Option { id: number; label: string }

@Component({
  selector: 'app-picker',
  template: `
    @if (options.isLoading()) { <p>در حال بارگذاری…</p> }
    @else if (options.error()) { <button (click)="options.reload()">تلاش دوباره</button> }
    @for (o of options.value() ?? []; track o.id) {
      <button (click)="selected.set(o.id)" [class.on]="selected() === o.id">{{ o.label }}</button>
    }
  `,
})
export class Picker {
  readonly category = input.required<string>();

  // با تغییر category خودش دوباره درخواست می‌زند و درخواست قبلی را لغو می‌کند
  protected readonly options = httpResource<Option[]>(() => `/api/options?category=${this.category()}`);

  // انتخاب پیش‌فرض = اولین گزینه؛ کاربر می‌تواند عوضش کند؛ با عوض‌شدن فهرست دوباره بازنشانی می‌شود
  protected readonly selected = linkedSignal<Option[] | undefined, number | null>({
    source: () => this.options.value(),
    computation: (list, previous) =>
      list?.find((o) => o.id === previous?.value)?.id ?? list?.[0]?.id ?? null,
  });
}
```

## نکته‌های سنیور

- `httpResource` برای **خواندن** است؛ POST/PUT را با `HttpClient` بزن و بعد `reload()` بزن یا signal را عوض کن.
- اگر تابع پارامتر `undefined` برگرداند، درخواستی فرستاده نمی‌شود (برای «تا وقتی id نیامده منتظر بمان»).
- `linkedSignal` را به‌جای `effect` که `set` می‌کند استفاده کن؛ ساده‌تر و بدون تأخیر یک‌فریمی است.
- `resource.value()` در حال بارگیری مجدد مقدار قبلی را نگه می‌دارد؛ `isLoading()` را جدا بررسی کن تا پرش UI نداشته باشی.

Signal برای **state و رندر** عالی است، RxJS برای **زمان و رویداد** (debounce، لغو، retry، stream). Angular مدرن ترکیب هر دو است و پل بینشان `@angular/core/rxjs-interop` است.

| تابع | کار |
|---|---|
| `toSignal(obs$, { initialValue })` | Observable → Signal (خودکار unsubscribe) |
| `toObservable(signal)` | Signal → Observable (با effect، مقدارها در یک tick جمع می‌شوند) |
| `rxResource({ params, stream })` | داده async با Observable که به signal وابسته است |
| `takeUntilDestroyed()` | لغو خودکار |

## مثال: جست‌وجوی تایپ‌شونده

```typescript
import { Component, signal } from '@angular/core';
import { rxResource, toObservable, toSignal } from '@angular/core/rxjs-interop';
import { HttpClient } from '@angular/common/http';
import { inject } from '@angular/core';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'app-search',
  template: `
    <input (input)="term.set($any($event.target).value)" />
    @if (results.isLoading()) { <p>…</p> }
    @for (r of results.value() ?? []; track r) { <p>{{ r }}</p> }
  `,
})
export class Search {
  private readonly http = inject(HttpClient);
  protected readonly term = signal('');

  // signal → Observable → عملیات زمان‌دار → دوباره signal
  private readonly debounced = toSignal(
    toObservable(this.term).pipe(debounceTime(300), distinctUntilChanged()),
    { initialValue: '' },
  );

  // با تغییر debounced دوباره درخواست می‌زند و درخواست قبلی را لغو می‌کند
  protected readonly results = rxResource({
    params: () => this.debounced() || undefined, // undefined یعنی «اجرا نکن»
    stream: ({ params: q }) => this.http.get<string[]>(`/api/search?q=${q}`),
  });
}
```

## نکته‌های سنیور

- `toSignal` اگر Observable همگام مقدار ندهد، مقدار اولیه `undefined` است؛ یا `initialValue` بده یا `requireSync: true` برای منابع sync مثل `BehaviorSubject`.
- خطای Observable در `toSignal` هنگام خواندن signal پرتاب می‌شود؛ قبلش `catchError` بگذار.
- `toObservable` از `effect` استفاده می‌کند، پس تغییرهای پشت‌سرهم یک tick ادغام می‌شوند و مقدار میانی را نمی‌بینی.
- قاعده: state را در signal نگه دار، **عملیات زمانی** را با RxJS انجام بده، نتیجه را دوباره به signal برگردان.

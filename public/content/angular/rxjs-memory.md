Subscription که بسته نشود، نشتی حافظه و اجرای کد روی کامپوننتِ نابودشده است. هدف: **کمترین `subscribe` دستی**.

## ترتیب ترجیح

1. `async` pipe یا `toSignal` (خودشان لغو می‌کنند)
2. `takeUntilDestroyed()` برای `subscribe` ناگزیر
3. `take(1)` / `first()` برای جریان‌هایی که یک مقدار لازم دارند

## مثال

```typescript
import { Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { interval } from 'rxjs';

@Component({
  selector: 'app-clock',
  template: `<p>{{ seconds() }}</p>`,
})
export class Clock {
  // ۱) بهترین: signal، بدون subscribe دستی
  protected readonly seconds = toSignal(interval(1000), { initialValue: 0 });

  // ۲) subscribe دستی با لغو خودکار هنگام نابودی کامپوننت (داخل injection context)
  constructor() {
    interval(5000)
      .pipe(takeUntilDestroyed())
      .subscribe((n) => console.log('tick', n));
  }

  // ۳) خارج از constructor: DestroyRef را صریح بده
  private readonly destroyRef = inject(DestroyRef);
  start(source$ = interval(1000)) {
    source$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
  }
}
```

## نکته‌های سنیور

- `takeUntilDestroyed()` بدون آرگومان فقط در injection context (constructor، field initializer) کار می‌کند؛ بیرونش `DestroyRef` بده.
- جریان‌هایی که خودشان complete می‌شوند (`http.get`، `of`) نیازی به unsubscribe ندارند.
- `takeUntilDestroyed` را **آخرین** اپراتور pipe بگذار تا اپراتورهای بعدش (مثل `switchMap`) نشتی نسازند.
- `Router.events`، `fromEvent`، `interval`، `valueChanges` و Subject سرویس‌های root همیشه زنده‌اند؛ اینجا باید حتماً لغو شوند.

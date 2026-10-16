Change detection مشخص می‌کند **چه وقت** قالب دوباره رندر شود. استراتژی درست = کمترین کار بی‌دلیل.

- **Default:** با هر رویداد (و هر tick زون) کل درخت بررسی می‌شود.
- **`OnPush`:** کامپوننت فقط وقتی بررسی می‌شود که ورودی‌اش (با `===`) عوض شود، رویدادی از خودش بیاید، `async` pipe/**signal خوانده‌شده در قالب** تغییر کند یا `markForCheck` صدا زده شود.
- **Zoneless:** بدون zone.js؛ فقط signal و رویدادهای قالب رندر را زمان‌بندی می‌کنند. در Angular 22 هم zoneless هم OnPush پیش‌فرض‌اند.

## مثال

```typescript
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, signal } from '@angular/core';

@Component({
  selector: 'app-counter',
  changeDetection: ChangeDetectionStrategy.OnPush, // در 22 پیش‌فرض است
  template: `
    <button (click)="inc()">{{ count() }}</button>
    <p>{{ legacy }}</p>
  `,
})
export class Counter {
  private readonly cdr = inject(ChangeDetectorRef);
  protected readonly count = signal(0);   // خواندن در قالب = رندر خودکار
  protected legacy = 'a';                 // فیلد معمولی: تغییرش دیده نمی‌شود

  inc() {
    this.count.update((n) => n + 1);      // ✓ رندر می‌شود
  }

  setLegacyLater() {
    setTimeout(() => {
      this.legacy = 'b';                  // در zoneless/OnPush خودش رندر نمی‌شود
      this.cdr.markForCheck();            // راه‌حل قدیمی؛ بهتر: legacy را signal کن
    }, 1000);
  }
}
```

## نکته‌های سنیور

- در حالت zoneless هر state که در قالب خوانده می‌شود باید **signal** (یا `async` pipe) باشد؛ فیلد معمولی و `setTimeout` دیگر رندر را بیدار نمی‌کنند.
- mutate کردن آرایه/آبجکت ورودی در OnPush دیده نمی‌شود؛ مرجع جدید بساز.
- فراخوانی تابع در قالب (`{{ compute() }}`) با هر بررسی اجرا می‌شود؛ `computed` یا pure pipe استفاده کن.
- ابزار: Angular DevTools → Profiler نشان می‌دهد کدام کامپوننت چند بار بررسی شده.
- کتابخانهٔ شخص ثالثی که بیرون Angular callback می‌دهد (Observer، WebSocket خام) را به signal یا `markForCheck` وصل کن.

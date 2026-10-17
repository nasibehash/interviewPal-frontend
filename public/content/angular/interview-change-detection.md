در این بخش هر سؤال یک **جواب کوتاه** دارد که می‌توانی در مصاحبه بگویی، و در صورت نیاز یک مثال.

## ۱. OnPush دقیقاً چه وقت کامپوننت را بررسی می‌کند؟

**جواب:** فقط وقتی یکی از این‌ها رخ دهد: ورودی با `===` عوض شود، رویدادی از خود کامپوننت (یا قالب فرزندانش) بیاید، `async` pipe مقدار جدید بدهد، signalی که در قالب خوانده شده تغییر کند، یا `markForCheck()` صدا زده شود. تغییر **درونی** یک آبجکت یا آرایه (mutate) هیچ‌کدام از این‌ها نیست.

```typescript
import { Component, input } from '@angular/core';

@Component({ selector: 'app-names', template: `@for (n of names(); track n) { <p>{{ n }}</p> }` })
export class Names {
  readonly names = input.required<string[]>();
}

// والد:
// this.list.push('Ali');          // ✗ مرجع همان است؛ Names به‌روز نمی‌شود
// this.list = [...this.list, 'Ali']; // ✓ مرجع جدید
```

## ۲. Zoneless چه چیزی را عوض می‌کند و چه کدی با آن می‌شکند؟

**جواب:** بدون zone.js دیگر هر `setTimeout`، Promise یا رویداد مرورگر خودکار رندر را راه نمی‌اندازد؛ فقط signal، رویدادهای قالب، `async` pipe و `markForCheck` این کار را می‌کنند. نتیجه: کمتر بررسی بی‌دلیل و stack trace تمیزتر. کدی که می‌شکند: فیلد معمولی که در `setTimeout` یا callback کتابخانه عوض می‌شود، وابستگی به `NgZone.onStable`، و تست‌های `fakeAsync` که به zone تکیه دارند. راه‌حل: state را signal کن.

## ۳. یک صفحهٔ کند را چطور بررسی می‌کنی؟

**جواب:** اول اندازه می‌گیرم، بعد حدس می‌زنم.

1. Lighthouse و تب Performance مرورگر: مشکل بارگذاری است یا رندر/تعامل؟
2. Angular DevTools Profiler: کدام کامپوننت چند بار بررسی می‌شود؟
3. مظنون‌های رایج: تابع سنگین در قالب، `@for` بدون `track` درست، mutate در OnPush، subscription نشت‌کرده، لیست بزرگ بدون virtual scroll.
4. برای بارگذاری: `ng build --stats-json` و بررسی چه چیزی در bundle اولیه است؛ بعد `loadComponent`، `@defer` و حذف import سنگین.
5. بعد از اصلاح دوباره اندازه می‌گیرم تا بهبود واقعی باشد.

## ۴. تابع در قالب چه مشکلی دارد؟

**جواب:** `{{ compute(x) }}` با هر بار change detection دوباره اجرا می‌شود، حتی اگر ورودی تغییری نکرده باشد. با `computed` (فقط با تغییر وابستگی‌ها) یا pure pipe جایگزین می‌شود.

```typescript
import { Component, computed, input } from '@angular/core';

@Component({ selector: 'app-total', template: `{{ total() }}` })
export class Total {
  readonly prices = input.required<number[]>();
  protected readonly total = computed(() => this.prices().reduce((a, b) => a + b, 0)); // cache می‌شود
}
```

## ۵. لیست ۱۰ هزار ردیفی را چطور نشان می‌دهی؟

**جواب:** اول می‌پرسم واقعاً لازم است همه را بیاورم؟ معمولاً **صفحه‌بندی یا infinite scroll سمت سرور** بهتر است. اگر باید همه در حافظه باشند، `cdk-virtual-scroll` فقط ردیف‌های دیده‌شده را رندر می‌کند. همراه با `track item.id`، OnPush و ردیف‌هایی که قالب سبک دارند.

```html
<cdk-virtual-scroll-viewport itemSize="48" class="list">
  <div *cdkVirtualFor="let row of rows; trackBy: trackById" class="row">{{ row.name }}</div>
</cdk-virtual-scroll-viewport>
```

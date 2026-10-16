اپراتور تابعی است که یک Observable می‌گیرد و Observable جدید می‌دهد؛ با `pipe` زنجیر می‌شوند و منبع اصلی را تغییر نمی‌دهند. هر مرحله فقط یک کار می‌کند.

## مثال: فیلد جست‌وجو

```typescript
import { fromEvent } from 'rxjs';
import { debounceTime, distinctUntilChanged, filter, map, scan, startWith, take, tap } from 'rxjs/operators';

const input = document.querySelector('input')!;

const query$ = fromEvent(input, 'input').pipe(
  map((e) => (e.target as HTMLInputElement).value.trim()),
  debounceTime(300),         // تا ۳۰۰ms سکوت صبر کن
  distinctUntilChanged(),    // مقدار تکراری را رد کن
  filter((q) => q.length >= 2),
  tap((q) => console.log('search for', q)),
);

// scan مثل reduce است ولی با هر مقدار یک خروجی می‌دهد
const count$ = query$.pipe(
  scan((total) => total + 1, 0),
  startWith(0),
);

query$.pipe(take(1)).subscribe(); // بعد از اولین مقدار تمام می‌شود
count$.subscribe((n) => console.log('searches:', n));
```

## اپراتورهای پرکاربرد

| کار | اپراتور |
|---|---|
| تبدیل / حذف | `map`، `filter`، `pluck` (منسوخ؛ از `map` استفاده کن) |
| کنترل نرخ | `debounceTime`، `throttleTime`، `auditTime`، `sampleTime` |
| تکرار نشدن | `distinctUntilChanged`، `distinctUntilKeyChanged` |
| پایان‌دادن | `take`، `takeUntil`، `takeWhile`، `first` |
| وضعیت جمع‌شونده | `scan`، `reduce` |
| اثر جانبی | `tap` (فقط لاگ و اشکال‌زدایی؛ منطق اصلی داخلش نباشد) |

## نکته‌های سنیور

- `debounceTime` آخرین مقدار را بعد از سکوت می‌دهد؛ `throttleTime` اولین مقدار را فوراً می‌دهد. برای تایپ کردن debounce، برای اسکرول و کلیک throttle.
- `first()` اگر جریان بدون مقدار تمام شود خطای `EmptyError` می‌دهد؛ `take(1)` خطا نمی‌دهد.
- `distinctUntilChanged` روی اشیاء `===` مقایسه می‌کند؛ تابع مقایسه بده یا فقط یک فیلد را انتخاب کن.

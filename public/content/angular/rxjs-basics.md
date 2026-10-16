Observable یک **جریان مقدار در طول زمان** است. تنبل (lazy) است: تا `subscribe` نشود هیچ کدی اجرا نمی‌شود. برخلاف Promise می‌تواند چند مقدار بدهد، لغو شود و دوباره اجرا شود.

## مثال

```typescript
import { Observable } from 'rxjs';

const ticks$ = new Observable<number>((subscriber) => {
  let n = 0;
  const id = setInterval(() => subscriber.next(n++), 1000);
  return () => clearInterval(id); // teardown: با unsubscribe اجرا می‌شود
});

const sub = ticks$.subscribe({
  next: (n) => console.log(n),
  error: (e) => console.error(e),
  complete: () => console.log('done'),
});

setTimeout(() => sub.unsubscribe(), 3500); // چاپ: 0 1 2
```

## Cold و Hot

- **Cold:** هر subscriber اجرای جدا دارد. `http.get` همین است: دو `subscribe` یعنی دو درخواست.
- **Hot:** منبع بیرون از subscriber است و همه یک جریان را می‌بینند (رویداد DOM، `Subject`).

## نکته‌های سنیور

- `unsubscribe` درخواست HTTP را abort می‌کند؛ Promise این را ندارد.
- Observable می‌تواند sync باشد (`of(1, 2)`)؛ فرض «همیشه async» نکن.
- پایان‌یافتن (`complete`) یا خطا، subscription را خودکار می‌بندد و teardown اجرا می‌شود.
- قرارداد نام‌گذاری: متغیر Observable با `$` تمام شود.

`Subject` هم Observable است هم Observer: می‌توانی با `next` مقدار بدهی و چند نفر گوش کنند (multicast). این‌ها جریان **hot** می‌سازند.

| نوع | رفتار برای subscriber دیرتر |
|---|---|
| `Subject` | فقط مقدارهای بعد از subscribe را می‌گیرد |
| `BehaviorSubject(initial)` | آخرین مقدار را فوراً می‌گیرد (همیشه مقدار دارد، `.value` دارد) |
| `ReplaySubject(n)` | n مقدار آخر را بازپخش می‌کند |

## مثال: share و shareReplay

```typescript
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Subject } from 'rxjs';
import { shareReplay } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class ConfigService {
  private readonly http = inject(HttpClient);

  // بدون shareReplay: هر subscribe یک درخواست HTTP جدا
  readonly config$ = this.http.get<{ theme: string }>('/api/config').pipe(
    shareReplay({ bufferSize: 1, refCount: true }),
  );
}

// Subject به‌عنوان event bus داخل یک سرویس
@Injectable({ providedIn: 'root' })
export class Toasts {
  private readonly _messages = new Subject<string>();
  readonly messages$ = this._messages.asObservable(); // بیرون فقط می‌خواند
  show(message: string) { this._messages.next(message); }
}
```

## نکته‌های سنیور

- هیچ‌وقت خود `Subject` را export نکن؛ با `asObservable()` فقط بخش خواندنی را بده تا کسی از بیرون `next` نزند.
- `shareReplay({ bufferSize: 1, refCount: true })`: با `refCount: true` وقتی آخرین subscriber رفت، اتصال به منبع قطع می‌شود. بدون آن (پیش‌فرض قدیمی) منبع برای همیشه زنده می‌ماند و نشت می‌کند.
- `shareReplay` خطا را cache نمی‌کند ولی `complete` را بازپخش می‌کند؛ برای داده‌ای که باید تازه شود، با یک trigger (`switchMap`) ترکیبش کن.
- برای state در Angular مدرن اغلب `signal` از `BehaviorSubject` ساده‌تر است (درس‌های signals).

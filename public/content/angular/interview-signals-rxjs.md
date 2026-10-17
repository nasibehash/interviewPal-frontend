## ۱. signal یا BehaviorSubject؟

**جواب:** برای **state و رندر** signal: همگام است، مقدار فعلی همیشه در دسترس است، `computed` دارد و بدون subscribe و unsubscribe کار می‌کند. برای **رویداد و زمان** (debounce، retry، لغو، ترکیب چند منبع، WebSocket) RxJS. الگوی خوب: state در signal، عملیات زمانی با RxJS، نتیجه دوباره به signal (`toSignal`).

## ۲. تفاوت computed و effect؟ چرا در effect، signal را set نکنیم؟

**جواب:** `computed` مقدار **مشتق‌شده** است (تنبل، cache‌شده، خالص). `effect` برای **اثر جانبی روی دنیای بیرون** است (localStorage، لاگ، DOM دستی). `set` کردن signal در effect زنجیرهٔ به‌روزرسانی پنهان می‌سازد و حلقه یا رندر اضافه ایجاد می‌کند. اگر مقدار مشتق است `computed` و اگر state ای است که با تغییر منبع باید بازنشانی شود، `linkedSignal`.

```typescript
import { linkedSignal, signal } from '@angular/core';

const items = signal(['a', 'b']);
// انتخاب فعلی؛ با عوض‌شدن فهرست به اولین آیتم برمی‌گردد
const selected = linkedSignal(() => items()[0]);
selected.set('b');       // کاربر عوضش می‌کند
items.set(['x', 'y']);   // منبع عوض شد
console.log(selected()); // 'x'
```

## ۳. کدام اپراتور flattening را کِی انتخاب می‌کنی؟

**جواب:** بر اساس هم‌زمانی: `switchMap` آخرین درخواست مهم است (جست‌وجو)، `concatMap` ترتیب مهم است (ذخیره‌های پشت‌سرهم)، `mergeMap` همه هم‌زمان با سقف (آپلود)، `exhaustMap` تا تمام‌شدن درخواست فعلی بقیه را نادیده بگیر (دکمهٔ پرداخت). برای **نوشتن** (POST) از `switchMap` پرهیز می‌کنم چون لغو سمت کلاینت یعنی نتیجه ممکن است گم شود، در حالی که سرور انجامش داده.

## ۴. چرا subscribe تودرتو بد است و چطور درستش می‌کنی؟

**جواب:** نشتی subscription، callback hell، و نبود لغو. با اپراتور flattening و `takeUntilDestroyed` یا `async` pipe جایگزین می‌شود.

```typescript
import { Observable, switchMap } from 'rxjs';

declare function getUser(id: number): Observable<{ teamId: number }>;
declare function getTeam(id: number): Observable<{ name: string }>;

// ✗ تودرتو
getUser(1).subscribe((u) => getTeam(u.teamId).subscribe((t) => console.log(t.name)));

// ✓ یک جریان؛ با unsubscribe بیرونی هر دو لغو می‌شوند
getUser(1)
  .pipe(switchMap((u) => getTeam(u.teamId)))
  .subscribe((t) => console.log(t.name));
```

## ۵. shareReplay چه مشکلی می‌تواند بسازد؟

**جواب:** در RxJS 7 با `shareReplay(1)` بدون `refCount` اتصال به منبع تا آخر عمر برنامه باز می‌ماند (حتی بعد از رفتن همهٔ subscriberها). `shareReplay({ bufferSize: 1, refCount: true })` وقتی آخرین subscriber رفت اتصال را قطع می‌کند. برای داده‌ای که باید تازه شود از `switchMap` روی یک trigger استفاده می‌کنم.

## ۶. Observable در برابر Promise؟

**جواب:** Promise **یک** مقدار می‌دهد، **مشتاق** (eager) است و لغو ندارد. Observable **چند** مقدار می‌دهد، **تنبل** است، لغو‌پذیر است (`unsubscribe` درخواست HTTP را abort می‌کند) و اپراتور دارد. در عوض Promise با `async/await` خواناتر است؛ برای یک مقدار ساده `firstValueFrom` پل خوبی است.

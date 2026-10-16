وقتی هر مقدار باید یک Observable داخلی بسازد (مثلاً یک درخواست HTTP)، به اپراتور **flattening** نیاز داری. انتخاب اپراتور یعنی تصمیم دربارهٔ **هم‌زمانی**؛ اشتباهش رایج‌ترین باگ RxJS است.

| اپراتور | رفتار | کاربرد |
|---|---|---|
| `switchMap` | درخواست قبلی را لغو می‌کند، فقط آخری می‌ماند | جست‌وجو، autocomplete، بارگذاری با تغییر پارامتر |
| `concatMap` | یکی‌یکی و به ترتیب اجرا می‌کند | ذخیرهٔ پشت‌سرهم که ترتیبش مهم است |
| `mergeMap` | همه هم‌زمان اجرا می‌شوند | آپلود چند فایل (با سقف هم‌زمانی) |
| `exhaustMap` | تا تمام نشده، مقدارهای جدید را نادیده می‌گیرد | دکمهٔ ورود/پرداخت (جلوگیری از کلیک دوباره) |

## مثال

```typescript
import { Subject, of } from 'rxjs';
import { concatMap, delay, exhaustMap, mergeMap, switchMap } from 'rxjs/operators';

const click$ = new Subject<number>();
const slow = (n: number) => of(`result ${n}`).pipe(delay(100));

click$.pipe(switchMap(slow)).subscribe((r) => console.log('switch', r));
click$.pipe(concatMap(slow)).subscribe((r) => console.log('concat', r));
click$.pipe(mergeMap(slow, 2)).subscribe((r) => console.log('merge', r)); // حداکثر ۲ هم‌زمان
click$.pipe(exhaustMap(slow)).subscribe((r) => console.log('exhaust', r));

click$.next(1);
click$.next(2);
// switch  → فقط result 2
// concat  → result 1 سپس result 2
// merge   → هر دو (ترتیب = ترتیب پایان)
// exhaust → فقط result 1
```

## نکته‌های سنیور

- `switchMap` برای **نوشتن** (POST/DELETE) خطرناک است: لغو شدن درخواست روی کلاینت یعنی سرور ممکن است آن را انجام داده باشد ولی نتیجه گم شود. برای نوشتن `concatMap` یا `exhaustMap` بگذار.
- `mergeMap` بدون سقف می‌تواند صدها درخواست هم‌زمان بسازد؛ پارامتر دوم (`concurrent`) را بده.
- خطا را **داخل** Observable داخلی بگیر (`catchError` در `switchMap`) وگرنه جریان بیرونی با اولین خطا می‌میرد (به درس «خطا و retry» نگاه کن).

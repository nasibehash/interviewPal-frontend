چند جریان را به یکی تبدیل می‌کنی. تفاوت اپراتورها در **زمان emit** و **تعداد انتظار** است.

| اپراتور | چه وقت مقدار می‌دهد | مثال کاربرد |
|---|---|---|
| `combineLatest` | بعد از اینکه همه حداقل یک مقدار داده‌اند، با هر تغییر | فیلتر + مرتب‌سازی → فهرست |
| `forkJoin` | وقتی همه **complete** شدند، آخرین مقدارها | چند درخواست مستقل در شروع صفحه |
| `withLatestFrom` | با هر مقدار منبع اصلی، آخرین مقدار بقیه را می‌گیرد (بقیه محرک نیستند) | کلیک ذخیره + مقدار فعلی فرم |
| `merge` | هر مقدار هر منبع، همان لحظه | چند منبع رویداد به یک handler |
| `zip` | جفت‌به‌جفت، منتظر هر منبع | نادر؛ تطبیق دو جریان هم‌ریتم |

## مثال

```typescript
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, combineLatest, forkJoin } from 'rxjs';
import { map } from 'rxjs/operators';

interface Product { id: number; name: string; price: number }

@Injectable({ providedIn: 'root' })
export class ProductsFacade {
  private readonly http = inject(HttpClient);
  readonly search$ = new BehaviorSubject('');
  readonly sort$ = new BehaviorSubject<'name' | 'price'>('name');

  private readonly all$ = this.http.get<Product[]>('/api/products');

  // با تغییر هرکدام از search$ و sort$ دوباره حساب می‌شود
  readonly visible$ = combineLatest([this.all$, this.search$, this.sort$]).pipe(
    map(([all, q, sort]) =>
      all
        .filter((p) => p.name.includes(q))
        .sort((a, b) => (sort === 'name' ? a.name.localeCompare(b.name) : a.price - b.price)),
    ),
  );

  // دو درخواست مستقل، یک نتیجه
  loadDashboard() {
    return forkJoin({
      user: this.http.get<{ name: string }>('/api/me'),
      stats: this.http.get<{ total: number }>('/api/stats'),
    });
  }
}
```

## نکته‌های سنیور

- `forkJoin` روی جریانی که هیچ‌وقت complete نمی‌شود (Subject، رویداد) **هرگز** مقدار نمی‌دهد؛ برای HTTP عالی است.
- اگر یکی از منابع `combineLatest` مقدار اولیه نداشته باشد، خروجی نمی‌آید؛ `startWith` یا `BehaviorSubject` بده.
- `forkJoin([])` با آرایهٔ خالی بلافاصله complete می‌شود، بدون مقدار.

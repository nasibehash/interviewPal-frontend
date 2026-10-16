Signal یک مقدار reactive است که Angular می‌داند چه کسی آن را می‌خواند؛ با تغییرش فقط همان بخش‌ها به‌روز می‌شوند. سه ابزار اصلی:

- `signal(v)`: state قابل‌نوشتن (`set` و `update`)
- `computed(() => ...)`: مقدار **مشتق‌شده**، تنبل و cache‌شده، فقط‌خواندنی
- `effect(() => ...)`: **اثر جانبی** وقتی وابستگی‌ها عوض شود (لاگ، sync با storage، DOM دستی)

## مثال: سبد خرید

```typescript
import { Injectable, computed, effect, signal, untracked } from '@angular/core';

interface Item { id: number; price: number; qty: number }

@Injectable({ providedIn: 'root' })
export class Cart {
  private readonly _items = signal<Item[]>([]);
  readonly items = this._items.asReadonly();

  readonly total = computed(() => this._items().reduce((sum, i) => sum + i.price * i.qty, 0));
  readonly isEmpty = computed(() => this._items().length === 0);

  add(item: Item) {
    // immutable: آرایهٔ جدید بساز، نه push
    this._items.update((list) => [...list, item]);
  }

  constructor() {
    effect(() => {
      const items = this._items();
      // untracked: خواندن بدون وابسته‌شدن
      const user = untracked(() => localStorage.getItem('user'));
      localStorage.setItem(`cart:${user}`, JSON.stringify(items));
    });
  }
}
```

## نکته‌های سنیور

- مشتق = `computed`، نه `effect` که یک signal دیگر را `set` کند. effect برای ارتباط با **دنیای بیرون** است.
- اگر ورودی تغییر کند ولی مقدار برابر (`Object.is`) باشد، چیزی منتشر نمی‌شود؛ پس mutate کردن آبجکت/آرایه تغییر را نمی‌بیند.
- `computed` فقط وابستگی‌هایی را دنبال می‌کند که **واقعاً خوانده شده‌اند** (شاخهٔ `if` نخوانده، وابستگی نیست).
- `effect` پیش‌فرض داخل injection context ساخته می‌شود و با نابودی صاحبش خودکار پاک می‌شود. نوشتن در signal داخل effect به‌طور پیش‌فرض ممنوع است.
- مقدار signal در قالب با `()` خوانده می‌شود: `{{ total() }}`.

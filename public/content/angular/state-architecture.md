بیشتر اپ‌ها به store سنگین (NgRx) نیاز ندارند. یک **سرویس با signal** برای state مشترک کافی است؛ هرچه state به دامنهٔ کوچک‌تری محدود باشد بهتر.

## قواعد

- **منبع حقیقت واحد:** هر state یک مالک دارد؛ بقیه فقط می‌خوانند (`asReadonly`).
- **مشتق‌ها `computed`**، تغییرها فقط از طریق متدهای سرویس.
- کامپوننت **smart** (با سرویس حرف می‌زند) و **dumb** (فقط `input`/`output`): dumb را راحت تست و reuse می‌کنی.
- ساختار feature-محور: `features/orders/` شامل صفحه‌ها، کامپوننت‌ها، سرویس و route همان feature.

## مثال: store یک feature

```typescript
import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

interface Todo { id: number; title: string; done: boolean }

@Injectable({ providedIn: 'root' })
export class TodoStore {
  private readonly http = inject(HttpClient);

  private readonly state = signal({ items: [] as Todo[], loading: false, error: null as string | null });

  readonly items = computed(() => this.state().items);
  readonly loading = computed(() => this.state().loading);
  readonly error = computed(() => this.state().error);
  readonly remaining = computed(() => this.items().filter((t) => !t.done).length);

  async load() {
    this.state.update((s) => ({ ...s, loading: true, error: null }));
    try {
      const items = await firstValueFrom(this.http.get<Todo[]>('/api/todos'));
      this.state.update((s) => ({ ...s, items, loading: false }));
    } catch {
      this.state.update((s) => ({ ...s, loading: false, error: 'بارگذاری نشد' }));
    }
  }

  async toggle(id: number) {
    const before = this.items();
    // optimistic update، با rollback در صورت خطا
    this.state.update((s) => ({ ...s, items: s.items.map((t) => (t.id === id ? { ...t, done: !t.done } : t)) }));
    try {
      await firstValueFrom(this.http.patch(`/api/todos/${id}`, {}));
    } catch {
      this.state.update((s) => ({ ...s, items: before, error: 'ذخیره نشد' }));
    }
  }
}
```

## نکته‌های سنیور

- State را immutable به‌روز کن (`{ ...s, x }`)؛ mutate کردن signal را خبر نمی‌دهد.
- `providedIn: 'root'` برای state سراسری، provider در route برای state ویژهٔ یک feature (با خروج از صفحه پاک می‌شود).
- NgRx SignalStore (`signalStore`) وقتی ارزش دارد که تیم بزرگ است و به الگوی یکسان، devtools و entity management نیاز دارید.
- State سرور (cache) را با `httpResource`/Query library نگه دار، state رابط (مودال باز/بسته) را در signal محلی.

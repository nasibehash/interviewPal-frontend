APIهای مبتنی بر signal جای decoratorهای `@Input`، `@Output` و `@ViewChild` را گرفته‌اند. همه type-safe‌اند و با `computed` و `effect` ترکیب می‌شوند.

| API | جایگزین / کار |
|---|---|
| `input<T>(default)` / `input.required<T>()` | `@Input` (فقط‌خواندنی) |
| `model<T>()` | `@Input` + `@Output` دوطرفه (`[(value)]`) |
| `output<T>()` | `@Output` (بدون EventEmitter) |
| `viewChild()` / `viewChildren()` | `@ViewChild` / `@ViewChildren` |
| `contentChild()` | `@ContentChild` |

## مثال

```typescript
import { Component, ElementRef, computed, input, model, output, viewChild } from '@angular/core';

@Component({
  selector: 'app-rating',
  template: `
    <div #box tabindex="0">
      @for (s of stars(); track s) {
        <button (click)="pick(s)" [attr.aria-pressed]="s <= value()">★</button>
      }
    </div>
  `,
})
export class Rating {
  readonly max = input(5);                              // اختیاری با مقدار پیش‌فرض
  readonly label = input.required<string>();            // اجباری
  readonly value = model(0);                            // [(value)]="rating"
  readonly rated = output<number>();                    // (rated)="..."

  protected readonly stars = computed(() => Array.from({ length: this.max() }, (_, i) => i + 1));
  private readonly box = viewChild.required<ElementRef<HTMLElement>>('box');

  protected pick(n: number) {
    this.value.set(n);       // والد هم به‌روز می‌شود
    this.rated.emit(n);
    this.box().nativeElement.focus();
  }
}
```

## نکته‌های سنیور

- `input` فقط‌خواندنی است؛ برای نسخهٔ قابل‌ویرایش از `linkedSignal` یا `model` استفاده کن.
- `input` را در constructor نمی‌شود خواند (هنوز مقدار نیامده)؛ در `computed`/`effect`/قالب بخوان.
- `input({ transform: booleanAttribute })` و `numberAttribute` تبدیل attribute رشته‌ای را تمیز می‌کنند.
- `viewChild` یک signal است: قبل از رندر `undefined` و با `viewChild.required` پرتاب خطا؛ دیگر `ngAfterViewInit` لازم نیست.
- با `withComponentInputBinding()` پارامتر route و query هم مستقیم به `input` می‌رسد.

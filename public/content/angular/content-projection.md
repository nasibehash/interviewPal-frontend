Content projection یعنی کامپوننت **قالب خالی** بدهد و محتوا را والد پر کند. پایهٔ کامپوننت‌های قابل‌استفاده‌مجدد (card، dialog، tabs).

## مثال

```typescript
import { Component, TemplateRef, contentChild, input } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';

@Component({
  selector: 'app-card',
  imports: [NgTemplateOutlet],
  template: `
    <header><ng-content select="[card-title]" /></header>
    <section><ng-content /></section>                       <!-- محتوای پیش‌فرض -->
    <footer>
      @if (footer(); as tpl) {
        <ng-container [ngTemplateOutlet]="tpl" [ngTemplateOutletContext]="{ $implicit: count() }" />
      } @else {
        <ng-content select="[card-footer]">پیش‌فرض</ng-content>
      }
    </footer>
  `,
})
export class Card {
  readonly count = input(0);
  protected readonly footer = contentChild<TemplateRef<unknown>>('footer');
}
```

```html
<app-card [count]="3">
  <h2 card-title>عنوان</h2>
  متن کارت
  <ng-template #footer let-n>{{ n }} مورد</ng-template>
</app-card>
```

## نکته‌های سنیور

- `select` با CSS selector (`[attr]`، `tag`، `.class`) محتوا را به slot مشخص می‌برد؛ `ng-content` بدون select همه‌چیز باقی‌مانده را می‌گیرد.
- محتوای projected **در والد** ساخته می‌شود (حتی اگر نمایش داده نشود)؛ برای ساخت تنبل از `ng-template` + `ngTemplateOutlet` استفاده کن.
- Directive مرکب: `hostDirectives: [Tooltip]` قابلیت‌ها را بدون ارث‌بری به یک کامپوننت اضافه می‌کند و `inputs/outputs` را ظاهر می‌کند.
- گذاشتن `<ng-content>` داخل `@if` محتوا را از ساخته‌شدن **جلوگیری نمی‌کند**: محتوای projected همیشه ساخته می‌شود و فقط نمایش داده نمی‌شود.

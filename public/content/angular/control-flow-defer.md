قالب‌های مدرن Angular کنترل‌فلو را در خود زبان قالب دارند (نه directive). سریع‌تر، type-safe و بدون import اضافه‌اند.

## مثال

```html
@let total = cart.total();

@if (items().length) {
  <ul>
    @for (item of items(); track item.id; let i = $index) {
      <li [class.odd]="$odd">{{ i + 1 }}. {{ item.name }}</li>
    } @empty {
      <li>موردی نیست</li>
    }
  </ul>
} @else {
  <p>سبد خالی است</p>
}

@switch (status()) {
  @case ('loading') { <app-spinner /> }
  @case ('error') { <p role="alert">خطا</p> }
  @default { <p>مجموع: {{ total }}</p> }
}

<!-- بارگذاری تنبل: کد کامپوننت در chunk جدا می‌رود -->
@defer (on viewport; prefetch on idle) {
  <app-heavy-chart [data]="data()" />
} @placeholder (minimum 300ms) {
  <div class="skeleton"></div>
} @loading (after 100ms; minimum 500ms) {
  <app-spinner />
} @error {
  <p>بارگذاری نشد</p>
}
```

## نکته‌های سنیور

- `track` در `@for` **اجباری** است. با `track item.id` DOM هر آیتم حفظ می‌شود؛ `track $index` فقط برای فهرست ثابت.
- `@defer` فقط برای کامپوننت‌هایی که **standalone** هستند و جای دیگر در همان فایل مستقیم استفاده نشده‌اند (وگرنه در bundle اصلی می‌مانند).
- triggerها: `on idle` (پیش‌فرض)، `on viewport`، `on interaction`، `on hover`، `on timer(2s)`، `when expr`. با `prefetch` می‌توان بارگیری و نمایش را جدا کرد.
- `@let` متغیر محلی قالب است؛ به‌جای تکرار `a()?.b?.c()` یا `| async` چندباره.
- `@placeholder` و `@loading` برای جلوگیری از پرش چیدمان (CLS) سایز ثابت بده.

Angular دو API فرم دارد: **Reactive Forms** (بالغ و رایج) و **Signal Forms** (جدید در 22؛ مدل فرم یک signal ساده است). هر دو type-safe‌اند.

## Reactive Forms (typed)

```typescript
import { Component, inject } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Observable, map, of, timer, switchMap } from 'rxjs';

const strongPassword = (c: AbstractControl<string>): ValidationErrors | null =>
  /\d/.test(c.value) && c.value.length >= 8 ? null : { weak: true };

const matches = (a: string, b: string) => (g: AbstractControl): ValidationErrors | null =>
  g.get(a)?.value === g.get(b)?.value ? null : { mismatch: true };

@Component({
  selector: 'app-signup',
  imports: [ReactiveFormsModule],
  template: `
    <form [formGroup]="form" (ngSubmit)="submit()">
      <input formControlName="email" />
      <input type="password" formControlName="password" />
      <input type="password" formControlName="confirm" />
      @if (form.hasError('mismatch') && form.controls.confirm.touched) { <p>تکرار رمز یکی نیست</p> }
      <button [disabled]="form.invalid || form.pending">ثبت</button>
    </form>
  `,
})
export class Signup {
  private readonly fb = inject(FormBuilder).nonNullable; // مقدار null نمی‌شود، reset به مقدار اولیه

  protected readonly form = this.fb.group(
    {
      email: this.fb.control('', [Validators.required, Validators.email], [(c) => this.emailFree(c.value)]),
      password: this.fb.control('', [Validators.required, strongPassword]),
      confirm: this.fb.control(''),
    },
    { validators: [matches('password', 'confirm')] }, // validator سطح گروه
  );

  // validator async: با debounce و لغو خودکار (switchMap)
  private emailFree(email: string): Observable<ValidationErrors | null> {
    return timer(300).pipe(switchMap(() => of(email !== 'taken@example.com')), map((free) => (free ? null : { taken: true })));
  }

  submit() {
    if (this.form.valid) console.log(this.form.getRawValue()); // نوع دقیق: { email: string; ... }
  }
}
```

## Signal Forms (22)

```typescript
import { Component, signal } from '@angular/core';
import { FormField, FormRoot, email, form, required, validate } from '@angular/forms/signals';

@Component({
  selector: 'app-login',
  imports: [FormField, FormRoot],
  template: `
    <form [formRoot]="login">
      <input [formField]="login.email" />
      <button>ورود</button>
    </form>
  `,
})
export class Login {
  protected readonly login = form(
    signal({ email: '', password: '' }),
    (path) => {
      required(path.email, { message: 'ایمیل را وارد کن' });
      email(path.email, { message: 'ایمیل معتبر نیست' });
      validate(path.password, ({ value }) => (value().length < 8 ? { kind: 'short', message: 'حداقل ۸ کاراکتر' } : undefined));
    },
  );
}
```

## نکته‌های سنیور

- `nonNullable` و `getRawValue()` را فراموش نکن؛ `value` فیلدهای disabled را ندارد.
- validator همگام را روی خود کنترل و cross-field را روی **گروه** بگذار؛ async validator فقط وقتی همگام‌ها معتبرند اجرا می‌شود.
- `updateOn: 'blur'` اعتبارسنجی را به خروج از فیلد می‌برد (کمتر پرش).
- برای فیلد سفارشی `ControlValueAccessor` (Reactive) یا یک کامپوننت با `model()` (Signal Forms) بساز.
- پروژهٔ جدید: Signal Forms؛ کد قدیمی را لازم نیست فوراً مهاجرت دهی، دو API کنار هم کار می‌کنند.

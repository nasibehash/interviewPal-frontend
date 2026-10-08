import { Component, inject, input, signal } from '@angular/core';
import { FormField, FormRoot, email, form, maxLength, minLength, required, validate } from '@angular/forms/signals';
import { Router, RouterLink } from '@angular/router';
import { AuthStore } from '../../core/auth-store';
import { FieldErrors } from '../../shared/field-errors';
import { registerMessage, safeRedirect } from './auth-messages';

@Component({
  selector: 'app-register-page',
  imports: [FormField, FormRoot, FieldErrors, RouterLink],
  templateUrl: './register-page.html',
  styleUrl: './auth-form.scss',
})
export class RegisterPage {
  private readonly auth = inject(AuthStore);
  private readonly router = inject(Router);

  readonly redirect = input<string>();
  protected readonly error = signal<string | null>(null);

  protected readonly register = form(
    signal({ displayName: '', email: '', password: '', confirmPassword: '' }),
    (path) => {
      required(path.displayName, { message: 'نام را وارد کن.' });
      minLength(path.displayName, 2, { message: 'نام حداقل ۲ کاراکتر باشد.' });
      maxLength(path.displayName, 40, { message: 'نام حداکثر ۴۰ کاراکتر باشد.' });

      required(path.email, { message: 'ایمیل را وارد کن.' });
      email(path.email, { message: 'ایمیل معتبر نیست.' });

      required(path.password, { message: 'رمز عبور را وارد کن.' });
      minLength(path.password, 8, { message: 'رمز عبور حداقل ۸ کاراکتر باشد.' });
      maxLength(path.password, 128, { message: 'رمز عبور حداکثر ۱۲۸ کاراکتر باشد.' });
      // the same rules as the server, so the learner learns about them before sending
      validate(path.password, ({ value }) =>
        /^\d+$/.test(value()) ? { kind: 'digitsOnly', message: 'رمز عبور نباید فقط عدد باشد.' } : undefined,
      );
      validate(path.password, ({ value, valueOf }) =>
        value() !== '' && value().toLowerCase() === valueOf(path.email).trim().toLowerCase()
          ? { kind: 'sameAsEmail', message: 'رمز عبور نباید با ایمیل یکی باشد.' }
          : undefined,
      );

      // cross-field rule: valueOf() reads another field of the same form
      validate(path.confirmPassword, ({ value, valueOf }) =>
        value() !== valueOf(path.password) ? { kind: 'mismatch', message: 'تکرار رمز عبور با رمز عبور یکی نیست.' } : undefined,
      );
    },
    {
      submission: {
        action: async (field) => {
          const { displayName, email, password } = field().value();
          this.error.set(null);
          try {
            await this.auth.register(email.trim(), password, displayName.trim());
            await this.router.navigateByUrl(safeRedirect(this.redirect()));
          } catch (e) {
            this.error.set(registerMessage(e));
          }
        },
      },
    },
  );
}

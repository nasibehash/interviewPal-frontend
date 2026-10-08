import { Component, inject, input, signal } from '@angular/core';
import { FormField, FormRoot, email, form, required } from '@angular/forms/signals';
import { Router, RouterLink } from '@angular/router';
import { AuthStore } from '../../core/auth-store';
import { FieldErrors } from '../../shared/field-errors';
import { loginMessage, safeRedirect } from './auth-messages';

@Component({
  selector: 'app-login-page',
  imports: [FormField, FormRoot, FieldErrors, RouterLink],
  templateUrl: './login-page.html',
  styleUrl: './auth-form.scss',
})
export class LoginPage {
  private readonly auth = inject(AuthStore);
  private readonly router = inject(Router);

  /** ?redirect=/account : where to go after logging in (query parameters bind to inputs). */
  readonly redirect = input<string>();
  /** ?changed=1 : set after a password change, which ends every session. */
  readonly changed = input<string>();

  protected readonly error = signal<string | null>(null);

  protected readonly login = form(
    signal({ email: '', password: '' }),
    (path) => {
      required(path.email, { message: 'ایمیل را وارد کن.' });
      email(path.email, { message: 'ایمیل معتبر نیست.' });
      required(path.password, { message: 'رمز عبور را وارد کن.' });
    },
    {
      submission: {
        action: async (field) => {
          const { email, password } = field().value();
          this.error.set(null);
          try {
            await this.auth.login(email.trim(), password);
            await this.router.navigateByUrl(safeRedirect(this.redirect()));
          } catch (e) {
            this.error.set(loginMessage(e));
          }
        },
      },
    },
  );
}

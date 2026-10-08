import { DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormField, FormRoot, form, maxLength, minLength, required, validate } from '@angular/forms/signals';
import { Router } from '@angular/router';
import { ApiError } from '../../core/api-error';
import { AuthStore } from '../../core/auth-store';
import { ProgressStore } from '../../core/progress-store';
import { FieldErrors } from '../../shared/field-errors';

@Component({
  selector: 'app-account-page',
  imports: [DatePipe, FormField, FormRoot, FieldErrors],
  templateUrl: './account-page.html',
  styleUrl: './account-page.scss',
})
export class AccountPage {
  protected readonly auth = inject(AuthStore);
  protected readonly progress = inject(ProgressStore);
  private readonly router = inject(Router);

  protected readonly passwordError = signal<string | null>(null);
  protected readonly deleteError = signal<string | null>(null);
  protected readonly confirmingDelete = signal(false);

  protected readonly password = form(
    signal({ currentPassword: '', newPassword: '', confirmPassword: '' }),
    (path) => {
      required(path.currentPassword, { message: 'رمز عبور فعلی را وارد کن.' });
      required(path.newPassword, { message: 'رمز عبور جدید را وارد کن.' });
      minLength(path.newPassword, 8, { message: 'رمز عبور حداقل ۸ کاراکتر باشد.' });
      maxLength(path.newPassword, 128, { message: 'رمز عبور حداکثر ۱۲۸ کاراکتر باشد.' });
      validate(path.newPassword, ({ value }) =>
        /^\d+$/.test(value()) ? { kind: 'digitsOnly', message: 'رمز عبور نباید فقط عدد باشد.' } : undefined,
      );
      validate(path.confirmPassword, ({ value, valueOf }) =>
        value() !== valueOf(path.newPassword) ? { kind: 'mismatch', message: 'تکرار رمز عبور با رمز جدید یکی نیست.' } : undefined,
      );
    },
    {
      submission: {
        action: async (field) => {
          const { currentPassword, newPassword } = field().value();
          this.passwordError.set(null);
          try {
            // the server ends every session, so the learner logs in again with the new password
            await this.auth.changePassword(currentPassword, newPassword);
            await this.router.navigate(['/login'], { queryParams: { changed: 1 } });
          } catch (e) {
            this.passwordError.set(
              e instanceof ApiError && e.status === 400 ? 'رمز عبور فعلی درست نیست.' : 'رمز عبور عوض نشد. دوباره تلاش کن.',
            );
          }
        },
      },
    },
  );

  protected readonly deletion = form(
    signal({ password: '' }),
    (path) => required(path.password, { message: 'برای حذف، رمز عبور را وارد کن.' }),
    {
      submission: {
        action: async (field) => {
          this.deleteError.set(null);
          try {
            await this.auth.deleteAccount(field().value().password);
            await this.router.navigateByUrl('/');
          } catch (e) {
            this.deleteError.set(
              e instanceof ApiError && e.status === 400 ? 'رمز عبور درست نیست.' : 'حساب حذف نشد. دوباره تلاش کن.',
            );
          }
        },
      },
    },
  );

  protected async logout(): Promise<void> {
    await this.auth.logout();
    await this.router.navigateByUrl('/');
  }
}

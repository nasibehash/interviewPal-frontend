import { Component, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { ApiClient } from '../core/api-client';
import { ReportReason } from '../core/models';

const REASONS: { value: ReportReason; label: string }[] = [
  { value: 'WrongAnswer', label: 'جواب اشتباه است' },
  { value: 'Outdated', label: 'قدیمی شده' },
  { value: 'Unclear', label: 'مبهم است' },
  { value: 'Typo', label: 'غلط نگارشی' },
  { value: 'Other', label: 'مورد دیگر' },
];

@Component({
  selector: 'app-report-dialog',
  imports: [FormsModule],
  template: `
    @if (state() === 'sent') {
      <p class="muted">ممنون! گزارشت ثبت شد.</p>
    } @else if (!open()) {
      <button type="button" class="link" (click)="open.set(true)">گزارش مشکل این سؤال</button>
    } @else {
      <form (submit)="send($event)">
        <select [(ngModel)]="reason" name="reason" aria-label="دلیل گزارش">
          @for (r of reasons; track r.value) {
            <option [value]="r.value">{{ r.label }}</option>
          }
        </select>
        <input [(ngModel)]="message" name="message" maxlength="500" placeholder="توضیح (اختیاری)" aria-label="توضیح" />
        <button class="btn primary" [disabled]="state() === 'sending'">ارسال</button>
        <button class="btn" type="button" (click)="open.set(false)">انصراف</button>
        @if (state() === 'error') {
          <span class="error">ارسال نشد، دوباره تلاش کن.</span>
        }
      </form>
    }
  `,
  styles: `
    .link { font: inherit; background: none; border: 0; color: var(--muted); text-decoration: underline; cursor: pointer; padding: 0; }
    form { display: flex; flex-wrap: wrap; gap: 0.5rem; align-items: center; }
    select, input { font: inherit; padding: 0.4rem 0.6rem; border-radius: 0.6rem; border: 1px solid var(--border); background: var(--surface); color: var(--text); }
    input { flex: 1; min-inline-size: 10rem; }
  `,
})
export class ReportDialog {
  readonly questionId = input.required<string>();
  private readonly api = inject(ApiClient);

  protected readonly reasons = REASONS;
  protected readonly open = signal(false);
  protected readonly state = signal<'idle' | 'sending' | 'sent' | 'error'>('idle');
  protected reason: ReportReason = 'WrongAnswer';
  protected message = '';

  protected async send(event: Event): Promise<void> {
    event.preventDefault();
    this.state.set('sending');
    try {
      await firstValueFrom(this.api.report(this.questionId(), this.reason, this.message.trim() || null));
      this.state.set('sent');
    } catch {
      this.state.set('error');
    }
  }
}

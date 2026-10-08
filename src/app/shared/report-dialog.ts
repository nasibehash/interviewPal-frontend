import { Component, inject, input, signal } from '@angular/core';
import { FormField, FormRoot, form, maxLength, required } from '@angular/forms/signals';
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

interface ReportModel {
  reason: ReportReason;
  message: string;
}

/** Report a wrong / outdated / unclear question. A signal form: the model is a plain signal. */
@Component({
  selector: 'app-report-dialog',
  imports: [FormField, FormRoot],
  templateUrl: './report-dialog.html',
  styleUrl: './report-dialog.scss',
})
export class ReportDialog {
  readonly questionId = input.required<string>();
  private readonly api = inject(ApiClient);

  protected readonly reasons = REASONS;
  protected readonly open = signal(false);
  protected readonly state = signal<'idle' | 'sent' | 'error'>('idle');

  protected readonly report = form(
    signal<ReportModel>({ reason: 'WrongAnswer', message: '' }),
    (path) => {
      required(path.reason);
      maxLength(path.message, 500);
    },
    {
      // <form [formRoot]> calls this on submit, only when the form is valid
      submission: {
        action: async (field) => {
          const { reason, message } = field().value();
          try {
            await firstValueFrom(
              this.api.report(this.questionId(), reason, message.trim() || null),
            );
            this.state.set('sent');
          } catch {
            this.state.set('error');
          }
        },
      },
    },
  );
}

import { DatePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { PracticeSessionStore } from '../../core/practice-session';
import { ProgressStore } from '../../core/progress-store';

@Component({
  selector: 'app-history-page',
  imports: [RouterLink, DatePipe],
  templateUrl: './history-page.html',
  styleUrl: './history-page.scss',
})
export class HistoryPage {
  protected readonly progress = inject(ProgressStore);
  private readonly store = inject(PracticeSessionStore);
  private readonly router = inject(Router);
  protected readonly error = this.store.error;

  protected readonly modeLabels = {
    Learning: 'یادگیری',
    Interview: 'مصاحبه',
    Flashcard: 'فلش‌کارت',
  };

  protected async practiceWeak(): Promise<void> {
    await this.store.startFromQuestions(this.progress.weakQuestions().map((q) => q.id));
    if (this.store.phase() === 'practicing') {
      await this.router.navigateByUrl('/practice');
    }
  }

  protected async clear(): Promise<void> {
    if (confirm('همهٔ تاریخچه و پیشرفت پاک شود؟')) {
      await this.progress.clear();
    }
  }
}

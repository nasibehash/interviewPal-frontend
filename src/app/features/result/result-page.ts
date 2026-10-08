import { Component, computed, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthStore } from '../../core/auth-store';
import { PracticeSessionStore } from '../../core/practice-session';
import { AnswerPanel } from '../../shared/answer-panel';
import { MarkdownPipe } from '../../shared/markdown.pipe';
import { LEVEL_LABELS } from '../../shared/question-view';
import { Level } from '../../core/models';

@Component({
  selector: 'app-result-page',
  imports: [RouterLink, AnswerPanel, MarkdownPipe],
  templateUrl: './result-page.html',
  styleUrl: './result-page.scss',
})
export class ResultPage {
  protected readonly store = inject(PracticeSessionStore);
  protected readonly auth = inject(AuthStore);
  private readonly router = inject(Router);

  protected readonly evaluation = computed(() => this.store.evaluation());
  protected readonly byId = computed(() => new Map(this.store.questions().map((q) => [q.id, q])));
  protected readonly levelLabel = (key: string): string => LEVEL_LABELS[key as Level] ?? key;

  protected readonly verdict = computed(() => {
    const p = this.evaluation()?.percent ?? 0;
    if (p >= 80) return 'عالی! آمادهٔ مصاحبه‌ای.';
    if (p >= 60) return 'خوب است؛ چند مبحث را مرور کن.';
    return 'هنوز جا برای تمرین هست؛ سراغ سؤال‌های ضعیف برو.';
  });

  protected async retryWeak(): Promise<void> {
    const ids = this.evaluation()?.weakQuestionIds ?? [];
    await this.store.startFromQuestions(ids);
    if (this.store.phase() === 'practicing') {
      await this.router.navigateByUrl('/practice');
    }
  }

  protected newPractice(): void {
    this.store.reset();
    void this.router.navigateByUrl('/');
  }
}

import { Component, OnDestroy, computed, effect, inject, signal, untracked } from '@angular/core';
import { Router } from '@angular/router';
import { Question, isChoiceQuestion } from '../../core/models';
import { PracticeSessionStore } from '../../core/practice-session';
import { AnswerPanel } from '../../shared/answer-panel';
import { QuestionView } from '../../shared/question-view';
import { MarkdownPipe } from '../../shared/markdown.pipe';
import { ReportDialog } from '../../shared/report-dialog';

export const formatClock = (totalSeconds: number): string => {
  const s = Math.max(0, Math.floor(totalSeconds));
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
};

@Component({
  selector: 'app-practice-page',
  imports: [QuestionView, AnswerPanel, ReportDialog, MarkdownPipe],
  templateUrl: './practice-page.html',
  styleUrl: './practice-page.scss',
})
export class PracticePage implements OnDestroy {
  protected readonly store = inject(PracticeSessionStore);
  private readonly router = inject(Router);

  private readonly now = signal(Date.now());
  private readonly timer = setInterval(() => this.now.set(Date.now()), 1000);

  protected readonly isChoice = isChoiceQuestion;

  protected readonly remaining = computed(() => {
    const limit = this.store.session()?.timeLimitSeconds;
    if (this.store.mode() !== 'Interview' || !limit) return null;
    return limit - (this.now() - this.store.startedAt()) / 1000;
  });
  protected readonly clock = computed(() => {
    const r = this.remaining();
    return r === null ? null : formatClock(r);
  });

  protected readonly progressPercent = computed(() => {
    const total = this.store.questions().length;
    return total ? Math.round(((this.store.index() + 1) / total) * 100) : 0;
  });

  /** Learning and flashcard modes show the answer as soon as it is revealed; interview mode never does before the end. */
  protected readonly revealed = computed(() => {
    const q = this.store.current();
    return q ? (this.store.revealed()[q.id] ?? null) : null;
  });
  protected readonly selectedChoice = computed(() => {
    const q = this.store.current();
    return q ? (this.store.answers()[q.id]?.choiceId ?? null) : null;
  });
  protected readonly note = computed(() => {
    const q = this.store.current();
    return q ? (this.store.notes()[q.id] ?? '') : '';
  });
  protected readonly graded = computed(() => {
    const q = this.store.current();
    return q ? this.store.correctness()[q.id] : undefined;
  });

  constructor() {
    // The time is up: submit whatever has been answered.
    effect(() => {
      const r = this.remaining();
      if (r !== null && r <= 0 && this.store.phase() === 'practicing') {
        untracked(() => void this.finish());
      }
    });
    effect(() => {
      if (this.store.phase() === 'finished') {
        untracked(() => void this.router.navigateByUrl('/result'));
      }
    });
  }

  ngOnDestroy(): void {
    clearInterval(this.timer);
  }

  protected choiceState(q: Question, choiceId: number): 'correct' | 'wrong' | 'selected' | '' {
    const answer = this.revealed();
    if (answer && this.store.mode() !== 'Interview') {
      if (answer.correctChoiceIds.includes(choiceId)) return 'correct';
      if (this.selectedChoice() === choiceId) return 'wrong';
      return '';
    }
    return this.selectedChoice() === choiceId ? 'selected' : '';
  }

  protected onNote(q: Question, event: Event): void {
    this.store.setNote(q.id, (event.target as HTMLTextAreaElement).value);
  }

  protected async finish(): Promise<void> {
    await this.store.finish();
  }

  protected async abandon(): Promise<void> {
    if (confirm('تمرین نیمه‌کاره رها شود؟')) {
      this.store.reset();
      await this.router.navigateByUrl('/');
    }
  }
}

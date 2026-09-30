import { Component, inject, input, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ApiClient } from '../../core/api-client';
import { LessonProgress } from '../../core/lesson-progress';
import { CheckExerciseResult, LessonExercise } from '../../core/models';
import { MarkdownPipe } from '../../shared/markdown.pipe';

@Component({
  selector: 'app-lesson-exercise',
  imports: [MarkdownPipe],
  template: `
    <div class="text" [innerHTML]="exercise().text | markdown"></div>
    <ul class="choices">
      @for (c of exercise().choices; track c.id) {
        <li>
          <button
            type="button"
            class="choice {{ stateOf(c.id) }}"
            [disabled]="busy() || result() !== null"
            (click)="choose(c.id)"
            [innerHTML]="c.text | markdown"
          ></button>
        </li>
      }
    </ul>
    @if (result(); as r) {
      <p class="verdict" [class.ok]="r.isCorrect" [class.no]="!r.isCorrect" role="status">
        {{ r.isCorrect ? 'درست بود!' : 'اشتباه بود.' }}
      </p>
      <div class="explanation" [innerHTML]="r.explanation | markdown"></div>
      <button type="button" class="btn" (click)="retry()">دوباره امتحان کن</button>
    }
    @if (error()) {
      <p class="error" role="alert">ارتباط با سرور برقرار نشد. دوباره تلاش کن.</p>
    }
  `,
  styles: `
    .text :first-child { margin-block-start: 0; }
    .choices { list-style: none; padding: 0; margin: 0.75rem 0; display: grid; gap: 0.5rem; }
    .choice { font: inherit; text-align: start; inline-size: 100%; padding: 0.6rem 0.9rem; border-radius: 0.7rem; border: 1px solid var(--border); background: var(--surface); color: var(--text); cursor: pointer; }
    .choice :first-child { margin: 0; }
    .choice.picked { border-color: var(--primary); background: var(--primary-soft); }
    .choice.correct { border-color: var(--good); background: var(--good-soft); }
    .choice.wrong { border-color: var(--bad); background: var(--bad-soft); }
    .choice:disabled { cursor: default; }
    .verdict { font-weight: 700; margin-block: 0.5rem; }
    .verdict.ok { color: var(--good); }
    .verdict.no { color: var(--bad); }
    .explanation { background: var(--code-bg); border-radius: 0.7rem; padding: 0.7rem 1rem; margin-block-end: 0.75rem; }
    .explanation :first-child { margin-block-start: 0; }
    .explanation :last-child { margin-block-end: 0; }
  `,
})
export class LessonExerciseView {
  readonly lessonId = input.required<string>();
  readonly exercise = input.required<LessonExercise>();
  readonly total = input.required<number>();

  private readonly api = inject(ApiClient);
  private readonly progress = inject(LessonProgress);

  protected readonly picked = signal<number | null>(null);
  protected readonly result = signal<CheckExerciseResult | null>(null);
  protected readonly busy = signal(false);
  protected readonly error = signal(false);

  protected stateOf(choiceId: number): 'correct' | 'wrong' | 'picked' | '' {
    const result = this.result();
    if (result) {
      if (choiceId === result.correctChoiceId) return 'correct';
      return choiceId === this.picked() ? 'wrong' : '';
    }
    return choiceId === this.picked() ? 'picked' : '';
  }

  protected async choose(choiceId: number): Promise<void> {
    this.picked.set(choiceId);
    this.busy.set(true);
    this.error.set(false);
    try {
      const result = await firstValueFrom(this.api.checkExercise(this.lessonId(), this.exercise().id, choiceId));
      this.result.set(result);
      this.progress.record(this.lessonId(), this.exercise().id, result.isCorrect, this.total());
    } catch {
      this.picked.set(null);
      this.error.set(true);
    } finally {
      this.busy.set(false);
    }
  }

  protected retry(): void {
    this.picked.set(null);
    this.result.set(null);
  }
}

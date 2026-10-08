import { Component, inject, input, linkedSignal, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ApiClient } from '../../core/api-client';
import { LessonProgress } from '../../core/lesson-progress';
import { CheckExerciseResult, LessonExercise } from '../../core/models';
import { MarkdownPipe } from '../../shared/markdown.pipe';

@Component({
  selector: 'app-lesson-exercise',
  imports: [MarkdownPipe],
  templateUrl: './lesson-exercise.html',
  styleUrl: './lesson-exercise.scss',
})
export class LessonExerciseView {
  readonly lessonId = input.required<string>();
  readonly exercise = input.required<LessonExercise>();
  readonly total = input.required<number>();

  private readonly api = inject(ApiClient);
  private readonly progress = inject(LessonProgress);

  // linkedSignal: writable like a signal, but resets to `null` whenever the `exercise` input changes,
  // so a reused component instance never shows the previous exercise's answer.
  protected readonly picked = linkedSignal<LessonExercise, number | null>({
    source: this.exercise,
    computation: () => null,
  });
  protected readonly result = linkedSignal<LessonExercise, CheckExerciseResult | null>({
    source: this.exercise,
    computation: () => null,
  });
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
      const result = await firstValueFrom(
        this.api.checkExercise(this.lessonId(), this.exercise().id, choiceId),
      );
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

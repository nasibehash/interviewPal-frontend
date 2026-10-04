import { Injectable, computed, signal } from '@angular/core';
import { readJson, removeKey, writeJson } from './safe-storage';

const KEY = 'interviewpal.lesson-progress.v2';

interface LessonState {
  /** number of exercises the lesson has */
  total: number;
  /** exerciseId -> whether the learner's latest answer was right */
  answers: Record<string, boolean>;
}

type Progress = Record<string, LessonState>;

/** Which lesson exercises the learner answered. Without accounts (phase 1) it lives in localStorage. */
@Injectable({ providedIn: 'root' })
export class LessonProgress {
  private readonly _progress = signal<Progress>(readJson(() => localStorage, KEY, {}));

  readonly progress = this._progress.asReadonly();

  /** Lessons whose exercises were all answered and whose latest answers are all right. */
  readonly completedIds = computed(
    () =>
      new Set(
        Object.entries(this._progress())
          .filter(([, s]) => s.total > 0 && Object.values(s.answers).length === s.total && Object.values(s.answers).every(Boolean))
          .map(([id]) => id),
      ),
  );

  record(lessonId: string, exerciseId: string, isCorrect: boolean, total: number): void {
    this._progress.update((p) => ({
      ...p,
      [lessonId]: { total, answers: { ...p[lessonId]?.answers, [exerciseId]: isCorrect } },
    }));
    writeJson(() => localStorage, KEY, this._progress());
  }

  /** Answers of one lesson: exerciseId -> correct? */
  answersOf(lessonId: string): Readonly<Record<string, boolean>> {
    return this._progress()[lessonId]?.answers ?? {};
  }

  clear(): void {
    this._progress.set({});
    removeKey(() => localStorage, KEY);
  }
}

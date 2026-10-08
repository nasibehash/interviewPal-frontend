import { Injectable, computed, inject, signal } from '@angular/core';
import { AuthStore } from './auth-store';
import { readJson, removeKey, writeJson } from './safe-storage';

const KEY = 'interviewpal.lesson-progress.v2';

interface LessonState {
  /** number of exercises the lesson has */
  total: number;
  /** exerciseId -> whether the learner's latest answer was right */
  answers: Record<string, boolean>;
}

type Progress = Record<string, LessonState>;

/** Which lesson exercises the learner answered. Anonymous: localStorage. Logged in: the server stores each answer. */
@Injectable({ providedIn: 'root' })
export class LessonProgress {
  private readonly auth = inject(AuthStore);
  private readonly _progress = signal<Progress>(readJson(() => localStorage, KEY, {}));

  readonly progress = this._progress.asReadonly();

  /** Lessons whose exercises were all answered and whose latest answers are all right. */
  readonly completedIds = computed(
    () =>
      new Set(
        Object.entries(this._progress())
          .filter(
            ([, s]) =>
              s.total > 0 &&
              Object.values(s.answers).length === s.total &&
              Object.values(s.answers).every(Boolean),
          )
          .map(([id]) => id),
      ),
  );

  record(lessonId: string, exerciseId: string, isCorrect: boolean, total: number): void {
    this._progress.update((p) => ({
      ...p,
      [lessonId]: { total, answers: { ...p[lessonId]?.answers, [exerciseId]: isCorrect } },
    }));
    if (!this.auth.isLoggedIn()) writeJson(() => localStorage, KEY, this._progress());
  }

  /** Answers of one lesson: exerciseId -> correct? */
  answersOf(lessonId: string): Readonly<Record<string, boolean>> {
    return this._progress()[lessonId]?.answers ?? {};
  }

  /** The account's answers, as the server has them. */
  setFromServer(
    lessons: { lessonId: string; total: number; answers: Record<string, boolean> }[],
  ): void {
    this._progress.set(
      Object.fromEntries(lessons.map((l) => [l.lessonId, { total: l.total, answers: l.answers }])),
    );
  }

  /** Answers saved in the browser, for importing them into a new account. */
  exportLocal(): { lessonId: string; answers: Record<string, boolean> }[] {
    return Object.entries(readJson<Progress>(() => localStorage, KEY, {})).map(([lessonId, s]) => ({
      lessonId,
      answers: s.answers,
    }));
  }

  /** Back to what the browser has (after logout). */
  reloadLocal(): void {
    this._progress.set(readJson(() => localStorage, KEY, {}));
  }

  clearLocal(): void {
    removeKey(() => localStorage, KEY);
  }

  clear(): void {
    this._progress.set({});
    this.clearLocal();
  }
}

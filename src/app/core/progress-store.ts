import { Injectable, computed, effect, inject, signal, untracked } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ApiClient } from './api-client';
import { AuthStore } from './auth-store';
import { LessonProgress } from './lesson-progress';
import {
  Evaluation,
  ImportProgressRequest,
  Level,
  PracticeMode,
  PracticeSession,
  ScoreBreakdown,
  ServerProgress,
} from './models';
import { readJson, removeKey, writeJson } from './safe-storage';

export interface HistoryEntry {
  id: string;
  at: string;
  mode: PracticeMode;
  total: number;
  correct: number;
  percent: number;
  byTechnology: ScoreBreakdown[];
}

export interface QuestionStat {
  seen: number;
  correct: number;
  lastCorrect: boolean;
  lastAt: string;
  technology: string;
  level: Level;
  text: string;
  tags: string[];
}

const HISTORY_KEY = 'interviewpal.history.v1';
const STATS_KEY = 'interviewpal.question-stats.v1';
const MAX_HISTORY = 100;

const dayKey = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/**
 * Learner progress. An anonymous learner's progress lives in the browser's localStorage. A logged-in learner's
 * progress lives on the server (it records every finished practice itself); the first time a learner logs in, what
 * the browser collected before is imported into the account and removed from the browser.
 */
@Injectable({ providedIn: 'root' })
export class ProgressStore {
  private readonly auth = inject(AuthStore);
  private readonly api = inject(ApiClient);
  private readonly lessons = inject(LessonProgress);

  private readonly _history = signal<HistoryEntry[]>(readJson(() => localStorage, HISTORY_KEY, []));
  private readonly _stats = signal<Record<string, QuestionStat>>(
    readJson(() => localStorage, STATS_KEY, {}),
  );

  readonly history = this._history.asReadonly();
  readonly stats = this._stats.asReadonly();

  /** True while progress is being loaded from or saved to the server. */
  readonly syncing = signal(false);
  /** Set when the server could not be reached; the data on screen may be old. */
  readonly syncError = signal(false);

  constructor() {
    // follow the login: load the account's progress when one logs in, go back to the browser's when one logs out
    effect(() => {
      const user = this.auth.user();
      untracked(() => void (user ? this.onLogin() : this.onLogout()));
    });
  }

  readonly totalSessions = computed(() => this._history().length);

  readonly averagePercent = computed(() => {
    const h = this._history();
    return h.length === 0 ? 0 : Math.round(h.reduce((sum, e) => sum + e.percent, 0) / h.length);
  });

  /** Consecutive days with at least one finished session, counted back from today (or yesterday). */
  readonly streakDays = computed(() => {
    const days = new Set(this._history().map((e) => dayKey(new Date(e.at))));
    const cursor = new Date();
    if (!days.has(dayKey(cursor))) {
      cursor.setDate(cursor.getDate() - 1);
    }
    let streak = 0;
    while (days.has(dayKey(cursor))) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    }
    return streak;
  });

  /** Questions whose most recent attempt was wrong, most recent first. */
  readonly weakQuestions = computed(() =>
    Object.entries(this._stats())
      .filter(([, s]) => !s.lastCorrect)
      .sort(([, a], [, b]) => b.lastAt.localeCompare(a.lastAt))
      .map(([id, s]) => ({ id, ...s })),
  );

  readonly accuracyByTechnology = computed(() => {
    const acc = new Map<string, { seen: number; correct: number }>();
    for (const s of Object.values(this._stats())) {
      const cur = acc.get(s.technology) ?? { seen: 0, correct: 0 };
      cur.seen += s.seen;
      cur.correct += s.correct;
      acc.set(s.technology, cur);
    }
    return [...acc.entries()]
      .map(([technology, v]) => ({
        technology,
        seen: v.seen,
        percent: Math.round((100 * v.correct) / v.seen),
      }))
      .sort((a, b) => a.percent - b.percent);
  });

  record(session: PracticeSession, evaluation: Evaluation, now: Date = new Date()): void {
    if (this.auth.isLoggedIn()) {
      void this.refresh(); // the server stored the result when it evaluated the practice
      return;
    }

    const at = now.toISOString();
    const entry: HistoryEntry = {
      id: `${now.getTime()}`,
      at,
      mode: session.mode,
      total: evaluation.total,
      correct: evaluation.correct,
      percent: evaluation.percent,
      byTechnology: evaluation.byTechnology,
    };
    this._history.update((h) => [entry, ...h].slice(0, MAX_HISTORY));

    const byId = new Map(session.questions.map((q) => [q.id, q]));
    this._stats.update((stats) => {
      const next = { ...stats };
      for (const r of evaluation.results) {
        const q = byId.get(r.questionId);
        if (!q) continue;
        const prev = next[q.id];
        next[q.id] = {
          seen: (prev?.seen ?? 0) + 1,
          correct: (prev?.correct ?? 0) + (r.isCorrect ? 1 : 0),
          lastCorrect: r.isCorrect,
          lastAt: at,
          technology: q.technology,
          level: q.level,
          text: q.text,
          tags: q.tags,
        };
      }
      return next;
    });

    writeJson(() => localStorage, HISTORY_KEY, this._history());
    writeJson(() => localStorage, STATS_KEY, this._stats());
  }

  /** Removes all progress: history, question stats and lesson answers. */
  async clear(): Promise<void> {
    if (this.auth.isLoggedIn()) {
      try {
        await firstValueFrom(this.api.clearProgress());
      } catch {
        this.syncError.set(true);
        return;
      }
    }
    this._history.set([]);
    this._stats.set({});
    removeKey(() => localStorage, HISTORY_KEY);
    removeKey(() => localStorage, STATS_KEY);
    this.lessons.clear();
  }

  /** Loads the account's progress from the server. */
  async refresh(): Promise<void> {
    this.syncing.set(true);
    try {
      this.applyServer(await firstValueFrom(this.api.progress()));
      this.syncError.set(false);
    } catch {
      this.syncError.set(true);
    } finally {
      this.syncing.set(false);
    }
  }

  private async onLogin(): Promise<void> {
    await this.importLocal();
    await this.refresh();
  }

  private onLogout(): void {
    this._history.set(readJson(() => localStorage, HISTORY_KEY, []));
    this._stats.set(readJson(() => localStorage, STATS_KEY, {}));
    this.lessons.reloadLocal();
    this.syncError.set(false);
  }

  /** What the browser collected before the account existed goes to the server once, then leaves the browser. */
  private async importLocal(): Promise<void> {
    const history = readJson<HistoryEntry[]>(() => localStorage, HISTORY_KEY, []);
    const stats = readJson<Record<string, QuestionStat>>(() => localStorage, STATS_KEY, {});
    const lessons = this.lessons.exportLocal();
    if (history.length === 0 && Object.keys(stats).length === 0 && lessons.length === 0) return;

    const request: ImportProgressRequest = {
      history: history
        .slice(0, 200)
        .map((h) => ({
          at: h.at,
          mode: h.mode,
          total: h.total,
          correct: h.correct,
          byTechnology: h.byTechnology,
        })),
      questionStats: Object.entries(stats)
        .slice(0, 400)
        .map(([questionId, s]) => ({
          questionId,
          seen: s.seen,
          correct: s.correct,
          lastCorrect: s.lastCorrect,
          lastAt: s.lastAt,
        })),
      lessons,
    };

    try {
      await firstValueFrom(this.api.importProgress(request));
      removeKey(() => localStorage, HISTORY_KEY);
      removeKey(() => localStorage, STATS_KEY);
      this.lessons.clearLocal();
    } catch {
      // kept in the browser; the next login tries again
    }
  }

  private applyServer(server: ServerProgress): void {
    this._history.set(
      server.history.map((h) => ({
        id: h.id,
        at: h.at,
        mode: h.mode,
        total: h.total,
        correct: h.correct,
        percent: h.percent,
        byTechnology: h.byTechnology,
      })),
    );
    this._stats.set(
      Object.fromEntries(
        server.questionStats.map((s) => [
          s.questionId,
          {
            seen: s.seen,
            correct: s.correct,
            lastCorrect: s.lastCorrect,
            lastAt: s.lastAt,
            technology: s.technology,
            level: s.level,
            text: s.text,
            tags: s.tags,
          },
        ]),
      ),
    );
    this.lessons.setFromServer(server.lessons);
  }
}

import { Injectable, computed, signal } from '@angular/core';
import { Evaluation, Level, PracticeMode, PracticeSession, ScoreBreakdown } from './models';
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

/** Learner progress. Without accounts (phase 1) it lives in the browser's localStorage. */
@Injectable({ providedIn: 'root' })
export class ProgressStore {
  private readonly _history = signal<HistoryEntry[]>(readJson(() => localStorage, HISTORY_KEY, []));
  private readonly _stats = signal<Record<string, QuestionStat>>(readJson(() => localStorage, STATS_KEY, {}));

  readonly history = this._history.asReadonly();
  readonly stats = this._stats.asReadonly();

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

  clear(): void {
    this._history.set([]);
    this._stats.set({});
    removeKey(() => localStorage, HISTORY_KEY);
    removeKey(() => localStorage, STATS_KEY);
  }
}

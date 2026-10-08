import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { firstValueFrom, forkJoin } from 'rxjs';
import { ApiClient } from './api-client';
import {
  Answer,
  Evaluation,
  PracticeSession,
  Question,
  StartPracticeRequest,
  SubmittedAnswer,
  isChoiceQuestion,
} from './models';
import { ProgressStore } from './progress-store';
import { readJson, removeKey, writeJson } from './safe-storage';
import { answerFromSelfAssessment } from './self-assessment';

export type Phase = 'idle' | 'practicing' | 'self-assessment' | 'submitting' | 'finished';

const SESSION_KEY = 'interviewpal.active-session.v1';

interface PersistedSession {
  session: PracticeSession;
  answers: Record<string, SubmittedAnswer>;
  notes: Record<string, string>;
  index: number;
  startedAt: number;
  phase: 'practicing' | 'self-assessment';
}

/**
 * State of the practice session in progress (questions, answers, position) and its final evaluation.
 * The active session survives a page refresh through sessionStorage.
 */
@Injectable({ providedIn: 'root' })
export class PracticeSessionStore {
  private readonly api = inject(ApiClient);
  private readonly progress = inject(ProgressStore);

  readonly session = signal<PracticeSession | null>(null);
  readonly answers = signal<Record<string, SubmittedAnswer>>({});
  /** Correct answer + explanation, filled when the learner sees them (learning/flashcard) or on self-assessment. */
  readonly revealed = signal<Record<string, Answer>>({});
  /** Whether each answered question was right; only known once the answer is revealed. */
  readonly correctness = signal<Record<string, boolean>>({});
  /** Free-text notes for short-answer questions in interview mode (never graded). */
  readonly notes = signal<Record<string, string>>({});
  readonly index = signal(0);
  readonly startedAt = signal(0);
  readonly phase = signal<Phase>('idle');
  readonly evaluation = signal<Evaluation | null>(null);
  readonly busy = signal(false);
  readonly error = signal<string | null>(null);

  readonly questions = computed(() => this.session()?.questions ?? []);
  readonly current = computed<Question | null>(() => this.questions()[this.index()] ?? null);
  readonly mode = computed(() => this.session()?.mode ?? 'Learning');
  readonly answeredCount = computed(() => Object.keys(this.answers()).length);
  readonly isLast = computed(() => this.index() >= this.questions().length - 1);

  /** Questions the learner has to grade themselves before the result can be computed. */
  readonly selfAssessmentQuestions = computed(() =>
    this.questions().filter((q) => !isChoiceQuestion(q) && this.answers()[q.id] === undefined),
  );

  /** Details already fetched from the API, so each question is requested at most once. */
  private readonly details = new Map<string, Answer>();

  constructor() {
    this.restore();
    effect(() => {
      const phase = this.phase();
      if (phase === 'practicing' || phase === 'self-assessment') {
        const session = this.session();
        if (session) {
          const state: PersistedSession = {
            session,
            answers: this.answers(),
            notes: this.notes(),
            index: this.index(),
            startedAt: this.startedAt(),
            phase,
          };
          writeJson(() => sessionStorage, SESSION_KEY, state);
        }
      } else {
        removeKey(() => sessionStorage, SESSION_KEY);
      }
    });
  }

  async start(request: StartPracticeRequest): Promise<void> {
    await this.run(async () => {
      const session = await firstValueFrom(this.api.startSession(request));
      if (session.totalQuestions === 0) {
        throw new Error('برای این انتخاب سؤالی پیدا نشد.');
      }
      this.begin(session);
    });
  }

  /** Builds a learning session from question ids (e.g. the questions the learner got wrong). */
  async startFromQuestions(ids: string[]): Promise<void> {
    await this.run(async () => {
      const unique = [...new Set(ids)].slice(0, 100);
      if (unique.length === 0) {
        throw new Error('سؤالی برای تمرین دوباره وجود ندارد.');
      }
      const details = await firstValueFrom(forkJoin(unique.map((id) => this.api.question(id))));
      for (const d of details) {
        this.details.set(d.question.id, d.answer);
      }
      const questions = details.map((d) => d.question);
      const seconds = questions.reduce((sum, q) => sum + q.estimatedSeconds, 0);
      this.begin({
        mode: 'Learning',
        requestedCount: questions.length,
        totalQuestions: questions.length,
        estimatedMinutes: Math.ceil(seconds / 60),
        timeLimitSeconds: null,
        questions,
      });
    });
  }

  /** Choice questions: record the selected choice. In learning mode the API grades it immediately. */
  async selectChoice(question: Question, choiceId: number): Promise<void> {
    if (this.answers()[question.id] && this.mode() !== 'Interview') {
      return; // locked once graded
    }
    this.setAnswer({ questionId: question.id, choiceId });
    if (this.mode() === 'Learning') {
      await this.run(async () => {
        const result = await firstValueFrom(this.api.check(question.id, { choiceId }));
        this.details.set(question.id, result.answer);
        this.revealed.update((r) => ({ ...r, [question.id]: result.answer }));
        this.correctness.update((c) => ({ ...c, [question.id]: result.isCorrect }));
      });
    }
  }

  /** Fetches and shows the model answer of a question (short-answer, conceptual, flashcards, self-assessment). */
  async reveal(question: Question): Promise<Answer | null> {
    const known = this.details.get(question.id);
    if (known) {
      this.revealed.update((r) => ({ ...r, [question.id]: known }));
      return known;
    }
    let answer: Answer | null = null;
    await this.run(async () => {
      answer = (await firstValueFrom(this.api.question(question.id))).answer;
      this.details.set(question.id, answer);
      this.revealed.update((r) => ({ ...r, [question.id]: answer as Answer }));
    });
    return answer;
  }

  async selfAssess(question: Question, knew: boolean): Promise<void> {
    const answer = this.revealed()[question.id] ?? (await this.reveal(question));
    if (!answer) return;
    this.setAnswer(answerFromSelfAssessment(question, answer, knew));
    this.correctness.update((c) => ({ ...c, [question.id]: knew }));
  }

  setNote(questionId: string, note: string): void {
    this.notes.update((n) => ({ ...n, [questionId]: note }));
  }

  goTo(index: number): void {
    this.index.set(Math.max(0, Math.min(index, this.questions().length - 1)));
  }

  next(): void {
    this.goTo(this.index() + 1);
  }

  previous(): void {
    this.goTo(this.index() - 1);
  }

  /** Ends the practice part. Short-answer questions that were not graded yet go through self-assessment first. */
  async finish(): Promise<void> {
    if (this.selfAssessmentQuestions().length > 0 && this.mode() === 'Interview') {
      this.phase.set('self-assessment');
      return;
    }
    await this.submit();
  }

  /** Grades everything with the API. Unanswered questions count as wrong. */
  async submit(): Promise<void> {
    const session = this.session();
    if (!session) return;
    this.phase.set('submitting');
    await this.run(async () => {
      const answers = await this.completeAnswers(session.questions);
      const evaluation = await firstValueFrom(this.api.evaluate(answers, session.mode));
      this.evaluation.set(evaluation);
      this.progress.record(session, evaluation);
      this.phase.set('finished');
    });
    if (this.phase() === 'submitting') {
      this.phase.set('practicing'); // evaluation failed: let the learner retry
    }
  }

  reset(): void {
    this.session.set(null);
    this.answers.set({});
    this.revealed.set({});
    this.correctness.set({});
    this.notes.set({});
    this.index.set(0);
    this.evaluation.set(null);
    this.error.set(null);
    this.phase.set('idle');
    this.details.clear();
  }

  private begin(session: PracticeSession): void {
    this.reset();
    this.session.set(session);
    this.startedAt.set(Date.now());
    this.phase.set('practicing');
  }

  private setAnswer(answer: SubmittedAnswer): void {
    this.answers.update((a) => ({ ...a, [answer.questionId]: answer }));
  }

  /** Adds an answer for every question the learner skipped, always as a wrong one. */
  private async completeAnswers(questions: Question[]): Promise<SubmittedAnswer[]> {
    const result: SubmittedAnswer[] = [];
    for (const q of questions) {
      const given = this.answers()[q.id];
      if (given) {
        result.push(given);
      } else if (isChoiceQuestion(q)) {
        const answer =
          this.details.get(q.id) ?? (await firstValueFrom(this.api.question(q.id))).answer;
        this.details.set(q.id, answer);
        result.push(answerFromSelfAssessment(q, answer, false));
      } else {
        result.push({ questionId: q.id, knewIt: false });
      }
    }
    return result;
  }

  private async run(action: () => Promise<void>): Promise<void> {
    this.busy.set(true);
    this.error.set(null);
    try {
      await action();
    } catch (e) {
      this.error.set(
        e instanceof Error && e.message ? e.message : 'ارتباط با سرور برقرار نشد. دوباره تلاش کن.',
      );
    } finally {
      this.busy.set(false);
    }
  }

  private restore(): void {
    const saved = readJson<PersistedSession | null>(() => sessionStorage, SESSION_KEY, null);
    if (!saved?.session?.questions?.length) return;
    this.session.set(saved.session);
    this.answers.set(saved.answers ?? {});
    this.notes.set(saved.notes ?? {});
    this.index.set(saved.index ?? 0);
    this.startedAt.set(saved.startedAt ?? Date.now());
    this.phase.set(saved.phase ?? 'practicing');
  }
}

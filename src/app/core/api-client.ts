import { HttpClient } from '@angular/common/http';
import { Injectable, InjectionToken, inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  CheckAnswerResult,
  CheckExerciseResult,
  LessonDetail,
  LessonKind,
  LessonSummary,
  Evaluation,
  PracticeSession,
  QuestionDetail,
  ReportReason,
  StartPracticeRequest,
  SubmittedAnswer,
  Technology,
} from './models';

/** Base URL of the InterviewPal API. In development `/api` is proxied to the backend (see proxy.conf.json). */
export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL', {
  providedIn: 'root',
  factory: () => '/api',
});

@Injectable({ providedIn: 'root' })
export class ApiClient {
  private readonly http = inject(HttpClient);
  private readonly base = inject(API_BASE_URL);

  technologies(): Observable<Technology[]> {
    return this.http.get<Technology[]>(`${this.base}/technologies`);
  }

  startSession(request: StartPracticeRequest): Observable<PracticeSession> {
    return this.http.post<PracticeSession>(`${this.base}/practice/sessions`, request);
  }

  question(id: string): Observable<QuestionDetail> {
    return this.http.get<QuestionDetail>(`${this.base}/questions/${encodeURIComponent(id)}`);
  }

  check(questionId: string, answer: Omit<SubmittedAnswer, 'questionId'>): Observable<CheckAnswerResult> {
    return this.http.post<CheckAnswerResult>(
      `${this.base}/practice/questions/${encodeURIComponent(questionId)}/check`,
      answer,
    );
  }

  evaluate(answers: SubmittedAnswer[]): Observable<Evaluation> {
    return this.http.post<Evaluation>(`${this.base}/practice/evaluate`, { answers });
  }

  report(questionId: string, reason: ReportReason, message: string | null): Observable<void> {
    return this.http.post<void>(`${this.base}/questions/${encodeURIComponent(questionId)}/reports`, {
      reason,
      message,
    });
  }

  lessons(kind?: LessonKind): Observable<LessonSummary[]> {
    return this.http.get<LessonSummary[]>(`${this.base}/lessons`, { params: kind ? { kind } : {} });
  }

  lesson(id: string, technology: string): Observable<LessonDetail> {
    return this.http.get<LessonDetail>(`${this.base}/lessons/${encodeURIComponent(id)}`, {
      params: { technology },
    });
  }

  checkExercise(lessonId: string, exerciseId: string, choiceId: number): Observable<CheckExerciseResult> {
    return this.http.post<CheckExerciseResult>(
      `${this.base}/lessons/${encodeURIComponent(lessonId)}/exercises/${encodeURIComponent(exerciseId)}/check`,
      { choiceId },
    );
  }
}

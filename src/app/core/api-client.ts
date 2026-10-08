import { HttpClient, HttpResourceRef, httpResource } from '@angular/common/http';
import { Injectable, InjectionToken, inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  CheckAnswerResult,
  AuthResponse,
  CheckExerciseResult,
  ImportProgressRequest,
  ServerProgress,
  User,
  LessonDetail,
  LessonKind,
  LessonSummary,
  Evaluation,
  PracticeMode,
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

  check(
    questionId: string,
    answer: Omit<SubmittedAnswer, 'questionId'>,
  ): Observable<CheckAnswerResult> {
    return this.http.post<CheckAnswerResult>(
      `${this.base}/practice/questions/${encodeURIComponent(questionId)}/check`,
      answer,
    );
  }

  /** `mode` is stored in the history of a logged-in learner (the server records the result itself). */
  evaluate(answers: SubmittedAnswer[], mode: PracticeMode = 'Learning'): Observable<Evaluation> {
    return this.http.post<Evaluation>(`${this.base}/practice/evaluate`, { answers, mode });
  }

  report(questionId: string, reason: ReportReason, message: string | null): Observable<void> {
    return this.http.post<void>(
      `${this.base}/questions/${encodeURIComponent(questionId)}/reports`,
      {
        reason,
        message,
      },
    );
  }

  // ---- reads as resources -------------------------------------------------------------------------------------
  // httpResource re-requests by itself when a signal read inside the request function changes, and exposes
  // value / isLoading / error / reload as signals. The factories live here so components never build URLs.
  // Call them from an injection context (a field initializer).

  technologiesResource(): HttpResourceRef<Technology[]> {
    return httpResource<Technology[]>(() => `${this.base}/technologies`, { defaultValue: [] });
  }

  lessonsResource(): HttpResourceRef<LessonSummary[]> {
    return httpResource<LessonSummary[]>(() => `${this.base}/lessons`, { defaultValue: [] });
  }

  /** The lesson with the implementation for `technology`; changing either signal fetches it again. */
  lessonResource(
    id: () => string,
    technology: () => string,
  ): HttpResourceRef<LessonDetail | undefined> {
    return httpResource<LessonDetail>(() => ({
      url: `${this.base}/lessons/${encodeURIComponent(id())}`,
      params: { technology: technology() },
    }));
  }

  // ---- reads as observables -------------------------------------------------------------------------------------

  lessons(kind?: LessonKind): Observable<LessonSummary[]> {
    return this.http.get<LessonSummary[]>(`${this.base}/lessons`, { params: kind ? { kind } : {} });
  }

  lesson(id: string, technology: string): Observable<LessonDetail> {
    return this.http.get<LessonDetail>(`${this.base}/lessons/${encodeURIComponent(id)}`, {
      params: { technology },
    });
  }

  checkExercise(
    lessonId: string,
    exerciseId: string,
    choiceId: number,
  ): Observable<CheckExerciseResult> {
    return this.http.post<CheckExerciseResult>(
      `${this.base}/lessons/${encodeURIComponent(lessonId)}/exercises/${encodeURIComponent(exerciseId)}/check`,
      { choiceId },
    );
  }

  // ---- account -------------------------------------------------------------------------------------------------
  // The refresh token is an httpOnly cookie that only the browser can see; it is sent to /auth/* on its own because
  // the app and the API share one origin (dev proxy, Vercel rewrite, nginx).

  register(email: string, password: string, displayName: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.base}/auth/register`, {
      email,
      password,
      displayName,
    });
  }

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.base}/auth/login`, { email, password });
  }

  refresh(): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.base}/auth/refresh`, null);
  }

  logout(): Observable<void> {
    return this.http.post<void>(`${this.base}/auth/logout`, null);
  }

  me(): Observable<User> {
    return this.http.get<User>(`${this.base}/auth/me`);
  }

  changePassword(currentPassword: string, newPassword: string): Observable<void> {
    return this.http.post<void>(`${this.base}/auth/change-password`, {
      currentPassword,
      newPassword,
    });
  }

  deleteAccount(password: string): Observable<void> {
    return this.http.post<void>(`${this.base}/auth/delete-account`, { password });
  }

  // ---- progress on the server (needs a login) ------------------------------------------------------------------

  progress(): Observable<ServerProgress> {
    return this.http.get<ServerProgress>(`${this.base}/me/progress`);
  }

  importProgress(request: ImportProgressRequest): Observable<void> {
    return this.http.post<void>(`${this.base}/me/progress/import`, request);
  }

  clearProgress(): Observable<void> {
    return this.http.delete<void>(`${this.base}/me/progress`);
  }
}

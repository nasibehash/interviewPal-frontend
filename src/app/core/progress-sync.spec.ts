import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { AuthStore } from './auth-store';
import { LessonProgress } from './lesson-progress';
import { ServerProgress } from './models';
import { ProgressStore } from './progress-store';
import { makeEvaluation, makeQuestion, makeSession } from './testing';
import { authResponse, respond } from './testing-auth';

const serverProgress: ServerProgress = {
  history: [
    {
      id: 'h1',
      at: '2026-10-01T10:00:00Z',
      mode: 'Interview',
      total: 10,
      correct: 8,
      percent: 80,
      byTechnology: [],
    },
  ],
  questionStats: [
    {
      questionId: 'angular-a',
      technology: 'angular',
      level: 'Mid',
      text: 'سؤال؟',
      tags: ['signals'],
      seen: 3,
      correct: 1,
      lastCorrect: false,
      lastAt: '2026-10-01T10:00:00Z',
    },
  ],
  lessons: [
    { lessonId: 'binary-search', total: 4, answers: { e1: true, e2: true, e3: true, e4: true } },
  ],
};

describe('progress follows the login', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
  });

  const setup = () => ({
    auth: TestBed.inject(AuthStore),
    progress: TestBed.inject(ProgressStore),
    lessons: TestBed.inject(LessonProgress),
    http: TestBed.inject(HttpTestingController),
  });

  const logIn = async (auth: AuthStore, http: HttpTestingController) => {
    const done = auth.login('nasim@example.com', 'secret-pass');
    await respond(http, '/api/auth/login', authResponse());
    await done;
    TestBed.tick(); // runs the effect that reacts to the login
  };

  const question = makeQuestion({ id: 'angular-a' });

  it('imports what the browser collected, removes it from the browser, then loads the account progress', async () => {
    const { auth, progress, lessons, http } = setup();
    progress.record(
      makeSession([question]),
      makeEvaluation([question], []),
      new Date('2026-09-01T10:00:00Z'),
    );
    lessons.record('binary-search', 'e1', true, 4);
    expect(localStorage.getItem('interviewpal.history.v1')).not.toBeNull();

    await logIn(auth, http);
    const imported = await respond(http, '/api/me/progress/import', null, { status: 204 });
    expect(imported.body.history).toHaveLength(1);
    expect(imported.body.history[0]).toMatchObject({ mode: 'Learning', total: 1, correct: 0 });
    expect(imported.body.questionStats[0]).toMatchObject({
      questionId: 'angular-a',
      seen: 1,
      lastCorrect: false,
    });
    expect(imported.body.lessons).toEqual([{ lessonId: 'binary-search', answers: { e1: true } }]);

    expect(localStorage.getItem('interviewpal.history.v1')).toBeNull();
    expect(localStorage.getItem('interviewpal.question-stats.v1')).toBeNull();
    expect(localStorage.getItem('interviewpal.lesson-progress.v2')).toBeNull();

    await respond(http, '/api/me/progress', serverProgress);
    expect(progress.history()).toHaveLength(1);
    expect(progress.history()[0].percent).toBe(80);
    expect(progress.weakQuestions().map((q) => q.id)).toEqual(['angular-a']);
    expect(lessons.completedIds().has('binary-search')).toBe(true);
  });

  it('keeps the local progress when the import fails, to try again at the next login', async () => {
    const { auth, progress, http } = setup();
    progress.record(makeSession([question]), makeEvaluation([question], ['angular-a']));
    await logIn(auth, http);
    await respond(http, '/api/me/progress/import', { detail: 'x' }, { status: 500 });
    await respond(http, '/api/me/progress', serverProgress);

    expect(localStorage.getItem('interviewpal.history.v1')).not.toBeNull();
  });

  it('skips the import when the browser has nothing', async () => {
    const { auth, http } = setup();
    await logIn(auth, http);
    http.expectNone('/api/me/progress/import');
    await respond(http, '/api/me/progress', serverProgress);
  });

  it('does not write to the browser while logged in; the server keeps the result', async () => {
    const { auth, progress, lessons, http } = setup();
    await logIn(auth, http);
    await respond(http, '/api/me/progress', { history: [], questionStats: [], lessons: [] });

    progress.record(makeSession([question]), makeEvaluation([question], ['angular-a']));
    await respond(http, '/api/me/progress', serverProgress); // it reloads the account's progress instead

    lessons.record('binary-search', 'e1', true, 4);
    expect(localStorage.getItem('interviewpal.history.v1')).toBeNull();
    expect(localStorage.getItem('interviewpal.lesson-progress.v2')).toBeNull();
    expect(lessons.answersOf('binary-search')['e1']).toBe(true); // still shown at once
  });

  it('clears the account progress on the server', async () => {
    const { auth, progress, http } = setup();
    await logIn(auth, http);
    await respond(http, '/api/me/progress', serverProgress);

    const cleared = progress.clear();
    const request = await respond(http, '/api/me/progress', null, { status: 204 });
    await cleared;
    expect(request.method).toBe('DELETE');
    expect(progress.history()).toEqual([]);
  });

  it('shows the browser progress again after logout (the account progress stays on the server)', async () => {
    const { auth, progress, http } = setup();
    await logIn(auth, http);
    await respond(http, '/api/me/progress', serverProgress);
    expect(progress.history()).toHaveLength(1);

    const out = auth.logout();
    await respond(http, '/api/auth/logout', null, { status: 204 });
    await out;
    TestBed.tick();
    expect(progress.history()).toEqual([]);
  });

  it('flags a failed sync without throwing away what is on screen', async () => {
    const { auth, progress, http } = setup();
    await logIn(auth, http);
    await respond(http, '/api/me/progress', { detail: 'x' }, { status: 500 });
    expect(progress.syncError()).toBe(true);
  });
});

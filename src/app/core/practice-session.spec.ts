import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { PracticeSessionStore } from './practice-session';
import { makeAnswer, makeEvaluation, makeQuestion, makeSession } from './testing';

describe('PracticeSessionStore', () => {
  const choice = makeQuestion({ id: 'angular-c' });
  const short = makeQuestion({ id: 'angular-s', type: 'ShortAnswer', choices: [] });

  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
  });

  const start = async (mode: 'Learning' | 'Interview' | 'Flashcard') => {
    const store = TestBed.inject(PracticeSessionStore);
    const http = TestBed.inject(HttpTestingController);
    const done = store.start({ technologies: [], levels: [], count: 5, mode });
    http.expectOne('/api/practice/sessions').flush(makeSession([choice, short], { mode }));
    await done;
    return { store, http };
  };

  it('starts practicing with the returned questions', async () => {
    const { store } = await start('Learning');
    expect(store.phase()).toBe('practicing');
    expect(store.current()?.id).toBe('angular-c');
  });

  it('grades a choice immediately in learning mode', async () => {
    const { store, http } = await start('Learning');
    const done = store.selectChoice(choice, 2);
    http.expectOne('/api/practice/questions/angular-c/check').flush({ questionId: 'angular-c', isCorrect: true, answer: makeAnswer() });
    await done;
    expect(store.correctness()['angular-c']).toBe(true);
    expect(store.revealed()['angular-c']).toBeDefined();
  });

  it('does not call the API for choices in interview mode and can change the answer', async () => {
    const { store, http } = await start('Interview');
    await store.selectChoice(choice, 1);
    await store.selectChoice(choice, 2);
    http.expectNone('/api/practice/questions/angular-c/check');
    expect(store.answers()['angular-c'].choiceId).toBe(2);
  });

  it('asks for self-assessment of ungraded short answers before submitting in interview mode', async () => {
    const { store } = await start('Interview');
    await store.selectChoice(choice, 2);
    await store.finish();
    expect(store.phase()).toBe('self-assessment');
    expect(store.selfAssessmentQuestions().map((q) => q.id)).toEqual(['angular-s']);
  });

  it('submits, stores the evaluation and records progress', async () => {
    const { store, http } = await start('Interview');
    await store.selectChoice(choice, 2);
    store.answers.update((a) => ({ ...a, 'angular-s': { questionId: 'angular-s', knewIt: true } }));
    const done = store.finish();
    await new Promise((r) => setTimeout(r));
    const req = http.expectOne('/api/practice/evaluate');
    expect(req.request.body.answers).toHaveLength(2);
    req.flush(makeEvaluation([choice, short], ['angular-c', 'angular-s']));
    await done;
    expect(store.phase()).toBe('finished');
    expect(store.evaluation()?.percent).toBe(100);
    expect(localStorage.getItem('interviewpal.history.v1')).not.toBeNull();
  });

  it('returns to practicing when evaluation fails', async () => {
    const { store, http } = await start('Learning');
    store.answers.set({ 'angular-s': { questionId: 'angular-s', knewIt: false } });
    const done = store.submit();
    // the skipped choice question needs its answer to be graded as wrong
    await new Promise((r) => setTimeout(r));
    http.expectOne('/api/questions/angular-c').flush({ question: choice, answer: makeAnswer() });
    await new Promise((r) => setTimeout(r));
    http.expectOne('/api/practice/evaluate').flush('boom', { status: 500, statusText: 'err' });
    await done;
    expect(store.phase()).toBe('practicing');
    expect(store.error()).toBeTruthy();
  });

  it('rejects an empty session', async () => {
    const store = TestBed.inject(PracticeSessionStore);
    const http = TestBed.inject(HttpTestingController);
    const done = store.start({ technologies: [], levels: [], count: 5, mode: 'Learning' });
    http.expectOne('/api/practice/sessions').flush(makeSession([]));
    await done;
    expect(store.phase()).toBe('idle');
    expect(store.error()).toBeTruthy();
  });
});

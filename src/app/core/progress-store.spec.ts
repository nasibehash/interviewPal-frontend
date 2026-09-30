import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { ProgressStore } from './progress-store';
import { makeEvaluation, makeQuestion, makeSession } from './testing';

describe('ProgressStore', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.resetTestingModule();
  });

  const questions = [makeQuestion({ id: 'angular-a' }), makeQuestion({ id: 'angular-b' })];

  it('records a session and tracks weak questions', () => {
    const store = TestBed.inject(ProgressStore);
    store.record(makeSession(questions), makeEvaluation(questions, ['angular-a']));
    expect(store.totalSessions()).toBe(1);
    expect(store.averagePercent()).toBe(50);
    expect(store.weakQuestions().map((q) => q.id)).toEqual(['angular-b']);
  });

  it('removes a question from the weak list once answered correctly', () => {
    const store = TestBed.inject(ProgressStore);
    const session = makeSession(questions);
    store.record(session, makeEvaluation(questions, []), new Date('2026-01-01'));
    store.record(session, makeEvaluation(questions, ['angular-a', 'angular-b']), new Date('2026-01-02'));
    expect(store.weakQuestions()).toEqual([]);
    expect(store.stats()['angular-a'].seen).toBe(2);
  });

  it('counts consecutive days as a streak', () => {
    const store = TestBed.inject(ProgressStore);
    const today = new Date();
    const yesterday = new Date(today.getTime() - 24 * 3600 * 1000);
    store.record(makeSession(questions), makeEvaluation(questions, []), yesterday);
    store.record(makeSession(questions), makeEvaluation(questions, []), today);
    expect(store.streakDays()).toBe(2);
  });

  it('persists to localStorage and clears', () => {
    const store = TestBed.inject(ProgressStore);
    store.record(makeSession(questions), makeEvaluation(questions, []));
    TestBed.resetTestingModule();
    expect(TestBed.inject(ProgressStore).totalSessions()).toBe(1);
    TestBed.inject(ProgressStore).clear();
    expect(localStorage.getItem('interviewpal.history.v1')).toBeNull();
  });
});

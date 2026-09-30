import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { ApiClient } from './api-client';

describe('ApiClient', () => {
  const setup = () => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    return { api: TestBed.inject(ApiClient), http: TestBed.inject(HttpTestingController) };
  };

  it('starts a session', () => {
    const { api, http } = setup();
    const request = { technologies: ['angular'], levels: [], count: 10, mode: 'Learning' as const };
    api.startSession(request).subscribe();
    const req = http.expectOne('/api/practice/sessions');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(request);
    http.verify();
  });

  it('checks an answer for a question id', () => {
    const { api, http } = setup();
    api.check('angular-q1', { choiceId: 3 }).subscribe();
    const req = http.expectOne('/api/practice/questions/angular-q1/check');
    expect(req.request.body).toEqual({ choiceId: 3 });
    http.verify();
  });

  it('wraps answers for evaluation and posts reports', () => {
    const { api, http } = setup();
    api.evaluate([{ questionId: 'a', knewIt: true }]).subscribe();
    expect(http.expectOne('/api/practice/evaluate').request.body).toEqual({ answers: [{ questionId: 'a', knewIt: true }] });
    api.report('a', 'Typo', null).subscribe();
    expect(http.expectOne('/api/questions/a/reports').request.body).toEqual({ reason: 'Typo', message: null });
    http.verify();
  });
});

import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { ApiClient } from './api-client';

describe('ApiClient', () => {
  const setup = () => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
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
    expect(http.expectOne('/api/practice/evaluate').request.body).toEqual({
      answers: [{ questionId: 'a', knewIt: true }],
      mode: 'Learning',
    });
    api.report('a', 'Typo', null).subscribe();
    expect(http.expectOne('/api/questions/a/reports').request.body).toEqual({
      reason: 'Typo',
      message: null,
    });
    http.verify();
  });

  it('loads lessons, one lesson in a technology, and checks an exercise', () => {
    const { api, http } = setup();
    api.lessons('DesignPattern').subscribe();
    expect(http.expectOne((r) => r.url === '/api/lessons').request.params.get('kind')).toBe(
      'DesignPattern',
    );

    api.lesson('binary-search', 'nextjs').subscribe();
    expect(
      http
        .expectOne((r) => r.url === '/api/lessons/binary-search')
        .request.params.get('technology'),
    ).toBe('nextjs');

    api.checkExercise('binary-search', 'e1', 2).subscribe();
    expect(http.expectOne('/api/lessons/binary-search/exercises/e1/check').request.body).toEqual({
      choiceId: 2,
    });
    http.verify();
  });

  it('talks to the account and progress endpoints', () => {
    const { api, http } = setup();
    api.register('a@b.co', 'secret-pass', 'Nasim').subscribe();
    expect(http.expectOne('/api/auth/register').request.body).toEqual({
      email: 'a@b.co',
      password: 'secret-pass',
      displayName: 'Nasim',
    });
    api.login('a@b.co', 'secret-pass').subscribe();
    expect(http.expectOne('/api/auth/login').request.body).toEqual({
      email: 'a@b.co',
      password: 'secret-pass',
    });
    api.refresh().subscribe();
    expect(http.expectOne('/api/auth/refresh').request.method).toBe('POST');
    api.changePassword('old', 'new-password').subscribe();
    expect(http.expectOne('/api/auth/change-password').request.body).toEqual({
      currentPassword: 'old',
      newPassword: 'new-password',
    });
    api.deleteAccount('pw').subscribe();
    expect(http.expectOne('/api/auth/delete-account').request.body).toEqual({ password: 'pw' });
    api.progress().subscribe();
    expect(http.expectOne('/api/me/progress').request.method).toBe('GET');
    api.clearProgress().subscribe();
    expect(http.expectOne('/api/me/progress').request.method).toBe('DELETE');
    http.verify();
  });
});

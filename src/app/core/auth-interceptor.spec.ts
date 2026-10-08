import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { apiErrorInterceptor } from './api-error';
import { authInterceptor } from './auth-interceptor';
import { AuthStore } from './auth-store';
import { authResponse, respond } from './testing-auth';

describe('authInterceptor', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([apiErrorInterceptor, authInterceptor])),
        provideHttpClientTesting(),
      ],
    });
  });

  const login = async () => {
    const auth = TestBed.inject(AuthStore);
    const http = TestBed.inject(HttpTestingController);
    const done = auth.login('a@b.co', 'secret-pass');
    await respond(http, '/api/auth/login', authResponse());
    await done;
    return { auth, http, client: TestBed.inject(HttpClient) };
  };

  it('sends no Authorization header while anonymous', async () => {
    const client = TestBed.inject(HttpClient);
    const http = TestBed.inject(HttpTestingController);
    client.get('/api/technologies').subscribe();
    await Promise.resolve();
    expect(http.expectOne('/api/technologies').request.headers.has('Authorization')).toBe(false);
  });

  it('adds the bearer token of a logged-in learner to API calls', async () => {
    const { http, client } = await login();
    client.post('/api/practice/evaluate', {}).subscribe();
    await Promise.resolve();
    expect(http.expectOne('/api/practice/evaluate').request.headers.get('Authorization')).toBe(
      'Bearer access-token',
    );
  });

  it('does not add it to the auth endpoints themselves', async () => {
    const { http, client } = await login();
    client.post('/api/auth/refresh', null).subscribe();
    await Promise.resolve();
    expect(http.expectOne('/api/auth/refresh').request.headers.has('Authorization')).toBe(false);
  });

  it('makes the learner anonymous when the server answers 401 to an authenticated call', async () => {
    const { auth, http, client } = await login();
    client.get('/api/me/progress').subscribe({ error: () => undefined });
    await respond(http, '/api/me/progress', { detail: 'x' }, { status: 401 });
    expect(auth.status()).toBe('anonymous');
  });
});

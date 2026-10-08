import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { apiErrorInterceptor } from './api-error';
import { AuthStore } from './auth-store';
import { authResponse, respond } from './testing-auth';

describe('AuthStore', () => {
  const HINT = 'interviewpal.session-hint.v1';

  beforeEach(() => {
    localStorage.clear();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([apiErrorInterceptor])),
        provideHttpClientTesting(),
      ],
    });
  });

  const setup = () => ({
    auth: TestBed.inject(AuthStore),
    http: TestBed.inject(HttpTestingController),
  });

  it('makes no request at startup when this browser never had a login', async () => {
    const { auth, http } = setup();
    await auth.restore();
    expect(auth.status()).toBe('anonymous');
    http.expectNone('/api/auth/refresh');
  });

  it('restores the login from the refresh cookie when the browser has the hint', async () => {
    localStorage.setItem(HINT, '"1"');
    const { auth, http } = setup();
    const restored = auth.restore();
    await respond(http, '/api/auth/refresh', authResponse());
    await restored;

    expect(auth.status()).toBe('authenticated');
    expect(auth.user()?.displayName).toBe('Nasim');
    expect(await auth.validToken()).toBe('access-token');
  });

  it('forgets the hint when the server refuses the refresh token', async () => {
    localStorage.setItem(HINT, '"1"');
    const { auth, http } = setup();
    const restored = auth.restore();
    await respond(http, '/api/auth/refresh', { detail: 'x' }, { status: 401 });
    await restored;

    expect(auth.status()).toBe('anonymous');
    expect(localStorage.getItem(HINT)).toBeNull();
  });

  it('keeps the hint when the server cannot be reached', async () => {
    localStorage.setItem(HINT, '"1"');
    const { auth, http } = setup();
    const restored = auth.restore();
    await Promise.resolve();
    http.expectOne('/api/auth/refresh').error(new ProgressEvent('error'));
    await restored;

    expect(auth.status()).toBe('anonymous');
    expect(localStorage.getItem(HINT)).toBe('"1"');
  });

  it('logs in, remembers it for the next visit and logs out', async () => {
    const { auth, http } = setup();
    const login = auth.login('nasim@example.com', 'secret-pass');
    const request = await respond(http, '/api/auth/login', authResponse());
    await login;

    expect(request.body).toEqual({ email: 'nasim@example.com', password: 'secret-pass' });
    expect(auth.isLoggedIn()).toBe(true);
    expect(localStorage.getItem(HINT)).toBe('"1"');

    const logout = auth.logout();
    await respond(http, '/api/auth/logout', null, { status: 204 });
    await logout;
    expect(auth.status()).toBe('anonymous');
    expect(localStorage.getItem(HINT)).toBeNull();
    expect(await auth.validToken()).toBeNull();
  });

  it('refreshes a token that is about to expire, one refresh for all waiting requests', async () => {
    const { auth, http } = setup();
    const login = auth.login('a@b.co', 'secret-pass');
    await respond(http, '/api/auth/login', authResponse({}, 10_000)); // expires in 10 s: inside the 30 s margin
    await login;

    const first = auth.validToken();
    const second = auth.validToken();
    await Promise.resolve();
    const refresh = http.expectOne('/api/auth/refresh'); // only one request for both callers
    refresh.flush(authResponse({ accessToken: 'new-token' }));

    expect(await first).toBe('new-token');
    expect(await second).toBe('new-token');
  });

  it('ends the local session after a password change', async () => {
    const { auth, http } = setup();
    const login = auth.login('a@b.co', 'secret-pass');
    await respond(http, '/api/auth/login', authResponse());
    await login;

    const change = auth.changePassword('old', 'new-password');
    await respond(http, '/api/auth/change-password', null, { status: 204 });
    await change;
    expect(auth.status()).toBe('anonymous');
  });
});

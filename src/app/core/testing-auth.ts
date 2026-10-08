import { HttpTestingController } from '@angular/common/http/testing';
import { AuthResponse } from './models';

export const authResponse = (
  over: Partial<AuthResponse> = {},
  expiresInMs = 15 * 60_000,
): AuthResponse => ({
  accessToken: 'access-token',
  expiresAt: new Date(Date.now() + expiresInMs).toISOString(),
  user: {
    id: 'u1',
    email: 'nasim@example.com',
    displayName: 'Nasim',
    createdAt: '2026-10-01T00:00:00Z',
  },
  ...over,
});

/** Answers the next call of `url` with `body` and lets pending promises run. */
export const respond = async (
  http: HttpTestingController,
  url: string,
  body: object | null,
  init: { status?: number } = {},
) => {
  await Promise.resolve();
  const req = http.expectOne(url);
  req.flush(body, {
    status: init.status ?? 200,
    statusText: init.status && init.status >= 400 ? 'error' : 'OK',
  });
  await new Promise((resolve) => setTimeout(resolve));
  return req.request;
};

import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  Router,
  RouterStateSnapshot,
  UrlTree,
  provideRouter,
} from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';
import { authGuard, guestGuard } from './auth-guards';
import { AuthStore } from './auth-store';

describe('auth guards', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
  });

  const run = (guard: typeof authGuard, url = '/account') =>
    TestBed.runInInjectionContext(() =>
      guard({} as ActivatedRouteSnapshot, { url } as RouterStateSnapshot),
    );

  it('sends an anonymous visitor to the login page and remembers where they wanted to go', async () => {
    await TestBed.inject(AuthStore).restore(); // no hint: anonymous
    const result = (await run(authGuard, '/account')) as UrlTree;
    expect(TestBed.inject(Router).serializeUrl(result)).toBe('/login?redirect=%2Faccount');
  });

  it('waits until the login has been restored before deciding', async () => {
    const auth = TestBed.inject(AuthStore);
    let settled = false;
    const pending = Promise.resolve(run(authGuard)).then(() => (settled = true));
    await new Promise((resolve) => setTimeout(resolve));
    expect(settled).toBe(false); // restore() has not finished
    await auth.restore();
    await pending;
    expect(settled).toBe(true);
  });

  it('keeps logged-in learners away from the login and register pages', async () => {
    const auth = TestBed.inject(AuthStore);
    await auth.restore();
    expect(await run(guestGuard)).toBe(true);
  });
});

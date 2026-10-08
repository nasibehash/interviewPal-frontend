import { authGuard } from './core/auth-guards';
import { routes } from './app.routes';

describe('routes', () => {
  const publicPaths = ['login', 'register'];

  it('puts every page except login and register behind the login guard', () => {
    const guarded = routes.filter((r) => r.canActivateChild?.includes(authGuard));
    expect(guarded).toHaveLength(1);

    const guardedPaths = (guarded[0].children ?? []).map((r) => r.path);
    expect(guardedPaths).toEqual(
      expect.arrayContaining(['', 'practice', 'result', 'lessons', 'lessons/:id', 'history']),
    );
    for (const path of publicPaths) expect(guardedPaths).not.toContain(path);
  });

  it('guards the account page too', () => {
    expect(routes.find((r) => r.path === 'account')?.canActivate).toContain(authGuard);
  });

  it('keeps login and register reachable without a session', () => {
    const open = routes.filter((r) => publicPaths.includes(r.path ?? ''));
    expect(open.map((r) => r.path).sort()).toEqual(['login', 'register']);
    for (const route of open) expect(route.canActivateChild).toBeUndefined();
  });
});

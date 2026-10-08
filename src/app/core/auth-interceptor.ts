import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, from, switchMap, throwError } from 'rxjs';
import { AuthStore } from './auth-store';

/** These endpoints are answered without a token (login) or with the refresh cookie (refresh, logout). */
const WITHOUT_TOKEN = /\/auth\/(login|register|refresh|logout)$/;

/**
 * Adds "Authorization: Bearer ..." to every API call of a logged-in learner, so the server can tell who is
 * practicing and keep the result. A 401 on such a call means the session is gone, and the learner becomes anonymous.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthStore);
  if (WITHOUT_TOKEN.test(req.url)) return next(req);

  return from(auth.validToken()).pipe(
    switchMap((token) =>
      next(token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req),
    ),
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && error.status === 401 && auth.isLoggedIn())
        auth.sessionLost();
      return throwError(() => error);
    }),
  );
};

import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

/** An API failure with a message that can be shown to the learner as it is. */
export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

const NETWORK = 'ارتباط با سرور برقرار نشد. دوباره تلاش کن.';

/** Persian message for an HTTP status. 400 passes the server's own ProblemDetails text along when there is one. */
export function messageFor(status: number, problem?: { detail?: string } | null): string {
  if (status === 0) return NETWORK;
  if (status === 400) return problem?.detail ?? 'درخواست نامعتبر است.';
  if (status === 404) return 'موردی که دنبالش بودی پیدا نشد.';
  if (status === 429) return 'درخواست‌ها زیاد است؛ کمی صبر کن.';
  return status >= 500 ? 'خطای سرور؛ کمی بعد دوباره تلاش کن.' : NETWORK;
}

/** Turns every failed API call into an ApiError, so stores and pages never read raw HttpErrorResponse. */
export const apiErrorInterceptor: HttpInterceptorFn = (req, next) =>
  next(req).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse) {
        const problem =
          typeof error.error === 'object' ? (error.error as { detail?: string } | null) : null;
        return throwError(() => new ApiError(messageFor(error.status, problem), error.status));
      }
      return throwError(() => error);
    }),
  );

import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { ApiError, apiErrorInterceptor, messageFor } from './api-error';

describe('apiErrorInterceptor', () => {
  const setup = () => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(withInterceptors([apiErrorInterceptor])), provideHttpClientTesting()],
    });
    return { http: TestBed.inject(HttpClient), controller: TestBed.inject(HttpTestingController) };
  };

  const failure = (status: number, body: object | null = null): Promise<unknown> => {
    const { http, controller } = setup();
    const result = new Promise((resolve) => http.get('/x').subscribe({ error: resolve }));
    controller.expectOne('/x').flush(body, { status, statusText: 'err' });
    return result;
  };

  it('turns HTTP failures into ApiError with a Persian message', async () => {
    const error = (await failure(404)) as ApiError;
    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(404);
    expect(error.message).toContain('پیدا نشد');
  });

  it('passes the ProblemDetails text of a 400 along', async () => {
    const error = (await failure(400, { detail: 'count must be between 5 and 100' })) as ApiError;
    expect(error.message).toBe('count must be between 5 and 100');
  });

  it('has a message for network and server errors', () => {
    expect(messageFor(0)).toContain('ارتباط');
    expect(messageFor(503)).toContain('سرور');
  });
});

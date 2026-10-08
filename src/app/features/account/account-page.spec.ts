import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';
import { apiErrorInterceptor } from '../../core/api-error';
import { AuthStore } from '../../core/auth-store';
import { ProgressStore } from '../../core/progress-store';
import { authResponse, respond } from '../../core/testing-auth';
import { AccountPage } from './account-page';

const settle = async (fixture: { whenStable(): Promise<unknown>; detectChanges(): void }) => {
  await new Promise((resolve) => setTimeout(resolve));
  await fixture.whenStable();
  fixture.detectChanges();
};

const type = (el: HTMLElement, selector: string, index: number, value: string) => {
  const input = el.querySelectorAll<HTMLInputElement>(selector)[index];
  input.value = value;
  input.dispatchEvent(new Event('input'));
  input.dispatchEvent(new Event('blur'));
};

describe('AccountPage', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(withInterceptors([apiErrorInterceptor])), provideHttpClientTesting(), provideRouter([{ path: '**', children: [] }])],
    });
  });

  const render = async () => {
    const auth = TestBed.inject(AuthStore);
    TestBed.inject(ProgressStore); // alive from the start, as the app shell does
    const http = TestBed.inject(HttpTestingController);
    const done = auth.login('nasim@example.com', 'secret-pass');
    await respond(http, '/api/auth/login', authResponse());
    await done;
    TestBed.tick();
    await respond(http, '/api/me/progress', { history: [], questionStats: [], lessons: [] });

    const fixture = TestBed.createComponent(AccountPage);
    fixture.detectChanges();
    return { auth, http, fixture, el: fixture.nativeElement as HTMLElement };
  };

  it('shows who is logged in', async () => {
    const { el } = await render();
    expect(el.textContent).toContain('Nasim');
    expect(el.textContent).toContain('nasim@example.com');
  });

  it('logs out', async () => {
    const { auth, http, fixture, el } = await render();
    el.querySelector<HTMLButtonElement>('section.card .btn')!.click();
    await respond(http, '/api/auth/logout', null, { status: 204 });
    await settle(fixture);
    expect(auth.status()).toBe('anonymous');
  });

  it('checks the new password before sending and then logs out everywhere', async () => {
    const { auth, http, fixture, el } = await render();
    const form = el.querySelectorAll('form')[0] as HTMLFormElement;

    type(form, 'input', 0, 'secret-pass');
    type(form, 'input', 1, 'brand-new-password');
    type(form, 'input', 2, 'something-else');
    form.dispatchEvent(new Event('submit'));
    await settle(fixture);
    http.expectNone('/api/auth/change-password');
    expect(el.textContent).toContain('تکرار رمز عبور با رمز جدید یکی نیست.');

    type(form, 'input', 2, 'brand-new-password');
    form.dispatchEvent(new Event('submit'));
    await settle(fixture);
    const req = http.expectOne('/api/auth/change-password');
    expect(req.request.body).toEqual({ currentPassword: 'secret-pass', newPassword: 'brand-new-password' });
    req.flush(null, { status: 204, statusText: 'No Content' });
    await settle(fixture);
    expect(auth.status()).toBe('anonymous'); // the server ended every session
  });

  it('says when the current password is wrong', async () => {
    const { http, fixture, el } = await render();
    const form = el.querySelectorAll('form')[0] as HTMLFormElement;
    type(form, 'input', 0, 'not-my-password');
    type(form, 'input', 1, 'brand-new-password');
    type(form, 'input', 2, 'brand-new-password');
    form.dispatchEvent(new Event('submit'));
    await settle(fixture);
    http.expectOne('/api/auth/change-password').flush({ detail: 'x' }, { status: 400, statusText: 'Bad Request' });
    await settle(fixture);
    expect(el.querySelector('.error')?.textContent).toContain('رمز عبور فعلی درست نیست.');
  });

  it('deletes the account only after the password is typed', async () => {
    const { auth, http, fixture, el } = await render();
    expect(el.querySelectorAll('form').length).toBe(1); // the delete form is hidden until asked for
    [...el.querySelectorAll<HTMLButtonElement>('.danger .btn')].find((b) => b.textContent?.includes('حذف حساب'))!.click();
    fixture.detectChanges();

    const form = el.querySelectorAll('form')[1] as HTMLFormElement;
    form.dispatchEvent(new Event('submit'));
    await settle(fixture);
    http.expectNone('/api/auth/delete-account');
    expect(el.textContent).toContain('برای حذف، رمز عبور را وارد کن.');

    type(form, 'input', 0, 'secret-pass');
    form.dispatchEvent(new Event('submit'));
    await settle(fixture);
    const req = http.expectOne('/api/auth/delete-account');
    expect(req.request.body).toEqual({ password: 'secret-pass' });
    req.flush(null, { status: 204, statusText: 'No Content' });
    await settle(fixture);
    expect(auth.status()).toBe('anonymous');
    expect(TestBed.inject(Router).url).toBeDefined();
  });
});

import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';
import { apiErrorInterceptor } from '../../core/api-error';
import { authResponse } from '../../core/testing-auth';
import { LoginPage } from './login-page';
import { RegisterPage } from './register-page';

/** Lets the promises behind a submit (login call, navigation) finish, then renders. */
const settle = async (fixture: { whenStable(): Promise<unknown>; detectChanges(): void }) => {
  await new Promise((resolve) => setTimeout(resolve));
  await fixture.whenStable();
  fixture.detectChanges();
};

const type = (el: HTMLElement, selector: string, value: string) => {
  const input = el.querySelector<HTMLInputElement>(selector)!;
  input.value = value;
  input.dispatchEvent(new Event('input'));
  input.dispatchEvent(new Event('blur'));
};

describe('auth pages', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([apiErrorInterceptor])), // as in the app: failures arrive as ApiError
        provideHttpClientTesting(),
        provideRouter([{ path: '**', children: [] }]),
      ],
    });
  });

  describe('LoginPage', () => {
    const render = (inputs: Record<string, string> = {}) => {
      const fixture = TestBed.createComponent(LoginPage);
      for (const [name, value] of Object.entries(inputs)) fixture.componentRef.setInput(name, value);
      fixture.detectChanges();
      return { fixture, el: fixture.nativeElement as HTMLElement, http: TestBed.inject(HttpTestingController) };
    };
    const submit = async (fixture: ReturnType<typeof render>['fixture'], el: HTMLElement) => {
      el.querySelector<HTMLFormElement>('form')!.dispatchEvent(new Event('submit'));
      await fixture.whenStable();
      fixture.detectChanges();
    };

    it('does not send an empty or invalid form and says what is wrong', async () => {
      const { fixture, el, http } = render();
      type(el, 'input[type=email]', 'not-an-email');
      await submit(fixture, el);

      http.expectNone('/api/auth/login');
      expect(el.textContent).toContain('ایمیل معتبر نیست.');
      expect(el.textContent).toContain('رمز عبور را وارد کن.');
    });

    it('logs in and goes where the learner wanted to go', async () => {
      const { fixture, el, http } = render({ redirect: '/account' });
      type(el, 'input[type=email]', ' Nasim@Example.com ');
      type(el, 'input[type=password]', 'secret-pass');
      const navigated = vi_spy(TestBed.inject(Router));
      await submit(fixture, el);

      const req = http.expectOne('/api/auth/login');
      expect(req.request.body).toEqual({ email: 'Nasim@Example.com', password: 'secret-pass' });
      req.flush(authResponse());
      await settle(fixture);
      expect(navigated()).toBe('/account');
    });

    it('shows one message for a wrong email or password', async () => {
      const { fixture, el, http } = render();
      type(el, 'input[type=email]', 'nasim@example.com');
      type(el, 'input[type=password]', 'wrong-password');
      await submit(fixture, el);

      http.expectOne('/api/auth/login').flush({ detail: 'x' }, { status: 401, statusText: 'Unauthorized' });
      await settle(fixture);
      expect(el.querySelector('.error')?.textContent).toContain('ایمیل یا رمز عبور درست نیست.');
    });

    it('tells the learner that the password was changed', () => {
      const { el } = render({ changed: '1' });
      expect(el.querySelector('.info')?.textContent).toContain('رمز عبور عوض شد');
    });
  });

  describe('RegisterPage', () => {
    const render = () => {
      const fixture = TestBed.createComponent(RegisterPage);
      fixture.detectChanges();
      return { fixture, el: fixture.nativeElement as HTMLElement, http: TestBed.inject(HttpTestingController) };
    };
    const fill = (el: HTMLElement, over: Partial<Record<'name' | 'email' | 'password' | 'confirm', string>> = {}) => {
      const values = { name: 'نسیم', email: 'nasim@example.com', password: 'a-good-password', confirm: 'a-good-password', ...over };
      const inputs = el.querySelectorAll<HTMLInputElement>('input');
      [values.name, values.email, values.password, values.confirm].forEach((value, i) => {
        inputs[i].value = value;
        inputs[i].dispatchEvent(new Event('input'));
        inputs[i].dispatchEvent(new Event('blur'));
      });
    };
    const submit = async (fixture: ReturnType<typeof render>['fixture'], el: HTMLElement) => {
      el.querySelector<HTMLFormElement>('form')!.dispatchEvent(new Event('submit'));
      await fixture.whenStable();
      fixture.detectChanges();
    };

    it.each([
      [{ password: '12345678', confirm: '12345678' }, 'رمز عبور نباید فقط عدد باشد.'],
      [{ password: 'short', confirm: 'short' }, 'رمز عبور حداقل ۸ کاراکتر باشد.'],
      [{ confirm: 'something-else' }, 'تکرار رمز عبور با رمز عبور یکی نیست.'],
      [{ email: 'nasim@example.com', password: 'nasim@example.com', confirm: 'nasim@example.com' }, 'رمز عبور نباید با ایمیل یکی باشد.'],
      [{ name: 'ن' }, 'نام حداقل ۲ کاراکتر باشد.'],
    ])('rejects %o before anything is sent', async (values, message) => {
      const { fixture, el, http } = render();
      fill(el, values);
      await submit(fixture, el);

      http.expectNone('/api/auth/register');
      expect(el.textContent).toContain(message);
    });

    it('creates the account', async () => {
      const { fixture, el, http } = render();
      fill(el);
      await submit(fixture, el);

      const req = http.expectOne('/api/auth/register');
      expect(req.request.body).toEqual({ email: 'nasim@example.com', password: 'a-good-password', displayName: 'نسیم' });
      req.flush(authResponse());
      await settle(fixture);
    });

    it('says when the email is already registered', async () => {
      const { fixture, el, http } = render();
      fill(el);
      await submit(fixture, el);
      http.expectOne('/api/auth/register').flush({ detail: 'x' }, { status: 409, statusText: 'Conflict' });
      await settle(fixture);

      expect(el.querySelector('.error')?.textContent).toContain('قبلاً ثبت‌نام');
    });
  });
});

/** Records the url the router was sent to. */
function vi_spy(router: Router): () => string | null {
  let last: string | null = null;
  const original = router.navigateByUrl.bind(router);
  router.navigateByUrl = ((url: string | import('@angular/router').UrlTree, extras?: import('@angular/router').NavigationBehaviorOptions) => {
    last = String(url);
    return original(url, extras);
  }) as typeof router.navigateByUrl;
  return () => last;
}

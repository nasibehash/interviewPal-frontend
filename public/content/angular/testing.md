تست خوب رفتار را می‌سنجد، نه پیاده‌سازی را. در Angular 22 تست‌ها با Vitest (`ng test`) و `TestBed` نوشته می‌شوند.

## مثال: کامپوننت + HTTP + signal

```typescript
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Component, inject, signal } from '@angular/core';
import { httpResource } from '@angular/common/http';

@Component({ selector: 'app-user', template: `{{ user.value()?.name }}` })
class UserCard {
  readonly id = signal(1);
  readonly user = httpResource<{ name: string }>(() => `/api/users/${this.id()}`);
}

describe('UserCard', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }),
  );

  it('loads the user and renders the name', async () => {
    const fixture = TestBed.createComponent(UserCard);
    fixture.detectChanges();

    const http = TestBed.inject(HttpTestingController);
    http.expectOne('/api/users/1').flush({ name: 'Nasim' }); // پاسخ ساختگی

    await fixture.whenStable();                // signal و رندر تمام شود
    expect(fixture.nativeElement.textContent).toContain('Nasim');
    http.verify();                             // درخواست بی‌پاسخ نمانده باشد
  });

  it('mocks a dependency with a provider', () => {
    class Clock { now() { return Date.now(); } }
    TestBed.configureTestingModule({ providers: [{ provide: Clock, useValue: { now: () => 42 } }] });
    expect(TestBed.inject(Clock).now()).toBe(42);
  });

  it('controls time with fake timers', () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    setTimeout(fn, 300);
    vi.advanceTimersByTime(300);
    expect(fn).toHaveBeenCalledOnce();
    vi.useRealTimers();
  });
});
```

## نکته‌های سنیور

- با `fixture.componentRef.setInput('name', value)` ورودی (حتی `input()` signal) را مثل والد ست کن.
- به‌جای `fixture.detectChanges()` پشت‌سرهم، `await fixture.whenStable()` منتظر تمام‌شدن signal و async می‌ماند.
- از `HttpTestingController.verify()` در `afterEach` استفاده کن تا درخواست فراموش‌شده شکست بخورد.
- تست‌های **سرویس + signal** را بدون TestBed و بدون DOM بنویس (سریع‌ترین)؛ DOM فقط برای رفتار کاربر.
- زمان و تایمر: `vi.useFakeTimers()`؛ در RxJS تست‌های زمان‌دار با `TestScheduler` (marble) دقیق‌تر است.
- E2E (Playwright) را برای مسیر حیاتی (ورود، پرداخت) نگه دار، نه برای هر چیزی.

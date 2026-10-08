import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { ReportDialog } from './report-dialog';

describe('ReportDialog (signal form)', () => {
  const render = () => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    const fixture = TestBed.createComponent(ReportDialog);
    fixture.componentRef.setInput('questionId', 'angular-q1');
    fixture.detectChanges();
    return { fixture, http: TestBed.inject(HttpTestingController), el: fixture.nativeElement as HTMLElement };
  };

  it('submits the chosen reason and message', async () => {
    const { fixture, http, el } = render();
    el.querySelector<HTMLButtonElement>('button.link')!.click();
    fixture.detectChanges();

    const select = el.querySelector<HTMLSelectElement>('select')!;
    select.value = 'Typo';
    select.dispatchEvent(new Event('input')); // signal forms listen to "input" for every control
    const input = el.querySelector<HTMLInputElement>('input')!;
    input.value = '  غلط املایی در متن  ';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    el.querySelector<HTMLFormElement>('form')!.dispatchEvent(new Event('submit'));
    await fixture.whenStable();
    const req = http.expectOne('/api/questions/angular-q1/reports');
    expect(req.request.body).toEqual({ reason: 'Typo', message: 'غلط املایی در متن' });
    req.flush(null, { status: 204, statusText: 'No Content' });
    await fixture.whenStable();
    fixture.detectChanges();
    expect(el.textContent).toContain('ممنون');
  });

  it('does not submit a message that is longer than 500 characters', async () => {
    const { fixture, http, el } = render();
    el.querySelector<HTMLButtonElement>('button.link')!.click();
    fixture.detectChanges();

    const input = el.querySelector<HTMLInputElement>('input')!;
    input.removeAttribute('maxlength');
    input.value = 'x'.repeat(501);
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(el.textContent).toContain('حداکثر ۵۰۰');
    el.querySelector<HTMLFormElement>('form')!.dispatchEvent(new Event('submit'));
    await fixture.whenStable();
    http.expectNone('/api/questions/angular-q1/reports');
  });
});

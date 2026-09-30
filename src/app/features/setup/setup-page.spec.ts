import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, expect, it } from 'vitest';
import { PracticeSessionStore } from '../../core/practice-session';
import { makeQuestion, makeSession } from '../../core/testing';
import { SetupPage } from './setup-page';

describe('SetupPage', () => {
  it('lists technologies and starts a session with the selection', async () => {
    sessionStorage.clear();
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([{ path: 'practice', component: SetupPage }])] });
    const http = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(SetupPage);
    fixture.detectChanges();
    http.expectOne('/api/technologies').flush([
      { slug: 'angular', name: 'Angular', currentVersion: '22', supportedFrom: '20', questionCount: 50, countByLevel: { Junior: 16, Mid: 18, Senior: 16 } },
    ]);
    await fixture.whenStable();
    fixture.detectChanges();

    const el: HTMLElement = fixture.nativeElement;
    const tech = el.querySelector<HTMLButtonElement>('.tech');
    expect(tech?.textContent).toContain('Angular');
    tech!.click();
    fixture.detectChanges();
    expect(tech!.getAttribute('aria-pressed')).toBe('true');

    el.querySelector<HTMLButtonElement>('.start')!.click();
    const req = http.expectOne('/api/practice/sessions');
    expect(req.request.body).toMatchObject({ technologies: ['angular'], count: 20, mode: 'Learning' });
    req.flush(makeSession([makeQuestion()]));
    await fixture.whenStable();
    expect(TestBed.inject(PracticeSessionStore).phase()).toBe('practicing');
  });
});

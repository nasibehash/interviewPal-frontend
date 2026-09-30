import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';
import { LessonProgress } from '../../core/lesson-progress';
import { LessonDetail } from '../../core/models';
import { LessonPage } from './lesson-page';

const detail: LessonDetail = {
  id: 'binary-search',
  kind: 'Algorithm',
  title: 'جستجوی دودویی',
  category: 'searching',
  level: 'Junior',
  summary: 'خلاصه',
  tags: [],
  estimatedMinutes: 10,
  scenario: 'مثال واقعی',
  explanation: 'توضیح',
  timeComplexity: 'O(log n)',
  spaceComplexity: 'O(1)',
  whenToUse: 'وقتی مرتب است',
  whenNotToUse: null,
  commonMistake: null,
  technologies: ['javascript', 'react'],
  implementation: { technology: 'javascript', title: 'پیاده‌سازی', language: 'javascript', code: 'const a = 1;', walkthrough: 'شرح' },
  exercises: [
    { id: 'e1', text: 'سؤال اول', choices: [{ id: 0, text: 'الف' }, { id: 1, text: 'ب' }] },
    { id: 'e2', text: 'سؤال دوم', choices: [{ id: 0, text: 'ج' }, { id: 1, text: 'د' }] },
  ],
};

describe('LessonPage', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])] });
  });

  const render = async () => {
    const http = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(LessonPage);
    fixture.componentRef.setInput('id', 'binary-search');
    fixture.detectChanges();
    const req = http.expectOne((r) => r.url === '/api/lessons/binary-search');
    expect(req.request.params.get('technology')).toBe('javascript');
    req.flush(detail);
    await fixture.whenStable();
    fixture.detectChanges();
    return { fixture, http, el: fixture.nativeElement as HTMLElement };
  };

  it('shows the scenario, the complexity and the implementation for the chosen technology', async () => {
    const { el } = await render();
    expect(el.textContent).toContain('مثال واقعی');
    expect(el.querySelector('.complexity')?.textContent).toContain('O(log n)');
    expect(el.querySelector('app-code-block code')?.textContent).toContain('const a = 1;');
  });

  it('requests the lesson again in another technology', async () => {
    const { fixture, http, el } = await render();
    [...el.querySelectorAll<HTMLButtonElement>('[aria-label="انتخاب زبان"] .chip')].find((b) => b.textContent?.includes('React'))!.click();
    fixture.detectChanges();
    const req = http.expectOne((r) => r.url === '/api/lessons/binary-search');
    expect(req.request.params.get('technology')).toBe('react');
  });

  it('checks an exercise and records the result', async () => {
    const { fixture, http, el } = await render();
    el.querySelectorAll<HTMLButtonElement>('.choice')[1].click();
    const req = http.expectOne('/api/lessons/binary-search/exercises/e1/check');
    expect(req.request.body).toEqual({ choiceId: 1 });
    req.flush({ exerciseId: 'e1', isCorrect: true, correctChoiceId: 1, explanation: 'چون درست است' });
    await fixture.whenStable();
    fixture.detectChanges();

    expect(el.querySelector('.verdict')?.textContent).toContain('درست بود');
    expect(el.querySelector('.explanation')?.textContent).toContain('چون درست است');
    expect(TestBed.inject(LessonProgress).answersOf('binary-search')).toEqual({ e1: true });
  });
});

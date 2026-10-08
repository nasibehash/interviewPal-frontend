import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LessonSummary } from '../../core/models';
import { LessonsPage, normalize } from './lessons-page';

const lesson = (over: Partial<LessonSummary>): LessonSummary => ({
  id: 'binary-search',
  kind: 'Algorithm',
  title: 'جستجوی دودویی',
  category: 'searching',
  level: 'Junior',
  summary: 'خلاصه',
  tags: [],
  estimatedMinutes: 10,
  ...over,
});

describe('LessonsPage', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])] });
  });

  const render = async (lessons: LessonSummary[]) => {
    const http = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(LessonsPage);
    fixture.detectChanges();
    http.expectOne((r) => r.url === '/api/lessons').flush(lessons);
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture;
  };

  const titles = (el: HTMLElement) => [...el.querySelectorAll('.lesson strong')].map((e) => e.textContent?.trim());

  it('shows algorithms first, grouped by category', async () => {
    const fixture = await render([
      lesson({}),
      lesson({ id: 'strategy', kind: 'DesignPattern', title: 'استراتژی', category: 'behavioral' }),
      lesson({ id: 'bfs', title: 'BFS', category: 'graphs', level: 'Mid' }),
    ]);
    const el: HTMLElement = fixture.nativeElement;
    expect(titles(el)).toEqual(['جستجوی دودویی', 'BFS']);
    expect([...el.querySelectorAll('.category')].map((e) => e.textContent?.trim())).toEqual(['جست‌وجو', 'گراف']);
  });

  it('switches to design patterns and filters by level', async () => {
    const fixture = await render([
      lesson({}),
      lesson({ id: 'strategy', kind: 'DesignPattern', title: 'استراتژی', category: 'behavioral', level: 'Junior' }),
      lesson({ id: 'state', kind: 'DesignPattern', title: 'حالت', category: 'behavioral', level: 'Mid' }),
    ]);
    const el: HTMLElement = fixture.nativeElement;

    el.querySelectorAll<HTMLButtonElement>('[role="tab"]')[1].click();
    fixture.detectChanges();
    expect(titles(el)).toEqual(['استراتژی', 'حالت']);

    [...el.querySelectorAll<HTMLButtonElement>('.filters .chip')].find((b) => b.textContent?.includes('مید'))!.click();
    fixture.detectChanges();
    expect(titles(el)).toEqual(['حالت']);
  });

  it('remembers the chosen technology', async () => {
    const fixture = await render([lesson({})]);
    const react = [...(fixture.nativeElement as HTMLElement).querySelectorAll<HTMLButtonElement>('.tech .chip')].find((b) =>
      b.textContent?.includes('React'),
    )!;
    react.click();
    fixture.detectChanges();
    expect(react.getAttribute('aria-pressed')).toBe('true');
    expect(localStorage.getItem('interviewpal.technology.v1')).toBe('"react"');
  });

  it('searches titles, summaries and tags, treating Arabic and Persian letters alike', async () => {
    const fixture = await render([
      lesson({ id: 'lru', title: 'کش LRU', category: 'caching', tags: ['cache'] }),
      lesson({ id: 'bfs', title: 'BFS', category: 'graphs', tags: ['graph'] }),
    ]);
    vi.useFakeTimers(); // after rendering: whenStable() would wait forever on fake timers
    try {
      const el: HTMLElement = fixture.nativeElement;
      const input = el.querySelector<HTMLInputElement>('input.search')!;

      input.value = 'كش'; // Arabic kaf, the Persian title uses "ک"
      input.dispatchEvent(new Event('input'));
      await vi.advanceTimersByTimeAsync(300); // the form debounces typing by 250 ms
      fixture.detectChanges();
      expect(titles(el)).toEqual(['کش LRU']);

      input.value = 'graph';
      input.dispatchEvent(new Event('input'));
      await vi.advanceTimersByTimeAsync(300);
      fixture.detectChanges();
      expect(titles(el)).toEqual(['BFS']);
    } finally {
      vi.useRealTimers();
    }
  });

  it('normalize unifies Arabic letters', () => {
    expect(normalize(' كتاب يك ')).toBe('کتاب یک');
  });
});

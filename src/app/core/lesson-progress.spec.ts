import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { LessonProgress } from './lesson-progress';
import { PreferredTechnology } from './preferred-technology';

describe('LessonProgress', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.resetTestingModule();
  });

  it('completes a lesson only when every exercise was answered correctly', () => {
    const progress = TestBed.inject(LessonProgress);
    progress.record('l1', 'e1', true, 2);
    expect(progress.completedIds().has('l1')).toBe(false);
    progress.record('l1', 'e2', false, 2);
    expect(progress.completedIds().has('l1')).toBe(false);
    progress.record('l1', 'e2', true, 2); // the latest answer counts
    expect(progress.completedIds().has('l1')).toBe(true);
  });

  it('persists and clears', () => {
    TestBed.inject(LessonProgress).record('l1', 'e1', true, 1);
    TestBed.resetTestingModule();
    const again = TestBed.inject(LessonProgress);
    expect(again.completedIds().has('l1')).toBe(true);
    again.clear();
    expect(again.completedIds().size).toBe(0);
  });
});

describe('PreferredTechnology', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.resetTestingModule();
  });

  it('defaults to javascript, remembers a choice and ignores unknown values', () => {
    const technology = TestBed.inject(PreferredTechnology);
    expect(technology.slug()).toBe('javascript');
    technology.set('dotnet');
    technology.set('cobol');
    expect(technology.slug()).toBe('dotnet');

    TestBed.resetTestingModule();
    expect(TestBed.inject(PreferredTechnology).slug()).toBe('dotnet');
  });

  it('falls back to javascript when storage holds garbage', () => {
    localStorage.setItem('interviewpal.technology.v1', '"cobol"');
    expect(TestBed.inject(PreferredTechnology).slug()).toBe('javascript');
  });
});

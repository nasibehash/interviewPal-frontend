import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { LessonExercise } from '../../core/models';
import { LessonExerciseView } from './lesson-exercise';

const exercise = (id: string, text: string): LessonExercise => ({
  id,
  text,
  choices: [
    { id: 0, text: 'الف' },
    { id: 1, text: 'ب' },
  ],
});

describe('LessonExerciseView', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
  });

  it('forgets the previous answer when the same component instance gets another exercise (linkedSignal)', async () => {
    const http = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(LessonExerciseView);
    fixture.componentRef.setInput('lessonId', 'binary-search');
    fixture.componentRef.setInput('total', 2);
    fixture.componentRef.setInput('exercise', exercise('e1', 'سؤال اول'));
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;

    el.querySelectorAll<HTMLButtonElement>('.choice')[0].click();
    http.expectOne('/api/lessons/binary-search/exercises/e1/check').flush({
      exerciseId: 'e1',
      isCorrect: false,
      correctChoiceId: 1,
      explanation: 'توضیح',
    });
    await fixture.whenStable();
    fixture.detectChanges();
    expect(el.querySelector('.verdict')?.textContent).toContain('اشتباه');

    fixture.componentRef.setInput('exercise', exercise('e2', 'سؤال دوم'));
    fixture.detectChanges();
    expect(el.querySelector('.verdict')).toBeNull();
    expect(el.querySelectorAll('.choice.wrong, .choice.correct, .choice.picked').length).toBe(0);
    expect(el.textContent).toContain('سؤال دوم');
  });
});

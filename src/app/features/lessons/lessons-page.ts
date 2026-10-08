import { Component, computed, inject, signal } from '@angular/core';
import { FormField, debounce, form } from '@angular/forms/signals';
import { RouterLink } from '@angular/router';
import { ApiClient } from '../../core/api-client';
import { LessonProgress } from '../../core/lesson-progress';
import { Level, LessonKind, LessonSummary, LEVELS } from '../../core/models';
import {
  PreferredTechnology,
  TECHNOLOGY_LABELS,
  TECHNOLOGY_SLUGS,
} from '../../core/preferred-technology';
import { LEVEL_LABELS } from '../../shared/question-view';
import { CATEGORY_LABELS, KIND_LABELS } from './lesson-labels';

/** Persian search: unify Arabic and Persian letters ("ك" and "ي") and ignore case and spacing. */
export const normalize = (text: string): string =>
  text.trim().toLowerCase().replaceAll('ي', 'ی').replaceAll('ك', 'ک');

const matches = (lesson: LessonSummary, query: string): boolean =>
  [lesson.title, lesson.summary, ...lesson.tags].some((field) => normalize(field).includes(query));

@Component({
  selector: 'app-lessons-page',
  imports: [RouterLink, FormField],
  templateUrl: './lessons-page.html',
  styleUrl: './lessons-page.scss',
})
export class LessonsPage {
  protected readonly progress = inject(LessonProgress);
  protected readonly technology = inject(PreferredTechnology);

  protected readonly lessons = inject(ApiClient).lessonsResource();

  protected readonly kinds = Object.keys(KIND_LABELS) as LessonKind[];
  protected readonly kindLabels = KIND_LABELS;
  protected readonly levels = LEVELS;
  protected readonly levelLabels = LEVEL_LABELS;
  protected readonly technologies = TECHNOLOGY_SLUGS;
  protected readonly technologyLabels = TECHNOLOGY_LABELS;
  protected readonly categoryLabel = (c: string): string => CATEGORY_LABELS[c] ?? c;

  protected readonly kind = signal<LessonKind>('Algorithm');
  protected readonly level = signal<Level | null>(null);

  /** Search box as a signal form; the model updates 250 ms after the learner stops typing. */
  protected readonly search = form(signal({ query: '' }), (path) => {
    debounce(path.query, 250);
  });

  protected readonly visible = computed(() => {
    const query = normalize(this.search.query().value());
    return this.lessons
      .value()
      .filter((l) => l.kind === this.kind() && (this.level() === null || l.level === this.level()))
      .filter((l) => query === '' || matches(l, query));
  });

  /** Lessons of the current kind grouped by category, in the order the API returned them. */
  protected readonly groups = computed(() => {
    const byCategory = new Map<string, LessonSummary[]>();
    for (const lesson of this.visible()) {
      byCategory.set(lesson.category, [...(byCategory.get(lesson.category) ?? []), lesson]);
    }
    return [...byCategory].map(([category, items]) => ({ category, items }));
  });

  protected readonly doneCount = computed(
    () =>
      this.lessons
        .value()
        .filter((l) => l.kind === this.kind() && this.progress.completedIds().has(l.id)).length,
  );
  protected readonly totalCount = computed(
    () => this.lessons.value().filter((l) => l.kind === this.kind()).length,
  );

  protected toggleLevel(level: Level): void {
    this.level.update((current) => (current === level ? null : level));
  }
}

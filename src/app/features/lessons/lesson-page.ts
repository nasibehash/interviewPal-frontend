import { Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiClient } from '../../core/api-client';
import { LessonProgress } from '../../core/lesson-progress';
import { PreferredTechnology, TECHNOLOGY_LABELS } from '../../core/preferred-technology';
import { CodeBlock } from '../../shared/code-block';
import { MarkdownPipe } from '../../shared/markdown.pipe';
import { LEVEL_LABELS } from '../../shared/question-view';
import { CATEGORY_LABELS, KIND_LABELS } from './lesson-labels';
import { LessonExerciseView } from './lesson-exercise';

@Component({
  selector: 'app-lesson-page',
  imports: [RouterLink, MarkdownPipe, CodeBlock, LessonExerciseView],
  templateUrl: './lesson-page.html',
  styleUrl: './lesson-page.scss',
})
export class LessonPage {
  /** From the route (:id) through withComponentInputBinding. */
  readonly id = input.required<string>();

  protected readonly technology = inject(PreferredTechnology);
  private readonly progress = inject(LessonProgress);

  /** Fetched again whenever the route id or the chosen technology changes. */
  protected readonly lesson = inject(ApiClient).lessonResource(this.id, () =>
    this.technology.slug(),
  );

  protected readonly technologyLabels = TECHNOLOGY_LABELS;
  protected readonly levelLabels = LEVEL_LABELS;
  protected readonly kindLabels = KIND_LABELS;
  protected readonly categoryLabel = (c: string): string => CATEGORY_LABELS[c] ?? c;

  protected readonly answered = computed(
    () => Object.keys(this.progress.answersOf(this.id())).length,
  );
  protected readonly correct = computed(
    () => Object.values(this.progress.answersOf(this.id())).filter(Boolean).length,
  );
}

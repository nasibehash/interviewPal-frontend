import { Component, computed, inject, signal } from '@angular/core';
import { FormField, debounce, form } from '@angular/forms/signals';
import { RouterLink } from '@angular/router';
import { GuideCatalog, GuideTopic } from '../../core/guides';
import { normalize } from '../lessons/lessons-page';

const matches = (topic: GuideTopic, query: string): boolean =>
  [topic.title, topic.summary, topic.slug].some((field) => normalize(field).includes(query));

@Component({
  selector: 'app-guides-page',
  imports: [RouterLink, FormField],
  templateUrl: './guides-page.html',
  styleUrl: './guides-page.scss',
})
export class GuidesPage {
  private readonly guides = inject(GuideCatalog);
  protected readonly catalog = this.guides.index;

  /** Search box as a signal form; the model updates 250 ms after the learner stops typing. */
  protected readonly search = form(signal({ query: '' }), (path) => {
    debounce(path.query, 250);
  });

  protected readonly sections = computed(() => {
    const query = normalize(this.search.query().value());
    const { groups, topics } = this.guides.data();
    return groups
      .map((group) => ({
        group,
        topics: topics.filter((t) => t.group === group.id && (query === '' || matches(t, query))),
      }))
      .filter((section) => section.topics.length > 0);
  });

  protected readonly total = computed(() => this.guides.data().topics.length);
  protected readonly minutes = computed(() =>
    this.guides.data().topics.reduce((sum, t) => sum + t.minutes, 0),
  );
}

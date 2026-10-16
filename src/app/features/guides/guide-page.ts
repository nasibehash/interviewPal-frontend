import { httpResource } from '@angular/common/http';
import { Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { GUIDES_BASE, GuideCatalog } from '../../core/guides';
import { MarkdownPipe } from '../../shared/markdown.pipe';

@Component({
  selector: 'app-guide-page',
  imports: [RouterLink, MarkdownPipe],
  templateUrl: './guide-page.html',
  styleUrl: './guide-page.scss',
})
export class GuidePage {
  private readonly guides = inject(GuideCatalog);

  /** From the route (:slug) through withComponentInputBinding. */
  readonly slug = input.required<string>();

  protected readonly position = computed(() =>
    this.guides.data().topics.findIndex((t) => t.slug === this.slug()),
  );
  protected readonly topic = computed(() => this.guides.data().topics[this.position()]);
  protected readonly previous = computed(() => this.guides.data().topics[this.position() - 1]);
  protected readonly next = computed(() => this.guides.data().topics[this.position() + 1]);
  protected readonly groupTitle = computed(
    () => this.guides.data().groups.find((g) => g.id === this.topic()?.group)?.title ?? '',
  );

  // Only slugs from the index are requested: the host rewrites unknown paths to index.html
  protected readonly body = httpResource.text(() => {
    const topic = this.topic();
    return topic ? `${GUIDES_BASE}/${topic.slug}.md` : undefined;
  });

  protected readonly missing = computed(() => !this.guides.index.isLoading() && !this.topic());
}

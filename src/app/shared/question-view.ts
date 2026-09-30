import { Component, computed, input } from '@angular/core';
import { Question } from '../core/models';
import { MarkdownPipe } from './markdown.pipe';
import { highlightCode } from './markdown';
import { DomSanitizer } from '@angular/platform-browser';
import { inject } from '@angular/core';

export const LEVEL_LABELS = { Junior: 'جونیور', Mid: 'مید', Senior: 'سنیور' } as const;

@Component({
  selector: 'app-question-view',
  imports: [MarkdownPipe],
  template: `
    <div class="meta">
      <span class="badge level-{{ question().level }}">{{ levelLabel() }}</span>
      <span class="badge">{{ question().technology }}</span>
      @for (tag of question().tags; track tag) {
        <span class="tag">{{ tag }}</span>
      }
    </div>
    <div class="text" [innerHTML]="question().text | markdown"></div>
    @if (code(); as html) {
      <pre dir="ltr"><code class="hljs" [innerHTML]="html"></code></pre>
    }
  `,
  styles: `
    .meta { display: flex; flex-wrap: wrap; gap: 0.4rem; margin-block-end: 0.75rem; }
    .badge, .tag { font-size: 0.8rem; padding: 0 0.6rem; border-radius: 99rem; background: var(--code-bg); }
    .badge { font-weight: 600; }
    .level-Junior { background: var(--good-soft); color: var(--good); }
    .level-Mid { background: var(--warn-soft); color: var(--warn); }
    .level-Senior { background: var(--bad-soft); color: var(--bad); }
    .tag { color: var(--muted); direction: ltr; }
    .text { font-size: 1.05rem; }
    .text :first-child { margin-block-start: 0; }
    pre { background: var(--code-bg); border-radius: 0.7rem; padding: 1rem; overflow-x: auto; margin: 0.75rem 0 0; font-size: 0.9rem; line-height: 1.6; }
  `,
})
export class QuestionView {
  readonly question = input.required<Question>();
  private readonly sanitizer = inject(DomSanitizer);

  protected readonly levelLabel = computed(() => LEVEL_LABELS[this.question().level]);
  protected readonly code = computed(() => {
    const q = this.question();
    // highlight.js escapes the code itself, so the produced markup is safe.
    return q.codeSnippet
      ? this.sanitizer.bypassSecurityTrustHtml(highlightCode(q.codeSnippet, q.codeLanguage))
      : null;
  });
}

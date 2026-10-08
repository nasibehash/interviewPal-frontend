import { Component, computed, inject, input } from '@angular/core';
import { Question } from '../core/models';
import { MarkdownPipe } from './markdown.pipe';
import { highlightCode } from './markdown';
import { DomSanitizer } from '@angular/platform-browser';

export const LEVEL_LABELS = { Junior: 'جونیور', Mid: 'مید', Senior: 'سنیور' } as const;

@Component({
  selector: 'app-question-view',
  imports: [MarkdownPipe],
  templateUrl: './question-view.html',
  styleUrl: './question-view.scss',
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

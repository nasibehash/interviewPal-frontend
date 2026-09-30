import { Pipe, PipeTransform, inject } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { renderMarkdown } from './markdown';

@Pipe({ name: 'markdown' })
export class MarkdownPipe implements PipeTransform {
  private readonly sanitizer = inject(DomSanitizer);

  transform(value: string | null | undefined): SafeHtml {
    // renderMarkdown already ran DOMPurify, so the result can be trusted as HTML.
    return this.sanitizer.bypassSecurityTrustHtml(renderMarkdown(value ?? ''));
  }
}

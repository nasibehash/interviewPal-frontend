import { Component, computed, inject, input, signal } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { highlightCode } from './markdown';

/** A read-only, syntax-highlighted code sample with a copy button. Code is always left-to-right. */
@Component({
  selector: 'app-code-block',
  templateUrl: './code-block.html',
  styleUrl: './code-block.scss',
})
export class CodeBlock {
  readonly code = input.required<string>();
  readonly language = input('text');

  private readonly sanitizer = inject(DomSanitizer);
  protected readonly copied = signal(false);

  // highlight.js escapes the code itself, so the produced markup is safe to bind
  protected readonly html = computed(() =>
    this.sanitizer.bypassSecurityTrustHtml(highlightCode(this.code(), this.language())),
  );

  protected async copy(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.code());
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 1500);
    } catch {
      // clipboard unavailable (insecure context / denied): nothing else to do
    }
  }
}

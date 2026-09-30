import { Component, computed, inject, input, signal } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { highlightCode } from './markdown';

/** A read-only, syntax-highlighted code sample with a copy button. Code is always left-to-right. */
@Component({
  selector: 'app-code-block',
  template: `
    <div class="head">
      <span class="lang">{{ language() }}</span>
      <button type="button" class="copy" (click)="copy()">{{ copied() ? 'کپی شد ✓' : 'کپی کد' }}</button>
    </div>
    <pre dir="ltr" tabindex="0"><code class="hljs" [innerHTML]="html()"></code></pre>
  `,
  styles: `
    :host { display: block; border: 1px solid var(--border); border-radius: 0.8rem; overflow: hidden; }
    .head { display: flex; justify-content: space-between; align-items: center; padding: 0.3rem 0.8rem; background: var(--code-bg); font-size: 0.8rem; color: var(--muted); }
    .lang { direction: ltr; }
    .copy { font: inherit; background: none; border: 0; color: var(--primary); cursor: pointer; }
    pre { margin: 0; padding: 1rem; overflow-x: auto; background: var(--code-bg); font-size: 0.85rem; line-height: 1.6; }
  `,
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

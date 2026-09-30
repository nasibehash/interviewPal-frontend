import { Component, input } from '@angular/core';
import { Answer } from '../core/models';
import { MarkdownPipe } from './markdown.pipe';

@Component({
  selector: 'app-answer-panel',
  imports: [MarkdownPipe],
  template: `
    <section class="short">
      <h3>جواب کوتاه (برای گفتن در مصاحبه)</h3>
      <p>{{ answer().shortAnswer }}</p>
    </section>
    <section>
      <h3>توضیح کامل</h3>
      <div class="md" [innerHTML]="answer().explanation | markdown"></div>
    </section>
    @if (answer().commonMistake; as mistake) {
      <section class="mistake">
        <h3>اشتباه رایج</h3>
        <div class="md" [innerHTML]="mistake | markdown"></div>
      </section>
    }
    @if (answer().followUpQuestion; as followUp) {
      <section class="followup">
        <h3>سؤال بعدیِ مصاحبه‌کننده</h3>
        <div class="md" [innerHTML]="followUp | markdown"></div>
      </section>
    }
  `,
  styles: `
    section { margin-block-start: 1rem; padding: 0.9rem 1rem; border-radius: 0.8rem; border: 1px solid var(--border); }
    h3 { font-size: 0.95rem; margin: 0 0 0.3rem; color: var(--muted); }
    p { margin: 0; }
    .short { background: var(--primary-soft); border-color: transparent; }
    .mistake { background: var(--warn-soft); border-color: transparent; }
    .md :first-child { margin-block-start: 0; }
    .md :last-child { margin-block-end: 0; }
    .md pre { background: var(--code-bg); border-radius: 0.6rem; padding: 0.8rem; overflow-x: auto; font-size: 0.88rem; }
    .md code:not(pre code) { background: var(--code-bg); padding: 0 0.3rem; border-radius: 0.3rem; }
  `,
})
export class AnswerPanel {
  readonly answer = input.required<Answer>();
}

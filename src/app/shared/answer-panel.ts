import { Component, input } from '@angular/core';
import { Answer } from '../core/models';
import { MarkdownPipe } from './markdown.pipe';

@Component({
  selector: 'app-answer-panel',
  imports: [MarkdownPipe],
  templateUrl: './answer-panel.html',
  styleUrl: './answer-panel.scss',
})
export class AnswerPanel {
  readonly answer = input.required<Answer>();
}

import { Component, input } from '@angular/core';
import { FieldTree } from '@angular/forms/signals';

/** The validation messages of one signal-form field, shown once the learner has touched (left) the field. */
@Component({
  selector: 'app-field-errors',
  templateUrl: './field-errors.html',
  styleUrl: './field-errors.scss',
})
export class FieldErrors {
  readonly field = input.required<FieldTree<unknown>>();
}

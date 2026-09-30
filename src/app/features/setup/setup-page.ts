import { Component, computed, inject, signal } from '@angular/core';
import { httpResource } from '@angular/common/http';
import { Router } from '@angular/router';
import { LEVELS, Level, PracticeMode, Technology } from '../../core/models';
import { PracticeSessionStore } from '../../core/practice-session';
import { API_BASE_URL } from '../../core/api-client';
import { LEVEL_LABELS } from '../../shared/question-view';

const SECONDS_PER_QUESTION = 80;

const MODES: { value: PracticeMode; title: string; hint: string }[] = [
  { value: 'Learning', title: 'یادگیری', hint: 'بعد از هر جواب، توضیح کامل را می‌بینی.' },
  { value: 'Interview', title: 'مصاحبه', hint: 'با تایمر؛ نتیجه در پایان اعلام می‌شود.' },
  { value: 'Flashcard', title: 'فلش‌کارت', hint: 'جواب را ببین و خودت بگو بلد بودی یا نه.' },
];

@Component({
  selector: 'app-setup-page',
  templateUrl: './setup-page.html',
  styleUrl: './setup-page.scss',
})
export class SetupPage {
  private readonly store = inject(PracticeSessionStore);
  private readonly router = inject(Router);
  private readonly base = inject(API_BASE_URL);

  protected readonly technologies = httpResource<Technology[]>(() => `${this.base}/technologies`);
  protected readonly modes = MODES;
  protected readonly levels = LEVELS;
  protected readonly levelLabels = LEVEL_LABELS;

  protected readonly selectedTechs = signal<string[]>([]);
  protected readonly selectedLevels = signal<Level[]>([]);
  protected readonly count = signal(20);
  protected readonly mode = signal<PracticeMode>('Learning');
  protected readonly busy = this.store.busy;
  protected readonly error = this.store.error;

  protected readonly minutes = computed(() => Math.ceil((this.count() * SECONDS_PER_QUESTION) / 60));

  protected toggleTech(slug: string): void {
    this.selectedTechs.update((s) => (s.includes(slug) ? s.filter((x) => x !== slug) : [...s, slug]));
  }

  protected toggleLevel(level: Level): void {
    this.selectedLevels.update((s) => (s.includes(level) ? s.filter((x) => x !== level) : [...s, level]));
  }

  protected setCount(event: Event): void {
    this.count.set(Number((event.target as HTMLInputElement).value));
  }

  protected async start(): Promise<void> {
    await this.store.start({
      technologies: this.selectedTechs(),
      levels: this.selectedLevels(),
      count: this.count(),
      mode: this.mode(),
    });
    if (this.store.phase() === 'practicing') {
      await this.router.navigateByUrl('/practice');
    }
  }
}

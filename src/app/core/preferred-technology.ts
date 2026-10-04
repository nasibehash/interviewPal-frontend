import { Injectable, signal } from '@angular/core';
import { readJson, writeJson } from './safe-storage';

const KEY = 'interviewpal.technology.v1';

export const TECHNOLOGY_LABELS: Readonly<Record<string, string>> = {
  javascript: 'JavaScript',
  typescript: 'TypeScript',
  angular: 'Angular',
  react: 'React',
  nextjs: 'Next.js',
  dotnet: '.NET',
};

export const TECHNOLOGY_SLUGS = Object.keys(TECHNOLOGY_LABELS);

/** The technology the learner reads lessons in. It is remembered in the browser. */
@Injectable({ providedIn: 'root' })
export class PreferredTechnology {
  private readonly _slug = signal(this.load());
  readonly slug = this._slug.asReadonly();

  set(slug: string): void {
    if (!TECHNOLOGY_SLUGS.includes(slug)) return;
    this._slug.set(slug);
    writeJson(() => localStorage, KEY, slug);
  }

  private load(): string {
    const saved = readJson<string>(() => localStorage, KEY, 'javascript');
    return TECHNOLOGY_SLUGS.includes(saved) ? saved : 'javascript';
  }
}

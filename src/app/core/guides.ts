import { httpResource } from '@angular/common/http';
import { Injectable, computed } from '@angular/core';

export interface GuideGroup {
  id: string;
  title: string;
  description: string;
}

export interface GuideTopic {
  slug: string;
  group: string;
  title: string;
  summary: string;
  minutes: number;
}

export interface GuideIndex {
  groups: GuideGroup[];
  topics: GuideTopic[];
}

/** The guides are static Markdown files served with the app (public/content/angular). */
export const GUIDES_BASE = '/content/angular';

@Injectable({ providedIn: 'root' })
export class GuideCatalog {
  readonly index = httpResource<GuideIndex>(() => `${GUIDES_BASE}/index.json`, {
    defaultValue: { groups: [], topics: [] },
  });

  /** The index, or an empty one while loading and after a failure (reading a failed resource's value() throws). */
  readonly data = computed<GuideIndex>(() =>
    this.index.hasValue() ? this.index.value() : { groups: [], topics: [] },
  );
}

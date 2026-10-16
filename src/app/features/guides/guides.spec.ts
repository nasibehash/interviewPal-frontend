import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GuideIndex } from '../../core/guides';
import { GuidePage } from './guide-page';
import { GuidesPage } from './guides-page';

const index: GuideIndex = {
  groups: [
    { id: 'rxjs', title: 'RxJS', description: 'جریان داده' },
    { id: 'quality', title: 'کیفیت', description: 'تست' },
  ],
  topics: [
    { slug: 'rxjs-basics', group: 'rxjs', title: 'Observable', summary: 'پایه', minutes: 4 },
    {
      slug: 'rxjs-flattening',
      group: 'rxjs',
      title: 'switchMap و بقیه',
      summary: 'هم‌زمانی',
      minutes: 5,
    },
    { slug: 'testing', group: 'quality', title: 'تست', summary: 'TestBed', minutes: 5 },
  ],
};

describe('guides', () => {
  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
  });

  describe('GuidesPage', () => {
    const render = async () => {
      const http = TestBed.inject(HttpTestingController);
      const fixture = TestBed.createComponent(GuidesPage);
      fixture.detectChanges();
      http.expectOne('/content/angular/index.json').flush(index);
      await fixture.whenStable();
      fixture.detectChanges();
      return fixture;
    };
    const titles = (el: HTMLElement) =>
      [...el.querySelectorAll('.topic strong')].map((e) => e.textContent?.trim());

    it('lists the topics under their groups with the total time', async () => {
      const el: HTMLElement = (await render()).nativeElement;
      expect([...el.querySelectorAll('.group')].map((e) => e.textContent?.trim())).toEqual([
        'RxJS',
        'کیفیت',
      ]);
      expect(titles(el)).toEqual(['Observable', 'switchMap و بقیه', 'تست']);
      expect(el.textContent).toContain('3 مبحث');
      expect(el.textContent).toContain('14 دقیقه');
    });

    it('filters by the debounced search and drops empty groups', async () => {
      const fixture = await render();
      vi.useFakeTimers(); // after rendering: whenStable() would wait forever on fake timers
      try {
        const el: HTMLElement = fixture.nativeElement;
        const input = el.querySelector<HTMLInputElement>('input[type="search"]')!;
        input.value = 'switchmap';
        input.dispatchEvent(new Event('input'));
        await vi.advanceTimersByTimeAsync(300);
        fixture.detectChanges();

        expect(titles(el)).toEqual(['switchMap و بقیه']);
        expect(el.querySelectorAll('.group')).toHaveLength(1);
      } finally {
        vi.useRealTimers();
      }
    });

    it('offers a retry when the index cannot be loaded', async () => {
      const http = TestBed.inject(HttpTestingController);
      const fixture = TestBed.createComponent(GuidesPage);
      fixture.detectChanges();
      http
        .expectOne('/content/angular/index.json')
        .flush('x', { status: 500, statusText: 'Server Error' });
      await fixture.whenStable();
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('[role="alert"] button')).not.toBeNull();
    });
  });

  describe('GuidePage', () => {
    const render = async (slug: string, body?: string) => {
      const http = TestBed.inject(HttpTestingController);
      const fixture = TestBed.createComponent(GuidePage);
      fixture.componentRef.setInput('slug', slug);
      fixture.detectChanges();
      http.expectOne('/content/angular/index.json').flush(index);
      // let the effects start the next request (whenStable would wait for it)
      await new Promise((resolve) => setTimeout(resolve));
      fixture.detectChanges();
      if (body !== undefined) {
        http.expectOne(`/content/angular/${slug}.md`).flush(body);
        await fixture.whenStable();
        fixture.detectChanges();
      }
      return { fixture, http };
    };

    it('renders the Markdown of the topic with neighbours', async () => {
      const { fixture } = await render(
        'rxjs-flattening',
        '## مثال\n\n```typescript\nconst a = 1;\n```\n',
      );
      const el: HTMLElement = fixture.nativeElement;
      expect(el.querySelector('h1')?.textContent).toContain('switchMap و بقیه');
      expect(el.querySelector('.md h2')?.textContent).toBe('مثال');
      expect(el.querySelector('.md pre code.hljs')).not.toBeNull();
      expect(el.querySelector('.pager a[href="/guides/rxjs-basics"]')).not.toBeNull();
      expect(el.querySelector('.pager a[href="/guides/testing"]')).not.toBeNull();
    });

    it('sanitizes script tags in the Markdown', async () => {
      const { fixture } = await render(
        'testing',
        'سلام\n\n<script>alert(1)</script>\n<img src=x onerror="alert(1)">',
      );
      const html = (fixture.nativeElement as HTMLElement).querySelector('.md')!.innerHTML;
      expect(html).not.toContain('<script');
      expect(html).not.toContain('onerror');
    });

    it('does not request a file for a slug that is not in the index', async () => {
      const { fixture, http } = await render('nope');
      expect(fixture.nativeElement.querySelector('[role="alert"]')?.textContent).toContain(
        'پیدا نشد',
      );
      http.expectNone((r) => r.url.endsWith('.md'));
    });
  });
});

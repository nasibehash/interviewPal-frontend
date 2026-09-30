import { describe, expect, it } from 'vitest';
import { highlightCode, renderMarkdown } from './markdown';

describe('markdown', () => {
  it('renders code blocks with highlighting', () => {
    const html = renderMarkdown('```ts\nconst a: number = 1;\n```');
    expect(html).toContain('hljs-keyword');
    expect(html).toContain('dir="ltr"');
  });

  it('strips scripts and event handlers', () => {
    const html = renderMarkdown('hi <script>alert(1)</script><img src=x onerror="alert(1)">');
    expect(html).not.toContain('<script');
    expect(html).not.toContain('onerror');
  });

  it('escapes code of unknown languages', () => {
    expect(highlightCode('<b>x</b>', 'brainfuck')).toBe('&lt;b&gt;x&lt;/b&gt;');
  });
});

// Guards the Angular guides in public/content/angular: the index and the Markdown files must agree.
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const dir = join(import.meta.dirname, '..', 'public', 'content', 'angular');
const index = JSON.parse(readFileSync(join(dir, 'index.json'), 'utf8'));
const highlighted = new Set(['typescript', 'html', 'css', 'json', 'bash', 'javascript']);
const problems = [];

const groupIds = new Set(index.groups.map((g) => g.id));
if (groupIds.size !== index.groups.length) problems.push('duplicate group ids');

const slugs = index.topics.map((t) => t.slug);
if (new Set(slugs).size !== slugs.length) problems.push('duplicate topic slugs');

const files = readdirSync(dir).filter((f) => f.endsWith('.md')).map((f) => f.slice(0, -3));
for (const slug of slugs) if (!files.includes(slug)) problems.push(`${slug}: no Markdown file`);
for (const file of files) if (!slugs.includes(file)) problems.push(`${file}.md is not in index.json`);

for (const topic of index.topics) {
  if (!groupIds.has(topic.group)) problems.push(`${topic.slug}: unknown group "${topic.group}"`);
  if (!topic.title || !topic.summary) problems.push(`${topic.slug}: title and summary are required`);
  if (!(topic.minutes > 0)) problems.push(`${topic.slug}: minutes must be positive`);

  let text;
  try {
    text = readFileSync(join(dir, `${topic.slug}.md`), 'utf8');
  } catch {
    continue;
  }
  const fences = [...text.matchAll(/^```(\w*)\s*$/gm)];
  if (fences.length % 2 !== 0) problems.push(`${topic.slug}: unbalanced code fences`);
  // opening fences are the even-numbered ones
  fences.filter((_, i) => i % 2 === 0).forEach((m) => {
    if (!highlighted.has(m[1])) problems.push(`${topic.slug}: code fence language "${m[1]}" is not highlighted`);
  });
  if (!/^## /m.test(text)) problems.push(`${topic.slug}: needs at least one "##" section`);
  if (/<script/i.test(text)) problems.push(`${topic.slug}: contains <script>`);
}

if (problems.length) {
  console.error(problems.map((p) => `- ${p}`).join('\n'));
  process.exit(1);
}
console.log(`guides ok: ${index.topics.length} topics in ${index.groups.length} groups`);

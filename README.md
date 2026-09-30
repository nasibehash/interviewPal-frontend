# InterviewPal Frontend

Angular 22 app for **InterviewPal**: practice technical interview questions (Angular, JavaScript, TypeScript,
React, Next.js, .NET) in Persian. The UI is right-to-left; code stays left-to-right.

Backend: [interviewPal-backend](https://github.com/nasibehash/interviewPal-backend).

## Features (phase 1)

- Choose technologies, levels, number of questions and a mode: **Learning** (explanation after each answer),
  **Interview** (timer, results at the end, self-assessment for short-answer questions) and **Flashcard**.
- Result page with score by technology and level, weak tags, review of every question and
  "practice the weak questions again".
- **Algorithms and design patterns** (`/lessons`): 24 lessons, each with a real-world scenario, explanation, complexity,
  a code sample written for the technology you pick (JavaScript, TypeScript, Angular, React, Next.js or .NET) and exercises.
  The chosen technology and the answered exercises are remembered in the browser.
- Progress (history, streak, weak questions) is stored in the browser's `localStorage` until accounts exist.
- An unfinished session survives a page refresh (`sessionStorage`).

## Development

Requires Node 22.22+ (Node 24 recommended) and a running backend on `http://localhost:5161`.

```bash
npm install
npm start        # http://localhost:4200, /api is proxied to the backend (proxy.conf.json)
npm test         # unit tests (Vitest)
npm run build
```

## Structure

```
src/app/
  core/       models, API client, practice-session and progress stores
  shared/     markdown rendering (sanitized), question view, answer panel, report dialog
  features/   setup, practice, result, history pages (lazy loaded)
```

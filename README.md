# InterviewPal Frontend

Angular 22 app for **InterviewPal**: practice technical interview questions (Angular, JavaScript, TypeScript,
React, Next.js, .NET) in Persian. The UI is right-to-left; code stays left-to-right.

**Live app:** https://interview-pal-frontend-sable.vercel.app

Backend: [interviewPal-backend](https://github.com/nasibehash/interviewPal-backend) (API: https://interviewpal-backend.onrender.com).

## Features (phase 1)

- Choose technologies, levels, number of questions and a mode: **Learning** (explanation after each answer),
  **Interview** (timer, results at the end, self-assessment for short-answer questions) and **Flashcard**.
- Result page with score by technology and level, weak tags, review of every question and
  "practice the weak questions again".
- **Algorithms and design patterns** (`/lessons`): 24 lessons, each with a real-world scenario, explanation, complexity,
  a code sample written for the technology you pick (JavaScript, TypeScript, Angular, React, Next.js or .NET) and exercises.
  The chosen technology and the answered exercises are remembered in the browser. The list has a debounced search
  that treats Arabic and Persian letters alike.
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

## Docker

```bash
docker build -t interviewpal-web .
docker run -p 8080:80 -e API_URL=http://host.docker.internal:5161 interviewpal-web
```

The image builds the app with Node and serves it with nginx: unknown paths fall back to `index.html` (Angular routes),
hashed files are cached for a year, and `/api` is forwarded to `API_URL` (so the browser sees one origin and no CORS
setup is needed).

To run the whole app, check out the backend next to this repository and use compose:

```bash
# interviewPal-backend/  and  interviewPal-frontend/  side by side
docker compose up --build   # http://localhost:8080
```

## Deploy on Vercel

`vercel.json` sends `/api/*` to the backend on Render and every other path to `index.html` (Angular routes), so the
browser talks to one origin and the API needs no CORS setup. Project settings:

- Framework preset: Angular, build command `npm run build`, output directory `dist/interviewpal/browser`
- Node.js version: 24.x (Angular 22 needs Node 22.22 or newer)

To use another backend, change the destination in `vercel.json`. The free Render plan sleeps after 15 minutes without
traffic, so the first request after a pause can take about half a minute.

## Angular 22 features used

Zoneless change detection and `OnPush` (both defaults in 22), `httpResource` (inside `ApiClient`), Signal Forms
(`form`, `[formField]`, `[formRoot]`, `debounce`), `linkedSignal`, `@defer (on viewport)`, `@let`, signal inputs with
`withComponentInputBinding`, functional interceptors and guards, router view transitions, and Vitest through `ng test`.
The full list with where and why is in [docs/frontend.md](docs/frontend.md).

## Structure

```
src/app/
  core/       models, API client (resources + calls), error interceptor, practice-session and progress stores
  shared/     markdown rendering (sanitized), question view, answer panel, report dialog, code block
  features/   setup, practice, result, history, lessons pages (lazy loaded)
docs/         implementation document (frontend.md) and its PDF
```

Files follow the Angular 20+ style guide: no `.component` suffix (`lesson-page.ts`, class `LessonPage`), and every
component has its own `.ts`, `.html` and `.scss`.

## Documentation

The implementation document lives in [`docs/frontend.md`](docs/frontend.md) and is also available as a PDF:
[`docs/InterviewPal-Frontend.pdf`](docs/InterviewPal-Frontend.pdf). Update both together with the README when a
change affects how the app works.

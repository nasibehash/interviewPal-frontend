# InterviewPal — مستند پیاده‌سازی فرانت‌اند

> اپلیکیشن تمرین مصاحبهٔ فنی برای برنامه‌نویسان فارسی‌زبان

| مورد | مقدار |
|---|---|
| فناوری | Angular 22 (standalone، zoneless، signals) و TypeScript 6 |
| ریپو | github.com/nasibehash/interviewPal-frontend |
| اپ زنده | interview-pal-frontend-sable.vercel.app |
| API | interviewpal-backend.onrender.com (ASP.NET Core، ریپوی interviewPal-backend) |
| وضعیت | فاز ۱ (MVP): بدون ورود به حساب؛ پیشرفت کاربر در مرورگر ذخیره می‌شود |

## ۱. هدف و دامنهٔ محصول

InterviewPal به برنامه‌نویس کمک می‌کند برای مصاحبهٔ فنی تمرین کند. محتوا فارسی است و اصطلاح‌های فنی و کدها انگلیسی می‌مانند. فرانت‌اند دو بخش اصلی دارد:

- تمرین مصاحبه: ۳۰۰ سؤال در شش فناوری (Angular، JavaScript، TypeScript، React، Next.js و .NET) در سه سطح جونیور، مید و سنیور و سه حالت تمرین: یادگیری، مصاحبه (با تایمر) و فلش‌کارت.
- الگوریتم و الگوهای طراحی: ۲۴ درس (۱۴ الگوریتم و ۱۰ الگوی طراحی) که هر کدام مثال واقعی دارد و کدش به زبان یا فریم‌ورک انتخابی کاربر نمایش داده می‌شود، همراه با تمرین.
- پیشرفت من: تاریخچهٔ تمرین‌ها، میانگین نمره، روزهای پشت‌سرهم و سؤال‌های ضعیف.

## ۲. پشتهٔ فناوری و تصمیم‌های اصلی

| حوزه | انتخاب | دلیل |
|---|---|---|
| فریم‌ورک | Angular 22، کامپوننت‌های standalone | آخرین نسخه؛ بدون NgModule و با بارگذاری تنبل ساده |
| تشخیص تغییر | Zoneless و `OnPush` (هر دو پیش‌فرض Angular 22) | بدون zone.js؛ همهٔ state با signal است و فقط بخش تغییرکرده بررسی می‌شود |
| state | signal و computed در سرویس‌های root | بدون کتابخانهٔ state جدا؛ جریان داده ساده و قابل‌تست |
| داده از API | `httpResource` (داخل `ApiClient`) برای خواندن، `firstValueFrom` برای نوشتن | خواندن‌ها reactive‌اند و با تغییر signal دوباره درخواست می‌شوند |
| فرم‌ها | Signal Forms (`@angular/forms/signals`) | مدل فرم یک signal ساده است؛ بدون `FormsModule` و `ngModel` |
| قالب | کنترل‌فلو `@if` / `@for` / `@empty` | سینتکس جدید Angular، بدون `*ngIf` |
| زبان و جهت | فارسی، `dir="rtl"` و خصوصیت‌های منطقی CSS | یک پایه برای RTL؛ کدها جداگانه LTR نمایش داده می‌شوند |
| فونت | Vazirmatn (بسته `@fontsource-variable/vazirmatn`) | بدون درخواست به CDN بیرونی |
| Markdown | `marked` و `DOMPurify` و `highlight.js` | محتوای درس‌ها Markdown است؛ بعد از تبدیل پاک‌سازی (sanitize) می‌شود |
| تست | Vitest از طریق `ng test` | اجرای سریع و ساده؛ ۴۳ تست واحد |
| استایل | SCSS ساده با متغیرهای CSS و تم روشن/تیره | بدون کتابخانهٔ UI؛ حجم کم |

> **چرا ذخیره‌سازی در مرورگر؟**
>
> فاز ۱ ورود به حساب ندارد. تاریخچه و پیشرفت در `localStorage` و تمرین نیمه‌کاره در `sessionStorage` می‌ماند. همهٔ خواندن و نوشتن‌ها از یک لایهٔ امن (safe-storage) می‌گذرند تا در حالت مرور خصوصی یا ذخیره‌سازی مسدود، برنامه نشکند. وقتی حساب کاربری آمد، همین سرویس‌ها به API وصل می‌شوند و بقیهٔ برنامه تغییر نمی‌کند.

## ۳. ساختار پروژه

```text
src/app/
  app.ts / app.html / app.scss   shell: header, nav, router-outlet
  app.config.ts                  providers: http + interceptor, router features
  app.routes.ts                  lazy routes and guards
  core/                          logic and data, no UI
    models.ts                    TypeScript types of the API contract
    api-client.ts                the only place that talks HTTP (resources + calls)
    api-error.ts                 interceptor: HTTP failure -> ApiError (Persian message)
    practice-session.ts          state of the practice in progress
    progress-store.ts            history and stats (localStorage)
    lesson-progress.ts           progress of lesson exercises
    preferred-technology.ts      the language the learner picked
    self-assessment.ts           "I knew it" -> a gradable answer
    safe-storage.ts              storage reads/writes that never throw
  shared/                        shared components (ts + html + scss each)
    markdown.ts, markdown.pipe.ts, question-view, answer-panel,
    report-dialog, code-block
  features/                      pages, each one lazy loaded
    setup/  practice/  result/  history/  lessons/
docs/
  frontend.md                    this document (source)
  InterviewPal-Frontend.pdf      the same document as PDF
```

در این ساختار، هر پوشه یک مسئولیت دارد: `core` منطق و داده، `shared` اجزای تکراری و `features` صفحه‌ها.

### قرارداد نام‌گذاری فایل‌ها

از Angular 20 به بعد راهنمای رسمی سبک (style guide) و دستور `ng generate` پسوند `.component` / `.service` را حذف کرده‌اند. به‌جای `lesson.component.ts` نام فایل `lesson.ts` و نام کلاس `Lesson` است (نه `LessonComponent`). این پروژه همین قرارداد را دنبال می‌کند:

- هر کامپوننت سه فایل جدا دارد: `name.ts`، `name.html` و `name.scss` (با `templateUrl` و `styleUrl`). قالب و استایل inline فقط در تست‌ها استفاده می‌شود.
- نام صفحه‌ها پسوند `-page` دارد (`lesson-page.ts`) تا از کامپوننت‌های کوچک‌تر در پوشهٔ `shared` جدا شوند؛ این یک انتخاب پروژه است، نه الزام Angular.
- سرویس‌ها بدون پسوند و با نام معنادار: `ApiClient`، `ProgressStore`.

قاعدهٔ اصلی: `core` به هیچ کامپوننتی وابسته نیست و `features` فقط از `core` و `shared` استفاده می‌کنند. هر صفحه با `loadComponent` بارگذاری می‌شود و bundle اولیه کوچک می‌ماند (حدود ۹۲ کیلوبایت فشرده).

## ۴. مسیریابی

| مسیر | صفحه | توضیح |
|---|---|---|
| `/` | شروع تمرین | انتخاب تکنولوژی، سطح، تعداد (۵ تا ۱۰۰) و حالت |
| `/practice` | تمرین | guard: فقط وقتی تمرین فعال وجود دارد |
| `/result` | نتیجه | guard: فقط بعد از تمام شدن و ارزیابی |
| `/lessons` | فهرست درس‌ها | تب الگوریتم‌ها و الگوهای طراحی، فیلتر سطح |
| `/lessons/:id` | درس | پارامتر `id` با `withComponentInputBinding` مستقیم به `input()` می‌رسد |
| `/history` | پیشرفت من | آمار و تاریخچه |
| `**` | — | بازگشت به صفحهٔ اصلی |

guardها تابعی (`CanActivateFn`) هستند و فقط وضعیت `PracticeSessionStore` را می‌خوانند: اگر کاربر مستقیم `/practice` را باز کند و تمرینی نداشته باشد، به `/` هدایت می‌شود.

## ۵. لایهٔ core

### ۵.۱ مدل‌ها و ApiClient

`models.ts` آیینهٔ قرارداد JSON بک‌اند است (camelCase و enumها به‌صورت رشته). سؤال‌ها بدون جواب می‌آیند و جواب فقط بعد از پاسخ‌دادن از API گرفته می‌شود، پس جواب در payload اولیه نیست. `ApiClient` تنها جایی است که `HttpClient` را می‌شناسد و آدرس پایه از توکن `API_BASE_URL` (پیش‌فرض `/api`) می‌آید. دو دسته متد دارد:

- **خواندن به‌صورت resource:** `technologiesResource()`، `lessonsResource()` و `lessonResource(id, technology)` یک `httpResource` برمی‌گردانند. صفحه‌ها آن را در field initializer می‌سازند و فقط `value()`، `isLoading()`، `error()` و `reload()` را می‌بینند؛ هیچ صفحه‌ای URL نمی‌سازد. `lessonResource` دو تابع (برای `id` و زبان) می‌گیرد و با تغییر هرکدام خودش دوباره درخواست می‌زند.
- **نوشتن و بقیه به‌صورت Observable:** ارزیابی پاسخ، ساخت تمرین و گزارش، که در stateها با `firstValueFrom` مصرف می‌شوند.

`apiErrorInterceptor` (فایل `api-error.ts`) هر خطای HTTP را به `ApiError` با پیام فارسی تبدیل می‌کند: ۰ (شبکه)، ۴۰۰ (متن ProblemDetails سرور)، ۴۰۴، ۴۲۹ و ۵xx. بنابراین storeها و صفحه‌ها هیچ‌وقت `HttpErrorResponse` خام نمی‌بینند.

### ۵.۲ PracticeSessionStore

قلب بخش تمرین است و کل state را با signal نگه می‌دارد: `session`، `answers`، `revealed`، `correctness`، `notes`، `index`، `startedAt`، `phase`، `evaluation`، `busy` و `error`. فاز تمرین یکی از مقدارهای زیر است:

```text
idle -> practicing -> (self-assessment) -> submitting -> finished
               ^                                       |
               +------ evaluation failed ---------------+
```

- حالت یادگیری: با انتخاب هر گزینه، پاسخ فوراً به API (`check`) فرستاده می‌شود و درست/غلط و توضیح نشان داده می‌شود؛ پاسخ قفل می‌شود.
- حالت مصاحبه: پاسخ‌ها فقط در حافظه جمع می‌شوند و در پایان با یک درخواست (`evaluate`) ارزیابی می‌شوند. سؤال‌های تشریحی که کاربر خودارزیابی نکرده، قبل از ارسال وارد فاز `self-assessment` می‌شوند.
- حالت فلش‌کارت: جواب نمایش داده می‌شود و کاربر خودش «بلد بودم / بلد نبودم» می‌زند.
- سؤال بی‌جواب در انتها غلط حساب می‌شود (`completeAnswers`).
- تمرین نیمه‌کاره در `sessionStorage` ذخیره می‌شود و با refresh از همان سؤال ادامه پیدا می‌کند (با `effect`).
- اگر ارزیابی با خطا روبه‌رو شود، فاز به `practicing` برمی‌گردد تا کاربر دوباره تلاش کند.

تابع `answerFromSelfAssessment` نتیجهٔ خودارزیابی را به پاسخی تبدیل می‌کند که API بفهمد: برای سؤال تشریحی `knewIt` و برای سؤال گزینه‌ای، گزینهٔ درست (اگر کاربر بلد بوده) یا یک گزینهٔ غلط.

### ۵.۳ ProgressStore و دیگر سرویس‌ها

| سرویس | کلید storage | کار |
|---|---|---|
| ProgressStore | `interviewpal.history.v1` و `interviewpal.question-stats.v1` | حداکثر ۱۰۰ تمرین اخیر؛ آمار هر سؤال؛ میانگین، streak و سؤال‌های ضعیف (computed) |
| PracticeSessionStore | `interviewpal.active-session.v1` (sessionStorage) | تمرین در حال انجام |
| LessonProgress | `interviewpal.lesson-progress.v2` | پاسخ آخر هر تمرین درس؛ درس وقتی کامل است که همهٔ تمرین‌ها پاسخ داده و آخرین پاسخ‌ها درست باشند |
| PreferredTechnology | `interviewpal.technology.v1` | زبان انتخابی؛ مقدار نامعتبر به `javascript` برمی‌گردد |

نسخه (`.v1`، `.v2`) در نام کلیدها گذاشته شده تا اگر ساختار داده عوض شد، داده‌های قدیمی بی‌صدا نادیده گرفته شوند و برنامه نشکند.

## ۶. صفحه‌ها

### ۶.۱ شروع تمرین (setup)

فهرست تکنولوژی‌ها با `httpResource` از `/technologies` می‌آید و حالت‌های loading و خطا (با دکمهٔ «تلاش دوباره») دارد. انتخاب تکنولوژی و سطح چندگانه است و خالی بودن یعنی «همه». تعداد سؤال با اسلایدر ۵ تا ۱۰۰ و زمان تقریبی (حدود ۸۰ ثانیه برای هر سؤال) نشان داده می‌شود.

### ۶.۲ تمرین (practice)

- نوار پیشرفت و شمارندهٔ «سؤال n از N»؛ دکمه‌های قبلی/بعدی و «پایان تمرین» در سؤال آخر.
- در حالت مصاحبه تایمر معکوس از `timeLimitSeconds` نشان داده می‌شود؛ زیر یک دقیقه قرمز می‌شود و با صفر شدن، تمرین خودکار ارسال می‌شود.
- گزینه‌ها بعد از پاسخ به رنگ درست (سبز) و غلط (قرمز) درمی‌آیند و پاسخ کامل (جواب کوتاه، توضیح، اشتباه رایج و سؤال بعدی مصاحبه‌کننده) نمایش داده می‌شود.
- گزارش مشکل یک سؤال (`report-dialog`) بعد از دیدن جواب در دسترس است.

### ۶.۳ نتیجه (result)

درصد و تعداد پاسخ درست، نمودار میله‌ای به تفکیک تکنولوژی و سطح، موضوع‌های ضعیف (tag) و مرور همهٔ سؤال‌ها با توضیح. دکمهٔ «تمرین دوباره با سؤال‌های ضعیف» با `startFromQuestions` یک تمرین یادگیری از همان سؤال‌ها می‌سازد.

### ۶.۴ پیشرفت من (history)

تعداد تمرین، میانگین نمره، روزهای پشت‌سرهم، دقت هر تکنولوژی، فهرست سؤال‌های ضعیف و ۱۵ تمرین آخر. دکمهٔ پاک‌کردن سابقه بعد از تأیید کاربر همهٔ داده‌ها را حذف می‌کند.

### ۶.۵ درس‌ها (lessons)

- فهرست: انتخاب زبان در بالای صفحه، دو تب (الگوریتم‌ها / الگوهای طراحی)، فیلتر سطح، گروه‌بندی بر اساس دسته و نشان «✓ کامل» روی درس‌های تمام‌شده.
- جست‌وجو: یک Signal Form با `debounce` ۲۵۰ میلی‌ثانیه؛ در عنوان، خلاصه و تگ‌ها می‌گردد و حروف عربی و فارسی («ك»/«ک» و «ي»/«ی») را یکی می‌گیرد.
- صفحهٔ درس: مثال واقعی، توضیح، پیچیدگی (برای الگوریتم‌ها)، کد به زبان انتخابی با دکمهٔ کپی، شرح کد، «کِی استفاده کنم / کِی نه»، اشتباه رایج و ۴ تمرین.
- عوض کردن زبان در وسط درس، درس را با `technology` جدید دوباره از API می‌گیرد؛ چون `httpResource` به signal زبان وابسته است.
- بخش تمرین‌ها داخل `@defer (on viewport)` است: کد آن (کامپوننت `LessonExerciseView`) در یک chunk جدا بارگذاری می‌شود و فقط وقتی کاربر به پایین صفحه برسد.
- هر تمرین جدا با API بررسی می‌شود (جواب درست در payload درس نیست) و نتیجه در `LessonProgress` ثبت می‌شود.

## ۷. کامپوننت‌های مشترک

| کامپوننت | کار |
|---|---|
| markdown.ts و MarkdownPipe | تبدیل Markdown به HTML، رنگ‌آمیزی کد با `highlight.js` (فقط زبان‌های لازم ثبت شده‌اند: JavaScript، TypeScript، HTML، C#، JSON، bash، CSS)، پاک‌سازی با `DOMPurify` و فقط بعد از آن `bypassSecurityTrustHtml` |
| QuestionView | متن سؤال، سطح (رنگی)، تگ‌ها و قطعهٔ کد (همیشه `dir="ltr"`) |
| AnswerPanel | جواب کوتاه، توضیح کامل، اشتباه رایج و سؤال بعدی |
| ReportDialog | گزارش جواب غلط، قدیمی، مبهم یا غلط نگارشی؛ با Signal Form، `required`، `maxLength(500)` و `<form [formRoot]>` |
| CodeBlock | نمایش کد با زبان و دکمهٔ «کپی کد» (clipboard)؛ خروجی `highlight.js` خودش کد را escape می‌کند |

> **امنیت**
>
> همهٔ متن‌های Markdown (سؤال، توضیح، درس) قبل از رسیدن به DOM با DOMPurify پاک‌سازی می‌شوند. اسکریپت و `onerror` حذف می‌شود و این رفتار تست واحد دارد. هیچ `innerHTML` دیگری بدون این مسیر استفاده نشده است.

## ۸. ویژگی‌های Angular 22 که در پروژه استفاده شده

| ویژگی | کجا | چرا |
|---|---|---|
| Zoneless (پیش‌فرض) | `bootstrapApplication` بدون zone.js | رندر فقط با تغییر signal؛ بدون patch کردن APIهای مرورگر |
| `OnPush` پیش‌فرض | همهٔ کامپوننت‌ها (بدون تنظیم صریح) | در Angular 22 پیش‌فرض است؛ همهٔ state با signal است، پس سازگار است |
| `httpResource` (پایدار از 22.0) | `ApiClient.technologiesResource()`، `lessonsResource()`، `lessonResource()` | خواندن reactive: با تغییر `id` یا زبان خودش دوباره درخواست می‌زند و `isLoading`/`error`/`reload` می‌دهد؛ `defaultValue: []` الگوی `?? []` را از قالب‌ها حذف کرد |
| Signal Forms (پایدار از 22.0) | `ReportDialog` و جست‌وجوی `LessonsPage` | `form()`، `[formField]`، `<form [formRoot]>` با `submission`، `required`، `maxLength` و `debounce`؛ مدل فرم یک `signal` ساده است |
| `linkedSignal` | `LessonExerciseView` | state قابل‌نوشتن که با عوض شدن `exercise` ورودی خودش بازنشانی می‌شود |
| `@defer (on viewport)` | تمرین‌های `LessonPage` | کد تمرین‌ها در یک chunk جدا و فقط با رسیدن به پایین صفحه بارگذاری می‌شود |
| `@let` | `LessonPage` | متغیر محلی در قالب، به‌جای تکرار `technology.slug()` |
| کنترل‌فلو جدید | همهٔ قالب‌ها | `@if`، `@for` با `track`، `@empty` |
| `input()` / `input.required()` | کامپوننت‌ها و `LessonPage` | ورودی‌های signal؛ با `withComponentInputBinding` پارامتر `:id` مسیر مستقیم به `input` می‌رسد |
| `computed` و `effect` | storeها و صفحه‌ها | مشتق‌های خالص با `computed`؛ `effect` فقط برای هماهنگ‌سازی با `sessionStorage` و تایمر |
| Functional interceptor | `apiErrorInterceptor` با `withInterceptors` | تبدیل خطاها به `ApiError` در یک نقطه |
| Router | `withViewTransitions`، `withInMemoryScrolling`، guardهای تابعی، `loadComponent` | انتقال انیمیشنی بین صفحه‌ها، برگرداندن اسکرول و bundle اولیهٔ کوچک |
| `inject()` | همه‌جا | بدون constructor injection؛ کار با field initializer و تابع‌های کمکی ساده می‌شود |
| Vitest با `ng test` | همهٔ تست‌ها | builder `@angular/build:unit-test`؛ بدون Karma و Jasmine |

بعضی از این‌ها، مثل `httpResource` و Signal Forms، در نسخه‌های قبلی آزمایشی بودند. در Angular 22 هر دو در تایپ‌های خود فریم‌ورک با `@publicApi 22.0` (یعنی API عمومی و پایدار) علامت خورده‌اند.

## ۹. استایل، RTL و دسترس‌پذیری

- متغیرهای CSS در `:root` و تم تیره با `prefers-color-scheme`؛ رنگ اصلی بنفش (`#4F46E5`) و رنگ‌های جدا برای موفقیت، خطا و هشدار.
- خصوصیت‌های منطقی (`margin-inline`، `inline-size`، `inset-block-start`) به‌جای `left/right` تا جهت RTL خودکار درست شود.
- کد و عبارت‌های انگلیسی `dir="ltr"` و `unicode-bidi: plaintext` دارند تا در متن فارسی به‌هم نریزند.
- دکمه‌های انتخابی `aria-pressed`، تب‌ها `role="tab"` و `aria-selected`، تایمر `role="timer"`، خطاها `role="alert"` و نوار پیشرفت `role="progressbar"` دارند. focus قابل‌مشاهده است.
- `prefers-reduced-motion` انیمیشن‌ها را خاموش می‌کند و طرح روی عرض موبایل بدون اسکرول افقی کار می‌کند.

## ۱۰. قرارداد API

| متد | مسیر | استفاده |
|---|---|---|
| GET | `/api/technologies` | فهرست تکنولوژی‌ها و تعداد سؤال هر سطح |
| POST | `/api/practice/sessions` | ساخت تمرین (تکنولوژی‌ها، سطح‌ها، تعداد، حالت) |
| POST | `/api/practice/questions/{id}/check` | ارزیابی یک پاسخ (یادگیری) |
| POST | `/api/practice/evaluate` | ارزیابی کل تمرین (مصاحبه) |
| GET | `/api/questions/{id}` | یک سؤال با جواب (برای تمرین دوباره و فلش‌کارت) |
| POST | `/api/questions/{id}/reports` | گزارش مشکل سؤال |
| GET | `/api/lessons?kind=` | فهرست درس‌ها |
| GET | `/api/lessons/{id}?technology=` | درس با کد زبان انتخابی |
| POST | `/api/lessons/{id}/exercises/{exerciseId}/check` | بررسی یک تمرین درس |

خطاها به‌صورت ProblemDetails می‌آیند. `PracticeSessionStore` پیام فارسی عمومی نشان می‌دهد و صفحه‌ها برای خطای بارگذاری دکمهٔ «تلاش دوباره» دارند.

## ۱۱. تست

۴۳ تست واحد با Vitest (`npm test`):

- ApiClient: مسیر و بدنهٔ هر درخواست با `HttpTestingController`.
- PracticeSessionStore: شروع تمرین، ارزیابی فوری در یادگیری، نبودن درخواست در مصاحبه، فاز خودارزیابی، ارسال نهایی، بازگشت بعد از خطا و تمرین خالی.
- ProgressStore، LessonProgress و PreferredTechnology: ثبت، ماندگاری، پاک‌کردن، streak و مقدار نامعتبر storage.
- `apiErrorInterceptor`: تبدیل خطاهای HTTP به `ApiError` با پیام فارسی.
- `ReportDialog` (Signal Form): ارسال دلیل و پیام و جلوگیری از ارسال پیام بیش از ۵۰۰ کاراکتر.
- `LessonExerciseView`: بازنشانی پاسخ قبلی با `linkedSignal` وقتی تمرین عوض می‌شود.
- markdown: رنگ‌آمیزی، حذف اسکریپت و `onerror`، escape زبان‌های ناشناخته.
- SetupPage، LessonsPage و LessonPage: لیست، فیلتر، جست‌وجوی debounce‌شده با حروف عربی/فارسی، انتخاب زبان، گرفتن درس با زبان جدید و بررسی تمرین. بلوک `@defer` در تست با `DeferBlockBehavior.Manual` دستی رندر می‌شود، چون jsdom از `IntersectionObserver` پشتیبانی نمی‌کند.

علاوه بر آن، کل جریان یادگیری یک بار در مرورگر واقعی (Chromium) روی بک‌اند واقعی اجرا و بدون خطای کنسول تأیید شده است.

## ۱۲. اجرا و استقرار

### ۱۲.۱ توسعه

```text
npm install
npm start      # http://localhost:4200  (/api به http://localhost:5161 پراکسی می‌شود)
npm test
npm run build  # خروجی: dist/interviewpal/browser
```

Angular CLI 22 به Node نسخهٔ ۲۲٫۲۲ یا بالاتر نیاز دارد (Node 24 پیشنهاد می‌شود). بک‌اند باید روی `http://localhost:5161` در حال اجرا باشد (`proxy.conf.json`).

### ۱۲.۲ Docker

`Dockerfile` دو مرحله دارد: build با Node 24 و سرو با nginx. `nginx.conf.template` مسیرهای Angular را به `index.html` برمی‌گرداند، فایل‌های hash‌دار را یک سال کش می‌کند، `index.html` را کش نمی‌کند و `/api` را به `API_URL` پراکسی می‌کند. `compose.yaml` بک‌اند و فرانت را کنار هم روی `http://localhost:8080` بالا می‌آورد.

### ۱۲.۳ Vercel و Render

- فرانت‌اند روی Vercel: preset Angular، دستور `npm run build`، خروجی `dist/interviewpal/browser` و Node 24.x.
- `vercel.json` مسیر `/api/*` را به `https://interviewpal-backend.onrender.com` می‌فرستد و بقیهٔ مسیرها را به `index.html`؛ بنابراین مرورگر فقط یک origin می‌بیند و CORS لازم نیست.
- بک‌اند روی Render با Docker اجرا می‌شود. در پلن رایگان پس از ۱۵ دقیقه بی‌کاری می‌خوابد و اولین درخواست بعدی حدود نیم دقیقه طول می‌کشد.

### ۱۲.۴ مستندات

این سند در `docs/frontend.md` نوشته می‌شود و `docs/InterviewPal-Frontend.pdf` از روی آن ساخته می‌شود. با هر تغییر مهم، README، همین سند و PDF با هم به‌روز می‌شوند.

## ۱۳. محدودیت‌ها و گام‌های بعدی

| موضوع | وضعیت فعلی | گام بعدی |
|---|---|---|
| حساب کاربری | ندارد؛ پیشرفت فقط در همان مرورگر | ورود، ذخیرهٔ تاریخچه روی سرور و همگام‌سازی چند دستگاه |
| حالت مصاحبهٔ زمان‌دار | تایمر ساده سمت کلاینت | محاسبهٔ زمان در سرور برای جلوگیری از دستکاری |
| مرور فاصله‌دار | فقط فهرست سؤال‌های ضعیف | زمان‌بندی مرور بر اساس منحنی فراموشی |
| پنل ادمین | محتوا با فایل JSON ویرایش می‌شود | پنل مدیریت سؤال و درس و بررسی گزارش‌ها |
| مصاحبه‌کنندهٔ هوشمند | ندارد | پاسخ متنی/صوتی و بازخورد |
| خواب بک‌اند رایگان | تأخیر اولین درخواست | پلن بدون خواب یا پینگ دوره‌ای |

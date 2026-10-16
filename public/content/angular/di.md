DI (تزریق وابستگی) در Angular **سلسله‌مراتبی** است: درخواست `inject(X)` از injector کامپوننت بالا می‌رود تا اولین provider را پیدا کند (element → route → root → platform).

## مثال

```typescript
import { ApplicationConfig, Component, Injectable, InjectionToken, inject } from '@angular/core';

// ۱) سرویس singleton: providedIn: 'root' (tree-shakable)
@Injectable({ providedIn: 'root' })
export class Logger {
  log(msg: string) { console.log(msg); }
}

// ۲) توکن برای مقدار/تنظیمات (نه کلاس)
export const API_URL = new InjectionToken<string>('API_URL', {
  providedIn: 'root',
  factory: () => '/api',
});

// ۳) abstraction با چند پیاده‌سازی
export abstract class KeyValueStore { abstract get(k: string): string | null }
@Injectable() class LocalStore extends KeyValueStore { get(k: string) { return localStorage.getItem(k); } }
@Injectable() class MemoryStore extends KeyValueStore { get() { return null; } }

export const appConfig: ApplicationConfig = {
  providers: [
    { provide: KeyValueStore, useClass: LocalStore },
    { provide: API_URL, useValue: 'https://api.example.com' },
  ],
};

// ۴) نمونهٔ جدا برای هر کامپوننت (و فرزندانش)
@Component({
  selector: 'app-editor',
  template: '',
  providers: [{ provide: KeyValueStore, useClass: MemoryStore }],
})
export class Editor {
  private readonly store = inject(KeyValueStore);
  private readonly logger = inject(Logger);
}
```

## نکته‌های سنیور

- `inject()` را فقط در **injection context** صدا بزن (field initializer، constructor، factory)؛ بیرونش `runInInjectionContext` یا `Injector` لازم است.
- `providers` در route (`{ path, providers: [...] }`) سرویسی می‌سازد که عمرش به همان feature محدود است و با خروج از آن نابود می‌شود.
- `useFactory` + `inject` برای ساخت وابستگی بر اساس محیط؛ `multi: true` برای ثبت چند مقدار (مثل interceptorهای قدیمی، validatorها).
- Modifierها: `optional`، `self`، `skipSelf`، `host`.
- به‌جای `new Service()` در تست، provider را override کن (درس تست).

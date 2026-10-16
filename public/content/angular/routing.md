Router مدرن همه‌چیز را **تابعی** و lazy می‌کند: guard، resolver و حتی provider در سطح route.

## مثال

```typescript
import { inject } from '@angular/core';
import {
  CanActivateFn, PreloadAllModules, ResolveFn, Router, Routes,
  provideRouter, withComponentInputBinding, withPreloading,
} from '@angular/router';
import { AuthService } from './auth.service';
import { Order, OrderService } from './order.service';

export const authGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  // UrlTree: ناوبری اتمیک و بدون ردی در history
  return auth.isLoggedIn() || router.createUrlTree(['/login'], { queryParams: { redirect: state.url } });
};

const orderResolver: ResolveFn<Order> = (route) => inject(OrderService).get(route.paramMap.get('id')!);

export const routes: Routes = [
  {
    path: 'orders',
    canActivate: [authGuard],
    providers: [OrderService], // فقط برای همین feature ساخته می‌شود
    loadComponent: () => import('./orders').then((m) => m.Orders),
    children: [
      {
        path: ':id',
        resolve: { order: orderResolver },
        loadComponent: () => import('./order-detail').then((m) => m.OrderDetail),
      },
    ],
  },
];

export const routerProviders = [
  provideRouter(routes, withComponentInputBinding(), withPreloading(PreloadAllModules)),
];
```

داخل `OrderDetail` پارامتر و نتیجهٔ resolver مستقیم ورودی هستند:

```typescript
import { Component, input } from '@angular/core';
import { Order } from './order.service';

@Component({ selector: 'app-order-detail', template: '{{ order().id }}' })
export class OrderDetail {
  readonly id = input.required<string>();   // پارامتر :id
  readonly order = input.required<Order>();  // نتیجهٔ resolve
}
```

## نکته‌های سنیور

- Guardِ برگرداندن `UrlTree` بهتر از `router.navigate` + `false` است (ناوبری اتمیک، بدون ماندن در history).
- `canMatch` از لود کردن chunk جلوگیری می‌کند؛ `canActivate` بعد از لود اجرا می‌شود. برای مسیرهای نقش‌محور `canMatch`.
- `canDeactivate` برای فرم تغییرکرده و `resolve` برای داده‌ای که صفحه بدون آن معنا ندارد؛ بقیه را در خود صفحه با `httpResource` بگیر (UI سریع‌تر).
- `withPreloading` یا یک `PreloadingStrategy` سفارشی بعد از بالا آمدن اپ chunkها را دانلود می‌کند.
- `withViewTransitions()` انیمیشن ناوبری را با View Transitions API می‌دهد.

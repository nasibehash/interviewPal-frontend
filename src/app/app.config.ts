import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import {
  provideRouter,
  withComponentInputBinding,
  withInMemoryScrolling,
  withViewTransitions,
} from '@angular/router';
import { apiErrorInterceptor } from './core/api-error';
import { AuthStore } from './core/auth-store';
import { authInterceptor } from './core/auth-interceptor';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // Restores a login in the background: the app renders at once and does not wait for the server to answer
    provideAppInitializer(() => {
      void inject(AuthStore).restore();
    }),
    provideHttpClient(withFetch(), withInterceptors([apiErrorInterceptor, authInterceptor])),
    provideRouter(
      routes,
      withComponentInputBinding(), // :id from the URL goes straight to input()
      withViewTransitions(), // animated page changes through the browser's View Transitions API
      withInMemoryScrolling({ scrollPositionRestoration: 'enabled' }),
    ),
  ],
};

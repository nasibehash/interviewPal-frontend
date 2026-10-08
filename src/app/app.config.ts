import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import {
  provideRouter,
  withComponentInputBinding,
  withInMemoryScrolling,
  withViewTransitions,
} from '@angular/router';
import { apiErrorInterceptor } from './core/api-error';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideHttpClient(withFetch(), withInterceptors([apiErrorInterceptor])),
    provideRouter(
      routes,
      withComponentInputBinding(), // :id from the URL goes straight to input()
      withViewTransitions(), // animated page changes through the browser's View Transitions API
      withInMemoryScrolling({ scrollPositionRestoration: 'enabled' }),
    ),
  ],
};

import { Component, effect, inject, untracked } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthStore } from './core/auth-store';
import { ProgressStore } from './core/progress-store';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly auth = inject(AuthStore);

  // Created here so it is alive at every login: it imports the browser's progress into the account and loads it
  private readonly progress = inject(ProgressStore);

  private readonly router = inject(Router);
  private wasLoggedIn = false;

  constructor() {
    // The session ended (logout, expired refresh token, deleted account): the app has nothing to show a guest
    effect(() => {
      const loggedIn = this.auth.isLoggedIn();
      untracked(() => {
        if (this.wasLoggedIn && !loggedIn) {
          const url = this.router.url;
          const onAuthPage = url.startsWith('/login') || url.startsWith('/register');
          void this.router.navigate(['/login'], {
            queryParams:
              onAuthPage || url === '/' || url.startsWith('/account')
                ? undefined
                : { redirect: url },
          });
        }
        this.wasLoggedIn = loggedIn;
      });
    });
  }
}

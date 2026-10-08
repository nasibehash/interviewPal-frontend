import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
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
}

import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ApiClient } from './api-client';
import { ApiError } from './api-error';
import { AuthResponse, User } from './models';
import { readJson, removeKey, writeJson } from './safe-storage';

/** Refresh this long before the access token expires, so a request never goes out with a token about to die. */
const REFRESH_MARGIN_MS = 30_000;
const HINT_KEY = 'interviewpal.session-hint.v1';

export type AuthStatus = 'unknown' | 'anonymous' | 'authenticated';

/**
 * Who is using the app. The access token lives in memory only (a script cannot find it in storage); the refresh
 * token is an httpOnly cookie the browser keeps. Reloading the page restores the login through /auth/refresh.
 */
@Injectable({ providedIn: 'root' })
export class AuthStore {
  private readonly api = inject(ApiClient);

  private readonly _user = signal<User | null>(null);
  private readonly _status = signal<AuthStatus>('unknown');
  private accessToken: string | null = null;
  private expiresAt = 0;
  private refreshing: Promise<boolean> | null = null;

  readonly user = this._user.asReadonly();
  readonly status = this._status.asReadonly();
  readonly isLoggedIn = computed(() => this._status() === 'authenticated');

  /** Settles once the first answer of /auth/refresh is in (guards wait for it). */
  readonly ready: Promise<void>;
  private resolveReady!: () => void;

  constructor() {
    this.ready = new Promise<void>((resolve) => (this.resolveReady = resolve));
  }

  /**
   * Called once at startup. Without the hint (the learner never logged in on this browser) there is nothing to
   * restore and no request is made, so anonymous visitors never wake the server just for this.
   */
  async restore(): Promise<void> {
    if (readJson<string | null>(() => localStorage, HINT_KEY, null) !== '1') {
      this._status.set('anonymous');
    } else {
      await this.refresh();
      // the server could not be reached: show the visitor as logged out, but keep the hint for the next visit
      if (this._status() === 'unknown') this._status.set('anonymous');
    }
    this.resolveReady();
  }

  async register(email: string, password: string, displayName: string): Promise<void> {
    this.apply(await firstValueFrom(this.api.register(email, password, displayName)));
  }

  async login(email: string, password: string): Promise<void> {
    this.apply(await firstValueFrom(this.api.login(email, password)));
  }

  async logout(): Promise<void> {
    try {
      await firstValueFrom(this.api.logout());
    } catch {
      // the server could not be reached: the local session ends anyway
    }
    this.clear();
  }

  /** After a password change the server ended every session: this browser is logged out too. */
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await firstValueFrom(this.api.changePassword(currentPassword, newPassword));
    this.clear();
  }

  async deleteAccount(password: string): Promise<void> {
    await firstValueFrom(this.api.deleteAccount(password));
    this.clear();
  }

  /** The token for an outgoing request, refreshed first when it is about to expire. Null when logged out. */
  async validToken(): Promise<string | null> {
    if (!this.accessToken) return null;
    if (Date.now() >= this.expiresAt - REFRESH_MARGIN_MS && !(await this.refresh())) return null;
    return this.accessToken;
  }

  /** The server says the session is gone (revoked, deleted account): forget it locally. */
  sessionLost(): void {
    this.clear();
  }

  /** One refresh at a time: requests that need a new token at the same moment share the same call. */
  private refresh(): Promise<boolean> {
    this.refreshing ??= firstValueFrom(this.api.refresh())
      .then((response) => {
        this.apply(response);
        return true;
      })
      .catch((error: unknown) => {
        // Only the server refusing the token ends the session; a network or server error is temporary
        if (error instanceof ApiError && error.status >= 400 && error.status < 500) this.clear();
        return false;
      })
      .finally(() => (this.refreshing = null));
    return this.refreshing;
  }

  private apply(response: AuthResponse): void {
    this.accessToken = response.accessToken;
    this.expiresAt = Date.parse(response.expiresAt);
    this._user.set(response.user);
    this._status.set('authenticated');
    writeJson(() => localStorage, HINT_KEY, '1');
  }

  private clear(): void {
    this.accessToken = null;
    this.expiresAt = 0;
    this._user.set(null);
    this._status.set('anonymous');
    removeKey(() => localStorage, HINT_KEY);
  }
}

import { inject } from '@angular/core';
import { CanActivateFn, Router, Routes } from '@angular/router';
import { PracticeSessionStore } from './core/practice-session';

const hasActiveSession: CanActivateFn = () => {
  const store = inject(PracticeSessionStore);
  return store.phase() === 'idle' || store.phase() === 'finished'
    ? inject(Router).createUrlTree(['/'])
    : true;
};

const hasFinishedSession: CanActivateFn = () =>
  inject(PracticeSessionStore).phase() === 'finished' ? true : inject(Router).createUrlTree(['/']);

export const routes: Routes = [
  {
    path: '',
    title: 'شروع تمرین',
    loadComponent: () => import('./features/setup/setup-page').then((m) => m.SetupPage),
  },
  {
    path: 'practice',
    title: 'تمرین',
    canActivate: [hasActiveSession],
    loadComponent: () => import('./features/practice/practice-page').then((m) => m.PracticePage),
  },
  {
    path: 'result',
    title: 'نتیجه',
    canActivate: [hasFinishedSession],
    loadComponent: () => import('./features/result/result-page').then((m) => m.ResultPage),
  },
  {
    path: 'history',
    title: 'پیشرفت من',
    loadComponent: () => import('./features/history/history-page').then((m) => m.HistoryPage),
  },
  { path: '**', redirectTo: '' },
];

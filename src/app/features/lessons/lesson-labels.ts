import { LessonKind } from '../../core/models';

export const KIND_LABELS: Readonly<Record<LessonKind, string>> = {
  Algorithm: 'الگوریتم‌ها',
  DesignPattern: 'الگوهای طراحی',
};

export const CATEGORY_LABELS: Readonly<Record<string, string>> = {
  searching: 'جست‌وجو',
  arrays: 'آرایه‌ها',
  hashing: 'جدول هش',
  sorting: 'مرتب‌سازی',
  graphs: 'گراف',
  'dynamic-programming': 'برنامه‌ریزی پویا',
  recursion: 'بازگشت',
  heaps: 'صف اولویت',
  strings: 'رشته‌ها',
  caching: 'کش',
  creational: 'ساختنی (Creational)',
  structural: 'ساختاری (Structural)',
  behavioral: 'رفتاری (Behavioral)',
};

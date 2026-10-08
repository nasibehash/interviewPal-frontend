import { ApiError } from '../../core/api-error';

const status = (error: unknown): number | null => (error instanceof ApiError ? error.status : null);

/** What to tell the learner when logging in failed. */
export function loginMessage(error: unknown): string {
  switch (status(error)) {
    case 401:
      return 'ایمیل یا رمز عبور درست نیست.';
    case 429:
      return 'چند بار رمز اشتباه وارد شد. حدود ۱۵ دقیقه بعد دوباره امتحان کن.';
    default:
      return error instanceof ApiError ? error.message : 'ورود انجام نشد. دوباره تلاش کن.';
  }
}

export function registerMessage(error: unknown): string {
  switch (status(error)) {
    case 409:
      return 'با این ایمیل قبلاً ثبت‌نام شده است. وارد شو.';
    case 400:
      return 'اطلاعات واردشده معتبر نیست.';
    case 429:
      return 'درخواست‌ها زیاد است؛ کمی صبر کن و دوباره امتحان کن.';
    default:
      return error instanceof ApiError ? error.message : 'ثبت‌نام انجام نشد. دوباره تلاش کن.';
  }
}

/** A path inside the app, from ?redirect=. Anything that could lead to another site is replaced by "/". */
export function safeRedirect(target: string | undefined): string {
  return target && target.startsWith('/') && !target.startsWith('//') && !target.includes('\\') ? target : '/';
}

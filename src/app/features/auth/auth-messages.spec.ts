import { describe, expect, it } from 'vitest';
import { ApiError } from '../../core/api-error';
import { loginMessage, registerMessage, safeRedirect } from './auth-messages';

describe('auth messages', () => {
  it('explains a failed login without saying which part was wrong', () => {
    expect(loginMessage(new ApiError('x', 401))).toBe('ایمیل یا رمز عبور درست نیست.');
    expect(loginMessage(new ApiError('x', 429))).toContain('۱۵ دقیقه');
  });

  it('explains a failed registration', () => {
    expect(registerMessage(new ApiError('x', 409))).toContain('قبلاً ثبت‌نام');
    expect(registerMessage(new ApiError('x', 400))).toContain('معتبر نیست');
  });

  it('only redirects inside the app', () => {
    expect(safeRedirect('/account')).toBe('/account');
    expect(safeRedirect('/lessons/binary-search?x=1')).toBe('/lessons/binary-search?x=1');
    expect(safeRedirect(undefined)).toBe('/');
    expect(safeRedirect('https://evil.example')).toBe('/');
    expect(safeRedirect('//evil.example')).toBe('/');
    expect(safeRedirect('/\\evil.example')).toBe('/');
  });
});

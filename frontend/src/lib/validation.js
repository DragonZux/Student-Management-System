import { showPopup } from '@/lib/popup';

export function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim());
}

export function hasMinLength(value, minLength) {
  return String(value || '').length >= Number(minLength || 0);
}

export function isInRange(value, min, max) {
  const number = Number(value);
  return Number.isFinite(number) && number >= min && number <= max;
}

export function isPositiveInteger(value, min = 1) {
  const number = Number(value);
  return Number.isInteger(number) && number >= min;
}

export function matchesPattern(value, pattern) {
  if (!pattern) return true;
  return pattern.test(String(value || ''));
}

export function toNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

export function popupValidationError(setError, message) {
  if (typeof setError === 'function') setError(message);
  showPopup(message, { type: 'error' });
  return false;
}

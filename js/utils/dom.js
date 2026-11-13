/**
 * DOM Utility Module
 * Lightweight helper functions for DOM manipulation
 */

export const $ = (selector, context = document) => context.querySelector(selector);
export const $$ = (selector, context = document) => Array.from(context.querySelectorAll(selector));

/**
 * Attaches an event listener to an element with automatic null safety
 */
export function on(element, event, handler, options = false) {
  if (element) {
    element.addEventListener(event, handler, options);
  }
}

/**
 * Toggles a CSS class safely
 */
export function toggleClass(element, className, force) {
  if (element) {
    return element.classList.toggle(className, force);
  }
  return false;
}

/**
 * Escapes HTML entities to prevent XSS
 */
export function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Formats a Date object or ISO string into a human-readable string
 * e.g., 'Today, Nov 12' or 'Nov 14'
 */
export function formatDisplayDate(dateInput) {
  if (!dateInput) return '';
  const date = new Date(dateInput + 'T00:00:00');
  if (isNaN(date.getTime())) return dateInput;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const timeVal = date.getTime();
  if (timeVal === today.getTime()) {
    return 'Today';
  } else if (timeVal === tomorrow.getTime()) {
    return 'Tomorrow';
  } else if (timeVal === yesterday.getTime()) {
    return 'Yesterday';
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric'
  }).format(date);
}

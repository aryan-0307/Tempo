/**
 * DOM Utility Module
 * Lightweight helper functions for DOM manipulation
 */

export const $ = (selector, context = document) => context.querySelector(selector);
export const $$ = (selector, context = document) => Array.from(context.querySelectorAll(selector));

/**
 * Attaches an event listener to an element with automatic null safety
 */
export function on(element, event, handler) {
  if (element) {
    element.addEventListener(event, handler);
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

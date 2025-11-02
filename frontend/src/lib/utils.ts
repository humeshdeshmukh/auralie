/**
 * Combines multiple class names and handles conflicts
 */
export function cn(...classes: (string | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}

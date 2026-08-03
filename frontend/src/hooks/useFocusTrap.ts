import { useEffect, useRef } from 'react';

/**
 * Custom hook to trap keyboard focus within a container.
 * Useful for modal dialogs, drawers, and popovers to satisfy WCAG focus containment guidelines.
 */
export function useFocusTrap<T extends HTMLElement = HTMLDivElement>(isActive: boolean) {
  const containerRef = useRef<T>(null);
  const previousActiveElementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isActive) return () => {};

    // Capture the currently focused element to restore it later
    previousActiveElementRef.current = document.activeElement as HTMLElement;

    const container = containerRef.current;
    if (!container) return () => {};

    const focusableSelectors = [
      'a[href]',
      'area[href]',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      'button:not([disabled])',
      'iframe',
      'object',
      'embed',
      '[contenteditable]',
      '[tabindex]:not([tabindex="-1"])',
    ].join(',');

    // Focus the first focusable child, or the container itself if none exist
    const focusableElements = container.querySelectorAll(focusableSelectors);
    if (focusableElements.length > 0) {
      (focusableElements[0] as HTMLElement).focus();
    } else {
      // If container is not focusable, make it temporarily focusable
      if (!container.hasAttribute('tabindex')) {
        container.setAttribute('tabindex', '-1');
      }
      container.focus();
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;

      const elements = Array.from(container.querySelectorAll(focusableSelectors)) as HTMLElement[];
      if (elements.length === 0) {
        event.preventDefault();
        return;
      }

      const first = elements[0];
      const last = elements[elements.length - 1];

      if (event.shiftKey) {
        // Shift + Tab (backward navigation)
        if (document.activeElement === first) {
          last.focus();
          event.preventDefault();
        }
      } else {
        // Tab (forward navigation)
        if (document.activeElement === last) {
          first.focus();
          event.preventDefault();
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown);

    return () => {
      container.removeEventListener('keydown', handleKeyDown);
      // Restore focus to the element that was focused before the trap became active
      if (previousActiveElementRef.current) {
        previousActiveElementRef.current.focus();
      }
    };
  }, [isActive]);

  return containerRef;
}

import { useState, useEffect } from 'react';

/**
 * Debounces a search string value.
 * Use this instead of triggering API calls on every keystroke.
 */
export function useSearchDebounce(value: string, delay = 300): string {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

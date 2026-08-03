import { useState, useCallback, type KeyboardEvent } from 'react';

/**
 * Custom hook to detect if Caps Lock is enabled during keyboard events on input fields.
 */
export function useCapsLock() {
  const [isCapsLockOn, setIsCapsLockOn] = useState(false);

  const checkCapsLock = useCallback((event: KeyboardEvent<HTMLInputElement>) => {
    if (typeof event.getModifierState === 'function') {
      setIsCapsLockOn(event.getModifierState('CapsLock'));
    }
  }, []);

  const handleBlur = useCallback(() => {
    setIsCapsLockOn(false);
  }, []);

  return {
    isCapsLockOn,
    checkCapsLock,
    handleBlur,
  };
}

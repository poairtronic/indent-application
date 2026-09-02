import { useState, useCallback } from 'react';

export function useUniversalPrint() {
  const [isPrintOpen, setIsPrintOpen] = useState(false);

  const openPrint = useCallback(() => {
    setIsPrintOpen(true);
  }, []);

  const closePrint = useCallback(() => {
    setIsPrintOpen(false);
  }, []);

  const triggerDirectPrint = useCallback(() => {
    window.print();
  }, []);

  return {
    isPrintOpen,
    openPrint,
    closePrint,
    triggerDirectPrint,
  };
}

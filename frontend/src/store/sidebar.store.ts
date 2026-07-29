import { useState, useEffect } from 'react';

let isOpen = true;
const listeners = new Set<(isOpen: boolean) => void>();

const emit = () => {
  listeners.forEach((listener) => listener(isOpen));
};

export const sidebarStore = {
  get isOpen() {
    return isOpen;
  },
  toggle() {
    isOpen = !isOpen;
    emit();
  },
  setIsOpen(val: boolean) {
    isOpen = val;
    emit();
  },
  subscribe(listener: (isOpen: boolean) => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
};

export const useSidebar = () => {
  const [open, setOpenState] = useState<boolean>(isOpen);

  useEffect(() => {
    return sidebarStore.subscribe((newVal) => {
      setOpenState(newVal);
    });
  }, []);

  return {
    isOpen: open,
    toggleSidebar: () => sidebarStore.toggle(),
    setIsOpen: (val: boolean) => sidebarStore.setIsOpen(val),
  };
};

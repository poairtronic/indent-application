import React, { useRef, useId } from 'react';

interface TabItem {
  id: string;
  label: string;
}

interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({ tabs, activeTab, onChange, className = '' }) => {
  const generatedId = useId();
  const tabsId = `tabs-${generatedId}`;
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLButtonElement>) => {
    let nextIdx: number | null = null;

    if (e.key === 'ArrowRight') {
      nextIdx = (index + 1) % tabs.length;
    } else if (e.key === 'ArrowLeft') {
      nextIdx = (index - 1 + tabs.length) % tabs.length;
    } else if (e.key === 'Home') {
      nextIdx = 0;
    } else if (e.key === 'End') {
      nextIdx = tabs.length - 1;
    }

    if (nextIdx !== null) {
      e.preventDefault();
      onChange(tabs[nextIdx].id);
      // Need a small timeout to allow React to render active state and set focusability
      const targetBtn = buttonRefs.current[nextIdx];
      setTimeout(() => targetBtn?.focus(), 0);
    }
  };

  return (
    <div
      role="tablist"
      aria-label="Navigation Tabs"
      className={`border-b border-border-default flex gap-4 font-sans ${className}`}
    >
      {tabs.map((tab, idx) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            ref={(el) => {
              buttonRefs.current[idx] = el;
            }}
            role="tab"
            id={`${tabsId}-tab-${tab.id}`}
            aria-selected={isActive}
            aria-controls={`${tabsId}-panel-${tab.id}`}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onChange(tab.id)}
            onKeyDown={(e) => handleKeyDown(idx, e)}
            className={`pb-2.5 text-xs font-semibold border-b-2 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary focus-visible:ring-offset-2 rounded-t-sm ${
              isActive
                ? 'border-accent-primary text-accent-primary'
                : 'border-transparent text-text-secondary hover:text-text-primary'
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
};

import React from 'react';

interface ButtonGroupProps {
  children: React.ReactNode;
  vertical?: boolean;
  className?: string;
}

export const ButtonGroup: React.FC<ButtonGroupProps> = ({
  children,
  vertical = false,
  className = '',
}) => {
  return (
    <div
      className={`inline-flex ${
        vertical
          ? 'flex-col -space-y-px [&>button]:rounded-none [&>button:first-of-type]:rounded-t-lg [&>button:last-of-type]:rounded-b-lg'
          : '-space-x-px [&>button]:rounded-none [&>button:first-of-type]:rounded-l-lg [&>button:last-of-type]:rounded-r-lg'
      } ${className}`}
      role="group"
    >
      {children}
    </div>
  );
};

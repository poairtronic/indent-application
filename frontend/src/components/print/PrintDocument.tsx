import React from 'react';

export interface PrintDocumentProps {
  orientation?: 'portrait' | 'landscape';
  children: React.ReactNode;
  className?: string;
}

export const PrintDocument: React.FC<PrintDocumentProps> = ({
  orientation = 'portrait',
  children,
  className = '',
}) => {
  return (
    <div
      className={`merc-print-document w-full bg-white text-gray-900 ${
        orientation === 'landscape' ? 'merc-print-landscape' : 'merc-print-portrait'
      } ${className}`}
    >
      {children}
    </div>
  );
};

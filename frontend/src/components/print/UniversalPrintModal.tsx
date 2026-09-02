import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Printer, X, Eye, Compass } from 'lucide-react';
import { Button } from '../ui/Button';

export interface UniversalPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  orientation?: 'portrait' | 'landscape';
  children: React.ReactNode;
}

export const UniversalPrintModal: React.FC<UniversalPrintModalProps> = ({
  isOpen,
  onClose,
  title = 'Print Preview',
  orientation = 'portrait',
  children,
}) => {
  const [currentOrientation, setCurrentOrientation] = useState<'portrait' | 'landscape'>(
    orientation,
  );

  useEffect(() => {
    setCurrentOrientation(orientation);
  }, [orientation]);

  // Ensure portal target container exists in DOM
  useEffect(() => {
    let portalDiv = document.getElementById('universal-print-portal');
    if (!portalDiv) {
      portalDiv = document.createElement('div');
      portalDiv.id = 'universal-print-portal';
      document.body.appendChild(portalDiv);
    }
  }, []);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const portalElement =
    typeof document !== 'undefined' ? document.getElementById('universal-print-portal') : null;

  return (
    <>
      {/* 1. Interactive On-Screen Modal Preview */}
      <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 print:hidden">
        <div className="bg-surface-card border border-border-default rounded-xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
          {/* Modal Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border-default bg-surface-elevated">
            <div className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-accent-primary" />
              <h2 className="text-lg font-bold text-text-primary">{title}</h2>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setCurrentOrientation((prev) => (prev === 'portrait' ? 'landscape' : 'portrait'))
                }
                className="flex items-center gap-1.5 text-xs"
              >
                <Compass className="w-3.5 h-3.5" />
                {currentOrientation === 'portrait' ? 'Switch to Landscape' : 'Switch to Portrait'}
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handlePrint}
                className="flex items-center gap-1.5 text-xs"
              >
                <Printer className="w-4 h-4" />
                Print Document
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="p-1 text-text-muted hover:text-text-primary"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Modal Document Body (Preview Container with A4 styling simulation) */}
          <div className="flex-1 overflow-y-auto p-6 bg-slate-900/50 flex justify-center">
            <div
              className={`bg-white text-gray-900 rounded-sm shadow-xl p-8 transition-all duration-200 ${
                currentOrientation === 'landscape'
                  ? 'w-[297mm] min-h-[210mm] max-w-full'
                  : 'w-[210mm] min-h-[297mm] max-w-full'
              }`}
            >
              {children}
            </div>
          </div>

          {/* Modal Footer */}
          <div className="px-6 py-3 border-t border-border-default bg-surface-elevated flex justify-between items-center text-xs text-text-secondary">
            <span>Enterprise A4 Document Preview</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={onClose}>
                Close
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handlePrint}
                className="flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                Print / Save PDF
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Isolated DOM Print Target for @media print */}
      {portalElement &&
        createPortal(
          <div
            className={
              currentOrientation === 'landscape' ? 'merc-print-landscape' : 'merc-print-portrait'
            }
          >
            {children}
          </div>,
          portalElement,
        )}
    </>
  );
};

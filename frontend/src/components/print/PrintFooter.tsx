import React from 'react';

export interface SignatureBlock {
  title: string;
  name?: string;
  department?: string;
  date?: string;
}

export interface PrintFooterProps {
  signatures?: SignatureBlock[];
  notes?: string;
  className?: string;
}

export const PrintFooter: React.FC<PrintFooterProps> = ({
  signatures = [],
  notes,
  className = '',
}) => {
  const now = new Date();
  const formattedDate = now.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  return (
    <div
      className={`mt-8 pt-4 border-t-2 border-gray-300 text-xs print-break-inside-avoid ${className}`}
    >
      {/* Signatures block for single record sheets */}
      {signatures.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8 pt-2">
          {signatures.map((sig, idx) => (
            <div key={idx} className="border-t border-gray-400 pt-2 text-center">
              <p className="font-bold text-gray-900 text-xs">{sig.title}</p>
              {sig.department && (
                <p className="text-[9px] uppercase tracking-wider text-gray-500 font-semibold">
                  {sig.department}
                </p>
              )}
              {sig.name && <p className="text-[10px] text-gray-700 mt-1">{sig.name}</p>}
              <div className="h-6" /> {/* Placeholder spacing for physical/digital signature */}
              <p className="text-[8px] text-gray-400">Date: {sig.date || '___/___/______'}</p>
            </div>
          ))}
        </div>
      )}

      {/* Optional general remarks/disclaimer */}
      {notes && <p className="text-[10px] text-gray-500 italic mb-3 text-center">{notes}</p>}

      {/* Enterprise Standard Footer Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-center text-[8pt] text-gray-500 border-t border-gray-200 pt-2">
        <div className="flex items-center gap-2">
          <span className="font-bold text-gray-700">MERC</span>
          <span>&middot;</span>
          <span>Confidential — For Internal Use Only</span>
        </div>
        <div>
          <span>Generated On: {formattedDate}</span>
        </div>
      </div>
    </div>
  );
};

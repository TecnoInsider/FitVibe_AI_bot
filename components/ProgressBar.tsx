
import React from 'react';

interface ProgressBarProps {
  value: number;
  max: number;
  label?: string;
  height?: string;
  isLarge?: boolean;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ value, max, label, height = 'h-4', isLarge = false }) => {
  const percentage = max > 0 ? (value / max) * 100 : 0;

  return (
    <div>
      <div className={`relative w-full rounded-full overflow-hidden ${height} bg-slate-200`}>
        <div
          className="h-full rounded-full transition-all duration-500 bg-orange-500"
          style={{ width: `${percentage}%` }}
        />
        {isLarge && label && (
             <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-white font-bold text-sm shadow-sm">{label}</span>
            </div>
        )}
      </div>
      {!isLarge && label && (
        <div className="text-right text-sm mt-2 text-slate-500">
            {label}
        </div>
      )}
    </div>
  );
};

export default ProgressBar;
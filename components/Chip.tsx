
import React from 'react';

interface ChipProps {
  label: string;
  isActive: boolean;
  onClick: () => void;
  compact?: boolean;
}

const Chip: React.FC<ChipProps> = ({ label, isActive, onClick, compact = false }) => {
  const baseClasses = "rounded-full font-semibold whitespace-nowrap transition-colors";
  const sizeClasses = compact ? "px-3 py-1 text-sm" : "px-4 py-2 text-sm";
  const activeClasses = "bg-orange-500 text-white shadow-sm";
  const inactiveClasses = compact ? "bg-transparent text-slate-500 hover:bg-slate-200" : "bg-slate-200 text-slate-700 hover:bg-slate-300";

  return (
    <button
      onClick={onClick}
      className={`${baseClasses} ${sizeClasses} ${isActive ? activeClasses : inactiveClasses}`}
    >
      {label}
    </button>
  );
};

export default Chip;
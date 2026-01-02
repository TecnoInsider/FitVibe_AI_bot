
import React from 'react';
import { Dumbbell } from 'lucide-react';

interface WorkoutsEmptyStateProps {
  onAddFirst: () => void;
}

const WorkoutsEmptyState: React.FC<WorkoutsEmptyStateProps> = ({ onAddFirst }) => {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-4 bg-white rounded-2xl shadow-sm">
      <div className="w-20 h-20 rounded-full bg-sky-100 flex items-center justify-center mb-6">
        <Dumbbell className="w-10 h-10 text-sky-500" />
      </div>
      <h2 className="text-2xl font-bold text-slate-800 mb-2">Начните отслеживать прогресс</h2>
      <p className="text-slate-500 max-w-xs mb-8">
        Добавляйте свои тренировки, чтобы следить за активностью и достигать поставленных целей.
      </p>
      <button
        onClick={onAddFirst}
        className="px-8 py-3 rounded-xl font-semibold bg-sky-500 text-white hover:bg-sky-600 transition-colors shadow-lg"
      >
        Добавить первую тренировку
      </button>
    </div>
  );
};

export default WorkoutsEmptyState;

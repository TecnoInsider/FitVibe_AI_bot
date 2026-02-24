import React from 'react';
import { Workout } from '../types';
import { Pencil, Trash2 } from 'lucide-react';

interface WorkoutCardProps {
  workout: Workout;
  onEdit: () => void;
  onDelete: () => void;
  onViewNotes: () => void;
  showDate?: boolean;
}

const WorkoutCard: React.FC<WorkoutCardProps> = ({ workout, onEdit, onDelete, onViewNotes, showDate = true }) => {
  const formattedDate = showDate
    ? new Date(workout.date).toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'long',
      })
    : null;

  const justifyClass = showDate ? 'justify-between' : 'justify-end';

  return (
    <div className="p-4 rounded-2xl shadow-sm bg-white flex items-center">
      <div className="flex-grow cursor-pointer min-w-0" onClick={onViewNotes}>
        <div className="flex justify-between items-baseline mb-1">
          <p className="font-bold text-lg text-slate-800 truncate">{workout.type}</p>
          <p className="font-semibold text-lg text-slate-800 shrink-0 ml-2">{workout.kcal} ккал</p>
        </div>
        <div className={`flex items-baseline text-sm text-slate-500 ${justifyClass}`}>
          {formattedDate && <p>{formattedDate}</p>}
          <p>{workout.minutes} мин</p>
        </div>
      </div>
      <div className="flex flex-col pl-3 ml-3 border-l border-slate-200 space-y-2">
        <button onClick={onEdit} className="p-2 text-slate-400 hover:text-emerald-500 transition-colors">
          <Pencil size={18} />
        </button>
        <button onClick={onDelete} className="p-2 text-slate-400 hover:text-red-500 transition-colors">
          <Trash2 size={18} />
        </button>
      </div>
    </div>
  );
};

export default WorkoutCard;

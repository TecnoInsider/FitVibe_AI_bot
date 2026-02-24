import React from 'react';
import { NutritionLog } from '../types';
import { Pencil, Trash2 } from 'lucide-react';

interface NutritionLogCardProps {
  log: NutritionLog;
  onEdit: () => void;
  onDelete: () => void;
}

const NutritionLogCard: React.FC<NutritionLogCardProps> = ({ log, onEdit, onDelete }) => {
  
  const eventDate = new Date(log.created_at);
  
  const capitalize = (s: string) => s && s[0].toUpperCase() + s.slice(1);

  const dayOfWeek = capitalize(new Intl.DateTimeFormat('ru-RU', { weekday: 'short' }).format(eventDate));
  const day = new Intl.DateTimeFormat('ru-RU', { day: 'numeric' }).format(eventDate);
  const month = new Intl.DateTimeFormat('ru-RU', { month: 'short' }).format(eventDate).replace(/\.$/, ''); // Удаляем точку в конце, если есть (напр. "июл.")
  const time = new Intl.DateTimeFormat('ru-RU', { hour: '2-digit', minute: '2-digit' }).format(eventDate);

  const formattedDateTime = `${dayOfWeek}, ${day} ${month} в ${time}`;


  return (
    <div className="p-4 rounded-2xl shadow-sm bg-white flex items-start">
      <div className="flex-grow min-w-0">
        <div className="mb-2">
          <p className="font-bold text-lg text-slate-800 break-words leading-tight" title={log.food_description}>
            {log.food_description}
          </p>
          <p className="text-sm text-slate-500">{log.meal_type} · {formattedDateTime}</p>
        </div>
        
        <div className="flex items-center text-xs text-slate-500 space-x-4 flex-wrap gap-y-1">
            <span className="font-semibold text-emerald-600">К: <b className="font-bold">{log.kcal}</b></span>
            <span>Б: <b className="font-bold text-slate-700">{log.protein}г</b></span>
            <span>У: <b className="font-bold text-slate-700">{log.carbs}г</b></span>
            <span>Ж: <b className="font-bold text-slate-700">{log.fat}г</b></span>
        </div>
      </div>
      
      <div className="flex flex-col pl-3 ml-3 border-l border-slate-200 space-y-2 shrink-0">
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

export default NutritionLogCard;
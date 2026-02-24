import React from 'react';
import { UtensilsCrossed } from 'lucide-react';

interface NutritionEmptyStateProps {
  onSetGoals: () => void;
}

const NutritionEmptyState: React.FC<NutritionEmptyStateProps> = ({ onSetGoals }) => {
  return (
    <div className="flex flex-col items-center justify-center text-center pt-8 pb-12 px-4 bg-white rounded-2xl shadow-sm">
      <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mb-6">
        <UtensilsCrossed className="w-10 h-10 text-emerald-500" />
      </div>
      <h2 className="text-2xl font-bold text-slate-800 mb-2">Начните следить за питанием</h2>
      
      <p className="text-slate-500 max-w-xs mb-6">
        Записывайте приемы пищи через чат с ботом, и вся статистика появится здесь.
      </p>
      
      <div className="bg-slate-100 p-4 rounded-lg text-left text-sm text-slate-600 w-full max-w-xs mb-8">
        <p className='font-semibold text-slate-700 mb-2'>С чего начать?</p>
        <p>Для начала установите ваши ежедневные цели. После этого вы сможете добавлять приемы пищи с помощью кнопки «+» или через бота.</p>
      </div>

      <button
        onClick={onSetGoals}
        className="px-8 py-3 rounded-xl font-semibold bg-emerald-500 text-white hover:bg-emerald-600 transition-colors shadow-lg"
      >
        Установить цели
      </button>
    </div>
  );
};

export default NutritionEmptyState;

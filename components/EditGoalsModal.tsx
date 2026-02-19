import React, { useState, FormEvent, useEffect } from 'react';
import { NutritionStats } from '../types';
import { X } from 'lucide-react';

interface EditGoalsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (goals: NutritionStats) => void;
  initialGoals: NutritionStats;
}

const inputFields = [
    { name: 'dailyGoalKcal', label: 'Калории, ккал', placeholder: '1800' },
    { name: 'proteinGoal', label: 'Белки, г', placeholder: '110' },
    { name: 'fatGoal', label: 'Жиры, г', placeholder: '60' },
    { name: 'carbsGoal', label: 'Углеводы, г', placeholder: '200' },
];

const EditGoalsModal: React.FC<EditGoalsModalProps> = ({ isOpen, onClose, onSave, initialGoals }) => {
  const [goals, setGoals] = useState(initialGoals);

  useEffect(() => {
    // Этот эффект синхронизирует состояние формы с initialGoals только один раз, когда модальное окно открывается.
    // Мы намеренно убираем initialGoals из массива зависимостей, чтобы предотвратить
    // сброс формы при повторных рендерах родительского компонента, пока окно открыто.
    // Это позволяет пользователю свободно редактировать поля.
    if (isOpen) {
      setGoals(initialGoals);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    // Позволяем вводить пустые строки для удобства редактирования
    if (value === '') {
      setGoals(prev => ({ ...prev, [name]: '' } as any));
    } else {
      setGoals(prev => ({ ...prev, [name]: parseInt(value, 10) || 0 }));
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    // Перед сохранением убедимся, что все значения - числа
    const finalGoals = {
      ...goals,
      dailyGoalKcal: Number(goals.dailyGoalKcal) || 0,
      proteinGoal: Number(goals.proteinGoal) || 0,
      carbsGoal: Number(goals.carbsGoal) || 0,
      fatGoal: Number(goals.fatGoal) || 0,
    };
    onSave(finalGoals);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-40 flex items-center justify-center p-4" onClick={onClose}>
      <div className="w-full max-w-sm p-6 rounded-2xl shadow-lg bg-white" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-slate-800">Редактировать цели</h2>
            <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600">
                <X size={24} />
            </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {inputFields.map(({name, label, placeholder}) => (
            <div key={name}>
                <label className="block text-sm font-medium mb-1 text-slate-600">{label}</label>
                <input
                  type="number"
                  name={name}
                  value={goals[name as keyof NutritionStats]}
                  onChange={handleChange}
                  placeholder={placeholder}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
                  required
                />
            </div>
          ))}
          
          <div className="flex justify-end items-center space-x-6 pt-4">
            <button type="button" onClick={onClose} className="font-semibold text-slate-600 hover:text-slate-800">
              Отмена
            </button>
            <button type="submit" className="px-6 py-2.5 font-semibold rounded-lg bg-orange-500 text-white hover:bg-orange-600 shadow-sm transition-colors">
              Сохранить
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditGoalsModal;
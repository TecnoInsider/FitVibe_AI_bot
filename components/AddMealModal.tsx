import React, { useState, FormEvent, useEffect } from 'react';
import { NutritionLog } from '../types';
import { X } from 'lucide-react';

interface AddMealModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (meal: Omit<NutritionLog, 'id' | 'created_at'> | NutritionLog) => void;
  initialData?: NutritionLog | null;
}

const mealTypes: NutritionLog['meal_type'][] = ['Завтрак', 'Обед', 'Ужин', 'Перекус'];

const AddMealModal: React.FC<AddMealModalProps> = ({ isOpen, onClose, onSave, initialData }) => {
  const [mealType, setMealType] = useState<NutritionLog['meal_type']>('Завтрак');
  const [description, setDescription] = useState('');
  const [kcal, setKcal] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  // Fix: Add date to state to satisfy NutritionLog type requirements.
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setMealType(initialData.meal_type);
        setDescription(initialData.food_description);
        setKcal(String(initialData.kcal));
        setProtein(String(initialData.protein));
        setCarbs(String(initialData.carbs));
        setFat(String(initialData.fat));
        // Fix: Set date from initialData when editing.
        setDate(initialData.date);
      } else {
        resetForm();
      }
    }
  }, [isOpen, initialData]);

  const resetForm = () => {
    setMealType('Завтрак');
    setDescription('');
    setKcal('');
    setProtein('');
    setCarbs('');
    setFat('');
    // Fix: Reset date to today for new entries.
    setDate(new Date().toISOString().split('T')[0]);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!description || !kcal) return;

    const mealData = {
      // Fix: Include date in the meal data payload.
      date,
      meal_type: mealType,
      food_description: description,
      kcal: parseInt(kcal, 10) || 0,
      protein: parseInt(protein, 10) || 0,
      carbs: parseInt(carbs, 10) || 0,
      fat: parseInt(fat, 10) || 0,
    };
    
    if (initialData) {
      onSave({ ...mealData, id: initialData.id, created_at: initialData.created_at });
    } else {
      onSave(mealData);
    }
    resetForm();
  };

  if (!isOpen) return null;
  
  const isEditing = !!initialData;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-40 flex items-center justify-center p-4" onClick={onClose}>
      <div className="w-full max-w-sm p-6 rounded-2xl shadow-lg bg-white" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-slate-800">{isEditing ? 'Редактировать' : 'Добавить'} прием пищи</h2>
            <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600">
                <X size={24} />
            </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium mb-1 text-slate-600">Прием пищи</label>
                <select value={mealType} onChange={(e) => setMealType(e.target.value as NutritionLog['meal_type'])} className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-400">
                    {mealTypes.map(type => <option key={type} value={type}>{type}</option>)}
                </select>
            </div>
            <div>
                <label className="block text-sm font-medium mb-1 text-slate-600">Описание</label>
                <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Например: Овсянка с ягодами" className="w-full px-3 py-2.5 border border-slate-300 rounded-lg" required />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium mb-1 text-slate-600">Калории, ккал</label>
                    <input type="number" value={kcal} onChange={(e) => setKcal(e.target.value)} placeholder="350" className="w-full px-3 py-2.5 border border-slate-300 rounded-lg" required />
                </div>
                 <div>
                    <label className="block text-sm font-medium mb-1 text-slate-600">Белки, г</label>
                    <input type="number" value={protein} onChange={(e) => setProtein(e.target.value)} placeholder="15" className="w-full px-3 py-2.5 border border-slate-300 rounded-lg" />
                </div>
            </div>
             <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium mb-1 text-slate-600">Углеводы, г</label>
                    <input type="number" value={carbs} onChange={(e) => setCarbs(e.target.value)} placeholder="50" className="w-full px-3 py-2.5 border border-slate-300 rounded-lg" />
                </div>
                 <div>
                    <label className="block text-sm font-medium mb-1 text-slate-600">Жиры, г</label>
                    <input type="number" value={fat} onChange={(e) => setFat(e.target.value)} placeholder="10" className="w-full px-3 py-2.5 border border-slate-300 rounded-lg" />
                </div>
            </div>
          
            <div className="flex justify-end items-center space-x-6 pt-4">
                <button type="button" onClick={onClose} className="font-semibold text-slate-600 hover:text-slate-800">
                  Отмена
                </button>
                <button type="submit" className="px-6 py-2.5 font-semibold rounded-lg bg-sky-500 text-white hover:bg-sky-600 shadow-sm transition-colors">
                  Сохранить
                </button>
            </div>
        </form>
      </div>
    </div>
  );
};

export default AddMealModal;
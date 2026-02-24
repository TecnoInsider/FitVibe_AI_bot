import React, { useState, FormEvent, useEffect } from 'react';
import { Workout } from '../types';
import { X, Calendar, Info } from 'lucide-react';

interface AddWorkoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (workout: Omit<Workout, 'id'> | Workout) => void;
  initialData?: Workout | null;
}

const AddWorkoutModal: React.FC<AddWorkoutModalProps> = ({ isOpen, onClose, onSave, initialData }) => {
  const [type, setType] = useState('');
  const [minutes, setMinutes] = useState('');
  const [kcal, setKcal] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setType(initialData.type);
        setMinutes(String(initialData.minutes));
        setKcal(String(initialData.kcal));
        setDate(initialData.date);
        setNotes(initialData.notes || '');
      } else {
        resetForm();
      }
    }
  }, [isOpen, initialData]);

  const resetForm = () => {
    setType('');
    setMinutes('');
    setKcal('');
    setNotes('');
    setDate(new Date().toISOString().split('T')[0]);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!type || !minutes || !kcal || !date) return;

    const workoutData = {
      type,
      minutes: parseInt(minutes, 10),
      kcal: parseInt(kcal, 10),
      date,
      notes,
    };
    
    if (initialData) {
      onSave({ ...workoutData, id: initialData.id });
    } else {
      onSave(workoutData);
    }
    resetForm();
  };

  if (!isOpen) return null;
  
  const isEditing = !!initialData;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-40 flex items-center justify-center p-4" onClick={onClose}>
      <div className="w-full max-w-sm p-6 rounded-2xl shadow-lg bg-white" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-slate-800">{isEditing ? 'Редактировать' : 'Добавить'} тренировку</h2>
            <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600">
                <X size={24} />
            </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium mb-1 text-slate-600">Тип тренировки</label>
                <input
                  type="text"
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  placeholder="Например: Бег, Силовая"
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent"
                  required
                />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium mb-1 text-slate-600">Минуты</label>
                    <input
                      type="number"
                      value={minutes}
                      onChange={(e) => setMinutes(e.target.value)}
                      placeholder="30"
                      className="w-full px-3 py-2.5 border border-slate-300 rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent"
                      required
                    />
                </div>
                <div className="relative">
                    <label className="flex items-center text-sm font-medium mb-1 text-slate-600">
                        Калории
                        <button type="button" onClick={() => setShowTooltip(prev => !prev)} className="ml-1.5 text-slate-400">
                            <Info size={14} />
                        </button>
                    </label>
                    <input
                      type="number"
                      value={kcal}
                      onChange={(e) => setKcal(e.target.value)}
                      placeholder="200"
                      className="w-full px-3 py-2.5 border border-slate-300 rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent"
                      required
                    />
                     {showTooltip && (
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 rounded-lg shadow-lg bg-slate-800 text-white text-xs z-50">
                            <b className="font-bold block mb-1">Как считать калории?</b>
                            Точный подсчет зависит от веса, интенсивности и др.
                            <ul className="list-disc list-inside mt-1 space-y-0.5">
                                <li><b>Ходьба:</b> ~200-300 ккал/час</li>
                                <li><b>Бег:</b> ~500-700 ккал/час</li>
                                <li><b>Силовая:</b> ~300-500 ккал/час</li>
                                <li><b>Йога:</b> ~150-250 ккал/час</li>
                            </ul>
                            <div className="absolute left-1/2 -translate-x-1/2 bottom-[-4px] w-0 h-0 border-l-4 border-l-transparent border-r-4 border-r-transparent border-t-4 border-t-slate-800"></div>
                        </div>
                    )}
                </div>
            </div>
            
            <div>
                <label className="block text-sm font-medium mb-1 text-slate-600">Дата</label>
                <div className="relative">
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full px-3 py-2.5 pr-10 border border-slate-300 rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent appearance-none"
                      required
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <Calendar size={20} className="text-slate-400" />
                    </div>
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium mb-1 text-slate-600">Заметки (необязательно)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Например: последние подходы были тяжелыми"
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent"
                  rows={2}
                />
            </div>
          
            <div className="flex justify-end items-center space-x-6 pt-4">
                <button type="button" onClick={onClose} className="font-semibold text-slate-600 hover:text-slate-800">
                  Отмена
                </button>
                <button type="submit" className="px-6 py-2.5 font-semibold rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 shadow-sm transition-colors">
                  Сохранить
                </button>
            </div>
        </form>
      </div>
    </div>
  );
};

export default AddWorkoutModal;
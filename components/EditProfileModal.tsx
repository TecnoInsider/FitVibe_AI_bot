import React, { useState, FormEvent, useEffect } from 'react';
import { UserProfile } from '../types';
import { X } from 'lucide-react';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<UserProfile>) => void;
  profile: UserProfile | null;
  userName: string;
}

const activityLevels = ["Сидячий", "Легкая активность", "Умеренная активность", "Высокая активность"];
const goals = ["Снижение веса", "Поддержание веса", "Набор мышечной массы"];

const EditProfileModal: React.FC<EditProfileModalProps> = ({ isOpen, onClose, onSave, profile, userName }) => {
  const [formData, setFormData] = useState({
    name: '',
    height: '',
    weight: '',
    age: '',
    activity_level: '',
    goal: ''
  });

  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: profile?.name || userName || '',
        height: profile?.height?.toString() || '',
        weight: profile?.weight?.toString() || '',
        age: profile?.age?.toString() || '',
        activity_level: profile?.activity_level || activityLevels[0],
        goal: profile?.goal || goals[0]
      });
    }
  }, [isOpen, profile, userName]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const processedData = {
        name: formData.name,
        height: parseFloat(formData.height) || 0,
        weight: parseFloat(formData.weight) || 0,
        age: parseInt(formData.age, 10) || 0,
        activity_level: formData.activity_level,
        goal: formData.goal,
    };
    onSave(processedData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-40 flex items-center justify-center p-4" onClick={onClose}>
      <div className="w-full max-w-sm p-6 rounded-2xl shadow-lg bg-white" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-slate-800">Редактировать профиль</h2>
            <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600">
                <X size={24} />
            </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
            
            <div>
                <label className="block text-sm font-medium mb-1 text-slate-600">Имя</label>
                <input type="text" name="name" value={formData.name} onChange={handleChange} className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400" required />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium mb-1 text-slate-600">Рост, см</label>
                    <input type="number" name="height" value={formData.height} onChange={handleChange} className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400" required />
                </div>
                 <div>
                    <label className="block text-sm font-medium mb-1 text-slate-600">Вес, кг</label>
                    <input type="number" name="weight" value={formData.weight} step="0.1" onChange={handleChange} className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400" required />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium mb-1 text-slate-600">Возраст</label>
                <input type="number" name="age" value={formData.age} onChange={handleChange} className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400" required />
            </div>
            
            <div>
                <label className="block text-sm font-medium mb-1 text-slate-600">Уровень активности</label>
                <select name="activity_level" value={formData.activity_level} onChange={handleChange} className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400">
                    {activityLevels.map(level => <option key={level} value={level}>{level}</option>)}
                </select>
            </div>
            
            <div>
                <label className="block text-sm font-medium mb-1 text-slate-600">Цель</label>
                <select name="goal" value={formData.goal} onChange={handleChange} className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400">
                    {goals.map(goal => <option key={goal} value={goal}>{goal}</option>)}
                </select>
            </div>

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

export default EditProfileModal;
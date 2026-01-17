import React, { FormEvent, useEffect, useMemo, useState } from 'react';
import { updateProfile } from '../hooks/api';
import { useTelegram } from '../contexts/TelegramContext';
import { useAppContext } from '../contexts/AppContext';
import { UserProfile } from '../types';

interface OnboardingPageProps {
  onComplete: (profile: UserProfile) => void;
}

const activityLevels = ['Сидячий', 'Легкая активность', 'Умеренная активность', 'Высокая активность'];
const goals = ['Снижение веса', 'Поддержание веса', 'Набор мышечной массы'];

const buildDraftKey = (tgId?: number) =>
  tgId ? `fitvibe_onboarding_draft_${tgId}` : 'fitvibe_onboarding_draft';

const OnboardingPage: React.FC<OnboardingPageProps> = ({ onComplete }) => {
  const { user } = useTelegram();
  const { showToast } = useAppContext();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const initialFormData = useMemo(() => ({
    name: user?.first_name || '',
    height: '',
    weight: '',
    age: '',
    activity_level: activityLevels[0],
    goal: goals[0],
  }), [user?.first_name]);

  const [formData, setFormData] = useState(initialFormData);

  useEffect(() => {
    if (!user?.id) return;
    const draftKey = buildDraftKey(user.id);
    try {
      const rawDraft = localStorage.getItem(draftKey);
      if (rawDraft) {
        const parsedDraft = JSON.parse(rawDraft);
        setFormData(prev => ({
          ...prev,
          ...parsedDraft,
          name: parsedDraft.name || user.first_name || prev.name,
        }));
        return;
      }
    } catch (error) {
      console.warn('Failed to parse onboarding draft', error);
    }

    setFormData(prev => ({
      ...prev,
      name: user.first_name || prev.name,
    }));
  }, [user?.id, user?.first_name]);

  useEffect(() => {
    if (!user?.id) return;
    const draftKey = buildDraftKey(user.id);
    try {
      localStorage.setItem(draftKey, JSON.stringify(formData));
    } catch (error) {
      console.warn('Failed to save onboarding draft', error);
    }
  }, [formData, user?.id]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!user?.id) return;

    setIsSubmitting(true);
    const draftKey = buildDraftKey(user.id);
    try {
      const payload: Partial<UserProfile> = {
        tg_id: user.id,
        name: formData.name.trim(),
        height: parseFloat(formData.height) || 0,
        weight: parseFloat(formData.weight) || 0,
        age: parseInt(formData.age, 10) || 0,
        activity_level: formData.activity_level,
        goal: formData.goal,
      };

      const savedProfile = await updateProfile(payload);
      if (!savedProfile) {
        throw new Error('Empty profile response');
      }

      localStorage.removeItem(draftKey);
      onComplete(savedProfile);
    } catch (error) {
      console.error('Failed to complete onboarding', error);
      showToast('Ошибка сохранения профиля');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col">
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-sm p-6 rounded-2xl shadow-lg bg-white">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-slate-800">Заполните профиль</h1>
            <p className="text-sm text-slate-500 mt-1">Это займет не больше минуты</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-slate-600">Имя</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-400"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-slate-600">Рост, см</label>
                <input
                  type="number"
                  name="height"
                  value={formData.height}
                  onChange={handleChange}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-400"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-slate-600">Вес, кг</label>
                <input
                  type="number"
                  name="weight"
                  value={formData.weight}
                  onChange={handleChange}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-400"
                  step="0.1"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-slate-600">Возраст</label>
              <input
                type="number"
                name="age"
                value={formData.age}
                onChange={handleChange}
                className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-400"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-slate-600">Уровень активности</label>
              <select
                name="activity_level"
                value={formData.activity_level}
                onChange={handleChange}
                className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-400"
              >
                {activityLevels.map(level => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-slate-600">Цель</label>
              <select
                name="goal"
                value={formData.goal}
                onChange={handleChange}
                className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-400"
              >
                {goals.map(goal => (
                  <option key={goal} value={goal}>
                    {goal}
                  </option>
                ))}
              </select>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full px-6 py-2.5 font-semibold rounded-lg bg-sky-500 text-white hover:bg-sky-600 shadow-sm transition-colors disabled:bg-slate-400"
              >
                {isSubmitting ? 'Сохраняем...' : 'Продолжить'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default OnboardingPage;


import React, { useRef, useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { useNavigate } from 'react-router-dom';
import { Camera, Pencil, Ruler, HeartPulse, TrendingUp, Target, Gift, User, Loader2 } from 'lucide-react';
import { getProfile, updateProfile, uploadAvatar } from '../hooks/api';
import { useTelegram } from '../contexts/TelegramContext';
import EditProfileModal from '../components/EditProfileModal';
import { useAppContext } from '../contexts/AppContext';
import { formatDateTimeForUser, resolveTimezone } from '../lib/datetime';

const ProfileInfoCard: React.FC<{ icon: React.ReactNode; value: string | number; label: string }> = ({ icon, value, label }) => (
    <div className="bg-white p-4 rounded-2xl shadow-sm text-center flex flex-col items-center justify-center h-36">
        <div className="text-emerald-500 mb-2">{icon}</div>
        <p className="text-base font-bold text-slate-800">{value}</p>
        <p className="text-xs text-slate-500">{label}</p>
    </div>
);

const ProfileSkeleton: React.FC = () => (
    <div className="animate-pulse p-4">
        <div className="flex justify-between items-center mb-6">
            <div className="w-32 h-8 bg-slate-200 rounded-md"></div>
            <div className="w-10 h-10 bg-slate-200 rounded-lg"></div>
        </div>
        <div className="flex flex-col items-center mb-8">
            <div className="w-28 h-28 bg-slate-200 rounded-full mb-4"></div>
            <div className="h-7 bg-slate-200 rounded-md w-1/3"></div>
        </div>
        <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="h-36 bg-slate-200 rounded-2xl"></div>
            <div className="h-36 bg-slate-200 rounded-2xl"></div>
            <div className="h-36 bg-slate-200 rounded-2xl"></div>
            <div className="h-36 bg-slate-200 rounded-2xl"></div>
        </div>
        <div className="h-16 bg-slate-200 rounded-2xl"></div>
    </div>
);

const ProfilePage: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const { user } = useTelegram();
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useAppContext();

  useEffect(() => {
    if (typeof user?.id === 'number') {
        const fetchProfile = async () => {
            if (!profile) setIsLoading(true);
            try {
                const data = await getProfile(user.id);
                setProfile(data);
            } catch (err) {
                console.error("[Debug] Failed to fetch profile:", err);
                showToast("Ошибка загрузки профиля");
            } finally {
                setIsLoading(false);
            }
        };
        fetchProfile();
    }
  }, [user]);

  const handleSaveProfile = async (updatedData: Partial<UserProfile>) => {
    if (!user?.id) return;
    
    const originalProfile = profile;
    const optimisticProfile: UserProfile = {
        ...(originalProfile || {
            tg_id: user.id,
            name: user.first_name,
            age: 0,
            height: 0,
            weight: 0,
            activity_level: 'Нет данных',
            goal: 'Нет данных',
            promo_codes: []
        }),
        ...updatedData,
    };

    setProfile(optimisticProfile);
    setIsEditModalOpen(false);

    try {
        await updateProfile({ ...updatedData, tg_id: user.id });
        showToast("Профиль сохранен!");
    } catch (error) {
        console.error("Failed to update profile", error);
        showToast("Ошибка сохранения профиля");
        setProfile(originalProfile); // Revert on error
    }
  };
  
  const handleAvatarClick = () => {
      fileInputRef.current?.click();
  };
  
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file || !user?.id) return;
      
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        showToast("Файл слишком большой (макс. 5МБ)");
        return;
      }
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        showToast("Неверный формат файла");
        return;
      }
      
      setIsUploadingAvatar(true);
      try {
        const result = await uploadAvatar(file, user.id);
        if (result?.avatar_url) {
            // Cache Busting: Добавляем уникальный параметр, чтобы обновить кэш браузера
            const cacheBustedUrl = `${result.avatar_url}?t=${new Date().getTime()}`;
            setProfile(prev => prev ? { ...prev, avatar_url: cacheBustedUrl } : null);
            showToast("Фотография обновлена!");
        } else {
            throw new Error("URL аватара не был получен от сервера");
        }
      } catch (error) {
        console.error("Failed to upload avatar", error);
        showToast("Ошибка загрузки фото");
      } finally {
        setIsUploadingAvatar(false);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
      }
  };
  
  if (isLoading) {
    return <ProfileSkeleton />;
  }

  const displayName = profile?.name || user?.first_name || 'Пользователь';
  const accessStatus = profile?.access_status || 'demo';
  const untilDateRaw = profile?.access_until || profile?.demo_ends_at;
  const userTimezone = resolveTimezone(profile?.timezone);
  const untilText = formatDateTimeForUser(untilDateRaw, userTimezone);
  const untilLabel = userTimezone ? `Доступ до (${userTimezone})` : 'Доступ до';
  const statusText =
    accessStatus === 'paid'
      ? 'Подписка активна'
      : accessStatus === 'blocked'
        ? 'Доступ ограничен'
        : 'Демо-режим';
  const billingButtonText =
    accessStatus === 'paid' ? 'Управление подпиской' : 'Оформить доступ';
  const billingTarget = accessStatus === 'paid' ? '/billing?mode=manage' : '/billing';

  return (
    <div className="p-4">
        <header className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-slate-900">Ваши данные</h1>
            <button 
                onClick={() => setIsEditModalOpen(true)}
                className="p-2 bg-emerald-100 text-emerald-600 rounded-lg hover:bg-emerald-200 transition-colors" 
                aria-label="Редактировать профиль"
            >
                <Pencil size={20} />
            </button>
        </header>

        <div className="flex flex-col items-center text-center mb-8">
            <div className="relative mb-4">
                <div className="w-28 h-28 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden border-2 border-white shadow-sm">
                    {profile?.avatar_url ? (
                        <img src={profile.avatar_url} alt={displayName} className="w-full h-full object-cover" />
                    ) : (
                        <User className="w-16 h-16 text-slate-400" />
                    )}
                    {isUploadingAvatar && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <Loader2 className="w-8 h-8 text-white animate-spin" />
                        </div>
                    )}
                </div>
                <button 
                    onClick={handleAvatarClick}
                    disabled={isUploadingAvatar}
                    className="absolute bottom-0 right-0 w-8 h-8 bg-emerald-500 text-white rounded-full flex items-center justify-center border-2 border-slate-50 hover:bg-emerald-600 disabled:bg-slate-400"
                    aria-label="Сменить фото"
                >
                    <Camera size={16} />
                </button>
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileChange}
                    className="hidden" 
                    accept="image/png, image/jpeg, image/webp"
                />
            </div>
            <h2 className="text-2xl font-bold text-slate-800">{displayName}</h2>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
            <ProfileInfoCard icon={<Ruler size={24} />} value={`${profile?.height || '—'} см`} label="Рост" />
            <ProfileInfoCard icon={<HeartPulse size={24} />} value={`${profile?.weight || '—'} кг`} label="Вес" />
            <ProfileInfoCard icon={<TrendingUp size={24} />} value={profile?.activity_level || '—'} label="Активность" />
            <ProfileInfoCard icon={<Target size={24} />} value={profile?.goal || '—'} label="Цель" />
        </div>

        <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 mb-6">
          <h3 className="text-lg font-bold text-slate-900 mb-1">Подписка</h3>
          <p className="text-sm text-slate-600 mb-1">Статус: <span className="font-semibold">{statusText}</span></p>
          <p className="text-sm text-slate-600 mb-4">{untilLabel}: <span className="font-semibold">{untilText}</span></p>
          <button
            type="button"
            onClick={() => navigate(billingTarget)}
            className="w-full py-3 rounded-xl bg-emerald-500 text-white font-semibold hover:bg-emerald-600 transition-colors"
          >
            {billingButtonText}
          </button>
        </section>

        {/* 
        <button
            onClick={() => navigate('/profile/promocodes')}
            className="w-full flex justify-between items-center text-left p-4 rounded-2xl shadow-sm bg-emerald-400 text-white transition-transform hover:scale-[1.02]"
        >
            <div className="flex items-center">
                <Gift size={24} className="mr-3" />
                <span className="text-lg font-semibold">Промокоды</span>
            </div>
            {(profile?.promo_codes?.length || 0) > 0 && (
                <span className="w-7 h-7 bg-white text-emerald-500 text-sm font-bold rounded-full flex items-center justify-center">
                    {profile.promo_codes.length}
                </span>
            )}
        </button>
        */}
        
        <EditProfileModal
            isOpen={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
            onSave={handleSaveProfile}
            profile={profile}
            userName={displayName}
        />
    </div>
  );
};

export default ProfilePage;

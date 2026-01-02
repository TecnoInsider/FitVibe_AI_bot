import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types';
import Layout from '../components/Layout';
import PromoCard from '../components/PromoCard';
import { useTelegram } from '../contexts/TelegramContext';
import { useAppContext } from '../contexts/AppContext';
import { getProfile } from '../hooks/api';

const PromoCodesPage: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { hapticFeedback, user } = useTelegram();
  const { showToast } = useAppContext();

  useEffect(() => {
    if (typeof user?.id === 'number') {
        const fetchProfileData = async () => {
            setIsLoading(true);
            try {
                const data = await getProfile(user.id);
                setProfile(data);
            } catch (error) {
                console.error("Failed to fetch profile for promo codes", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchProfileData();
    } else if (user === null) {
        setIsLoading(false);
    }
  }, [user]);
  
  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code).then(() => {
        hapticFeedback.impactOccurred('light');
        showToast("Скопировано!");
    });
  };

  if (isLoading) {
      return <Layout title="Промокоды" canGoBack={true}><div className="text-center" style={{color: 'var(--hint-color)'}}>Загрузка...</div></Layout>
  }

  return (
    <Layout title="Промокоды" canGoBack={true}>
      {(profile?.promo_codes?.length || 0) > 0 ? (
        <div className="space-y-4">
          {profile.promo_codes.map(promo => (
            <PromoCard key={promo.code} promo={promo} onCopy={handleCopy} />
          ))}
        </div>
      ) : (
        <p className="text-center py-10" style={{ color: 'var(--hint-color)' }}>Пока нет промокодов</p>
      )}
    </Layout>
  );
};

export default PromoCodesPage;
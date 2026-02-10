
import React from 'react';
import { useTelegram } from '../contexts/TelegramContext';

interface PriceBadgeProps {
  platform: 'ozon' | 'wb';
  price: number;
  url: string;
}

const platformStyles = {
  ozon: {
    bgColor: 'bg-blue-600',
    textColor: 'text-white',
    name: 'Ozon',
  },
  wb: {
    bgColor: 'bg-purple-600',
    textColor: 'text-white',
    name: 'WB',
  },
};

const PriceBadge: React.FC<PriceBadgeProps> = ({ platform, price, url }) => {
  const { openLink } = useTelegram();
  const styles = platformStyles[platform];

  return (
    <button
      onClick={() => openLink(url)}
      className={`w-full flex items-center justify-center px-4 py-3 rounded-xl font-bold text-lg shadow-md transition-transform hover:scale-105 ${styles.bgColor} ${styles.textColor}`}
    >
      {styles.name} - {new Intl.NumberFormat('ru-RU').format(price)} ₽
    </button>
  );
};

export default PriceBadge;
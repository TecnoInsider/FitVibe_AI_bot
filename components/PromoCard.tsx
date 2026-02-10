
import React from 'react';
import { PromoCode } from '../types';
import { Copy } from 'lucide-react';

interface PromoCardProps {
  promo: PromoCode;
  onCopy: (code: string) => void;
}

const PromoCard: React.FC<PromoCardProps> = ({ promo, onCopy }) => {
  return (
    <div className="p-4 rounded-2xl shadow-sm flex items-center bg-white">
      <div className="flex-grow">
        <p className="font-mono text-xl font-bold tracking-wider text-slate-800">{promo.code}</p>
        <p className="text-sm font-medium text-slate-700">{promo.title}</p>
        <p className="text-xs text-slate-500">{promo.desc}, до {new Date(promo.expires_at).toLocaleDateString('ru-RU')}</p>
      </div>
      <button 
        onClick={() => onCopy(promo.code)}
        className="p-3 rounded-full text-sky-500 hover:bg-sky-50"
        aria-label="Копировать промокод"
      >
        <Copy size={24} />
      </button>
    </div>
  );
};

export default PromoCard;
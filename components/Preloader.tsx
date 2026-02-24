
import React from 'react';
import { UtensilsCrossed } from 'lucide-react';

const Preloader: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-slate-50">
      <div className="relative flex items-center justify-center w-24 h-24">
        <div className="absolute inset-0 rounded-full border-4 border-emerald-200"></div>
        <div className="absolute inset-0 rounded-full border-t-4 border-emerald-500 animate-spin"></div>
        <UtensilsCrossed className="w-10 h-10 text-emerald-500" />
      </div>
      <p className="mt-4 text-lg font-semibold text-slate-600">Загрузка...</p>
    </div>
  );
};

export default Preloader;
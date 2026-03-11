
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CatalogItem } from '../types';

interface ProductCardProps {
  item: CatalogItem;
}

const ProductCard: React.FC<ProductCardProps> = ({ item }) => {
  const navigate = useNavigate();
  const badgeText = item.badge || (item.type === 'article' ? 'Полезно' : 'Реклама');
  const badgeKey = badgeText.trim().toLowerCase();
  const badgeToneClass =
    badgeKey === 'полезно'
      ? 'bg-emerald-600/40 border-emerald-200/60 text-emerald-50'
      : badgeKey === 'реклама'
        ? 'bg-amber-600/40 border-amber-200/60 text-amber-50'
        : badgeKey === 'партнер' || badgeKey === 'партнёр'
          ? 'bg-sky-600/40 border-sky-200/60 text-sky-50'
          : 'bg-black/45 border-white/35 text-white';
  const openCard = () => navigate(`/catalog/${item.id}`);

  return (
    <div
      onClick={openCard}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && openCard()}
      role="button"
      tabIndex={0}
      className="cursor-pointer group rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/60"
    >
      <div className="relative w-full aspect-square bg-slate-100 rounded-2xl overflow-hidden border border-slate-200/80 shadow-sm transition-all duration-200 group-hover:shadow-md group-hover:-translate-y-0.5">
        <img src={item.img} alt={item.title} className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300" />
        <div className={`absolute top-2 left-2 px-2.5 py-1 rounded-lg text-xs font-semibold backdrop-blur-sm border shadow-sm ${badgeToneClass}`}>
          {badgeText}
        </div>
      </div>
      <div className="mt-2 flex items-center justify-between gap-2">
        <p className="font-semibold text-base leading-5 text-slate-800 line-clamp-2">{item.title}</p>
        <span className="shrink-0 inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
          Открыть
        </span>
      </div>
      {item.subtitle && <p className="mt-1 text-sm text-slate-600 line-clamp-1">{item.subtitle}</p>}
    </div>
  );
};

export default ProductCard;

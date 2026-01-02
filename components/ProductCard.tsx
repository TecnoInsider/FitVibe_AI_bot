
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CatalogItem } from '../types';

interface ProductCardProps {
  item: CatalogItem;
}

const OzonIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="12" fill="#005BFF"/>
        <path d="M11.088 6.4H13.056V17.6H11.088V6.4ZM7 9.872V7.872C8.712 7.872 10.056 8.568 10.056 10.4V10.736C8.808 10.04 7.632 9.872 7 9.872ZM17 14.128V16.128C15.288 16.128 13.944 15.432 13.944 13.6V13.264C15.192 13.96 16.368 14.128 17 14.128Z" fill="white"/>
    </svg>
);
const WbIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="12" fill="#C724B1"/>
        <path d="M8.5 7.5L7 16.5H9.5L10.5 10.5L11.5 16.5H13L12 7.5H10.5L10 12L9.5 7.5H8.5ZM14.5 7.5L13 16.5H15.5L16.5 10.5L17.5 16.5H19L18 7.5H16.5L16 12L15.5 7.5H14.5Z" fill="white"/>
    </svg>
);


const ProductCard: React.FC<ProductCardProps> = ({ item }) => {
  const navigate = useNavigate();

  return (
    <div onClick={() => navigate(`/catalog/${item.id}`)} className="cursor-pointer group">
      <div className="relative w-full aspect-square bg-white rounded-2xl overflow-hidden border border-slate-200/80 shadow-sm">
        <img src={item.img} alt={item.title} className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300" />
        {item.ozon && (
          <div className="absolute bottom-2 left-2">
              <OzonIcon/>
          </div>
        )}
        {item.wb && (
          <div className="absolute bottom-2 right-2">
              <WbIcon/>
          </div>
        )}
      </div>
      <p className="mt-2 font-semibold text-sm text-slate-800 h-10 line-clamp-2">{item.title}</p>
    </div>
  );
};

export default ProductCard;
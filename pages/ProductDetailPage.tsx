
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { CatalogItem } from '../types';
import Layout from '../components/Layout';
import { useTelegram } from '../contexts/TelegramContext';
import { getCatalog } from '../hooks/api';

const ProductDetailSkeleton: React.FC = () => (
    <div className="animate-pulse">
        <div className="w-full aspect-square bg-slate-200 rounded-2xl mb-6"></div>
        <div className="h-8 bg-slate-200 rounded-md w-3/4 mx-auto mb-6"></div>
        <div className="grid grid-cols-2 gap-4 mb-8">
            <div>
                <div className="h-12 bg-slate-200 rounded-xl mb-2"></div>
                <div className="h-8 bg-slate-200 rounded-md w-1/2 mx-auto"></div>
            </div>
            <div>
                <div className="h-12 bg-slate-200 rounded-xl mb-2"></div>
                <div className="h-8 bg-slate-200 rounded-md w-1/2 mx-auto"></div>
            </div>
        </div>
        <div className="space-y-2">
            <div className="h-4 bg-slate-200 rounded-md"></div>
            <div className="h-4 bg-slate-200 rounded-md"></div>
            <div className="h-4 bg-slate-200 rounded-md w-2/3"></div>
        </div>
    </div>
);


const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [item, setItem] = useState<CatalogItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isNotFound, setIsNotFound] = useState(false);
  const { openLink } = useTelegram();
  
  useEffect(() => {
    const fetchItem = async () => {
        if (!id) return;
        try {
            setIsLoading(true);
            const catalog = await getCatalog();
            const foundItem = (catalog ?? []).find(p => p.id === id);
            setItem(foundItem || null);
            setIsNotFound(!foundItem);
        } catch (error) {
            console.error("Failed to fetch product details", error);
            setIsNotFound(true);
        } finally {
            setIsLoading(false);
        }
    };
    fetchItem();
  }, [id]);

  if (isLoading) {
    return <Layout title="" canGoBack={true}><ProductDetailSkeleton /></Layout>;
  }

  if (!item || isNotFound) {
    return (
      <Layout title="" canGoBack={true}>
        <div className="text-center py-12 text-slate-600">Карточка не найдена</div>
      </Layout>
    );
  }

  // Очищаем описание от лишних кавычек в начале и конце
  const cleanedDescription = item.description ? item.description.replace(/^"|"$/g, '').trim() : '';
  const badgeText = item.badge || (item.type === 'article' ? 'Полезно' : 'Реклама');
  const canOpen = Boolean(item.targetUrl);

  return (
    <Layout title="" canGoBack={true}>
      <div className="w-full aspect-square bg-slate-100 rounded-2xl mb-6 shadow-md overflow-hidden">
        <img src={item.img} alt={item.title} className="w-full h-full object-cover object-center" />
      </div>
      
      <h1 className="text-3xl font-bold text-slate-900 mb-6 text-center">{item.title}</h1>

      {item.subtitle && <p className="text-center text-slate-500 mb-4">{item.subtitle}</p>}
      <div className="flex items-center justify-center gap-2 mb-6">
        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">{badgeText}</span>
        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
          {item.type === 'article' ? 'Статья' : 'Оффер'}
        </span>
      </div>

      <div className="mb-8">
        <button
          onClick={() => canOpen && openLink(item.targetUrl)}
          disabled={!canOpen}
          className="w-full py-3 rounded-xl font-bold text-white bg-emerald-500 hover:bg-emerald-600 transition-colors shadow-md text-base disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {item.ctaText || 'Подробнее'}
        </button>
      </div>

      <p className="text-slate-600 whitespace-pre-line">{cleanedDescription}</p>
    </Layout>
  );
};

export default ProductDetailPage;

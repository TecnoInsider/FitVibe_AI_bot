
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
  const { openLink } = useTelegram();
  
  useEffect(() => {
    const fetchItem = async () => {
        if (!id) return;
        try {
            setIsLoading(true);
            const catalog = await getCatalog();
            const foundItem = catalog?.find(p => p.id === id);
            setItem(foundItem || null);
        } catch (error) {
            console.error("Failed to fetch product details", error);
        } finally {
            setIsLoading(false);
        }
    };
    fetchItem();
  }, [id]);

  if (isLoading || !item) {
    return <Layout title="" canGoBack={true}><ProductDetailSkeleton /></Layout>;
  }

  // Очищаем описание от лишних кавычек в начале и конце
  const cleanedDescription = item.description ? item.description.replace(/^"|"$/g, '').trim() : '';

  return (
    <Layout title="" canGoBack={true}>
      <div className="w-full aspect-square bg-slate-100 rounded-2xl mb-6 shadow-md overflow-hidden">
        <img src={item.img} alt={item.title} className="w-full h-full object-contain" />
      </div>
      
      <h1 className="text-3xl font-bold text-slate-900 mb-6 text-center">{item.title}</h1>
      
      <div className={`grid ${!item.ozon || !item.wb ? 'grid-cols-1' : 'grid-cols-2'} gap-4 mb-8`}>
            {item.ozon && (
              <div className="text-center">
                  <button onClick={() => openLink(item.ozon!.url)} className="w-full py-2 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-md text-base">
                      OZON
                  </button>
                  <p className="mt-2 text-xl font-bold text-slate-800">
                      {new Intl.NumberFormat('ru-RU').format(item.ozon.price)} ₽
                  </p>
              </div>
            )}
            {item.wb && (
              <div className="text-center">
                  <button onClick={() => openLink(item.wb!.url)} className="w-full py-2 rounded-xl font-bold text-white bg-violet-600 hover:bg-violet-700 transition-colors shadow-md text-base">
                      WB
                  </button>
                  <p className="mt-2 text-xl font-bold text-slate-800">
                      {new Intl.NumberFormat('ru-RU').format(item.wb.price)} ₽
                  </p>
              </div>
            )}
        </div>

      <p className="text-slate-600 whitespace-pre-line">{cleanedDescription}</p>
    </Layout>
  );
};

export default ProductDetailPage;
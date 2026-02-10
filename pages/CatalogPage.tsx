
import React, { useState, useMemo, useEffect } from 'react';
import { CatalogItem } from '../types';
import Layout from '../components/Layout';
import ProductCard from '../components/ProductCard';
import Chip from '../components/Chip';
import { getCatalog } from '../hooks/api';

const CatalogSkeleton: React.FC = () => (
    <div className="animate-pulse">
        <div className="flex space-x-3 mb-6 overflow-x-auto pb-2 -mx-4 px-4">
            {[...Array(4)].map((_, i) => (
                <div key={i} className="h-10 bg-gray-300 dark:bg-gray-700 rounded-full w-24 shrink-0"></div>
            ))}
        </div>
        <div className="grid grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
                <div key={i}>
                    <div className="w-full h-40 bg-gray-300 dark:bg-gray-700 rounded-2xl mb-2"></div>
                    <div className="h-5 bg-gray-300 dark:bg-gray-700 rounded-md w-3/4"></div>
                </div>
            ))}
        </div>
    </div>
);

const CatalogPage: React.FC = () => {
  const [items, setItems] = useState<CatalogItem[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>('Все');

  useEffect(() => {
    const fetchCatalog = async () => {
        try {
            setIsLoading(true);
            const data = await getCatalog();
            setItems(data);
        } catch (error) {
            console.error("Failed to fetch catalog", error);
        } finally {
            setIsLoading(false);
        }
    };
    fetchCatalog();
  }, []);

  const categories = useMemo(() => {
    if (!items) return [];
    const uniqueCategories = [...new Set(items.map(item => item.category))];
    
    // Сортируем категории, "Без категории" отправляем в конец
    const sorted = uniqueCategories.sort((a, b) => {
      if (a === 'Без категории') return 1;
      if (b === 'Без категории') return -1;
      return a.localeCompare(b);
    });

    return ['Все', ...sorted];
  }, [items]);

  const filteredItems = useMemo(() => {
    if (!items) return [];
    if (activeCategory === 'Все') {
      return items;
    }
    return items.filter(item => item.category === activeCategory);
  }, [items, activeCategory]);

  if (isLoading || !items) {
      return <Layout title="Каталог"><CatalogSkeleton /></Layout>
  }

  return (
    <Layout title="Каталог">
       <style>
          {`
              .no-scrollbar::-webkit-scrollbar { display: none; }
              .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
          `}
      </style>
      <div className="mb-6 -mx-4">
        <div className="flex space-x-3 overflow-x-auto px-4 pb-2 no-scrollbar">
          {categories.map(category => (
              <Chip
                  key={category}
                  label={category}
                  isActive={activeCategory === category}
                  onClick={() => setActiveCategory(category)}
              />
          ))}
        </div>
      </div>
      
      {filteredItems.length > 0 ? (
        <div className="grid grid-cols-2 gap-4">
          {filteredItems.map(item => (
            <ProductCard key={item.id} item={item} />
          ))}
        </div>
      ) : (
          <p className="text-center py-10" style={{color: 'var(--hint-color)'}}>Нет товаров по выбранному фильтру</p>
      )}
    </Layout>
  );
};

export default CatalogPage;
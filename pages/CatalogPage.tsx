
import React, { useState, useMemo, useEffect } from 'react';
import { CatalogItem } from '../types';
import Layout from '../components/Layout';
import ProductCard from '../components/ProductCard';
import Chip from '../components/Chip';
import { getCatalog } from '../hooks/api';

const normalizeTag = (tag: string): string =>
  tag.trim().toLowerCase().replace(/\s+/g, '_');

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
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTag, setActiveTag] = useState<string>('all');

  useEffect(() => {
    const fetchCatalog = async () => {
        try {
            setIsLoading(true);
            const data = await getCatalog();
            setItems(data ?? []);
        } catch (error) {
            console.error("Failed to fetch catalog", error);
        } finally {
            setIsLoading(false);
        }
    };
    fetchCatalog();
  }, []);

  const tags = useMemo(() => {
    const tagMap = new Map<string, string>();
    for (const item of items) {
      for (const tag of item.tags || []) {
        const label = String(tag).trim();
        if (!label) continue;
        const key = normalizeTag(label);
        if (!tagMap.has(key)) tagMap.set(key, label);
      }
    }
    return Array.from(tagMap.entries())
      .map(([key, label]) => ({ key, label }))
      .sort((a, b) => a.label.localeCompare(b.label, 'ru'));
  }, [items]);

  const filteredItems = useMemo(() => {
    if (activeTag === 'all') return items;
    return items.filter((item) =>
      (item.tags || []).map((x) => normalizeTag(String(x))).includes(activeTag)
    );
  }, [items, activeTag]);

  const pinnedItems = useMemo(() => {
    return items
      .filter(
        (item) =>
          item.zone === 'top_pinned' &&
          (activeTag === 'all' ||
            (item.tags || [])
              .map((x) => normalizeTag(String(x)))
              .includes(activeTag))
      )
      .sort((a, b) => a.position - b.position)
      .slice(0, 2);
  }, [items, activeTag]);

  const feedItems = useMemo(() => {
    return filteredItems
      .filter((item) => item.zone !== 'top_pinned')
      .sort((a, b) => a.position - b.position);
  }, [filteredItems]);

  if (isLoading) {
      return <Layout title="Каталог"><CatalogSkeleton /></Layout>
  }

  return (
    <Layout title="Каталог">
      {tags.length > 0 && (
        <section className="mb-4 -mx-4">
          <div className="flex gap-2 overflow-x-auto px-4 pb-2">
            <Chip
              key="all"
              label="Все"
              isActive={activeTag === 'all'}
              onClick={() => setActiveTag('all')}
            />
            {tags.map((tag) => (
              <Chip
                key={tag.key}
                label={tag.label}
                isActive={activeTag === tag.key}
                onClick={() => setActiveTag(tag.key)}
              />
            ))}
          </div>
        </section>
      )}

      {pinnedItems.length > 0 && (
        <section className="mb-6">
          <h2 className="text-sm font-semibold text-slate-500 mb-3">Рекомендуем</h2>
          <div className="grid grid-cols-2 gap-4">
            {pinnedItems.map(item => (
              <ProductCard key={item.id} item={item} />
            ))}
          </div>
        </section>
      )}

      {feedItems.length > 0 ? (
        <section>
          <h2 className="text-sm font-semibold text-slate-500 mb-3">Подборка</h2>
          <div className="grid grid-cols-2 gap-4">
            {feedItems.map(item => (
              <ProductCard key={item.id} item={item} />
            ))}
          </div>
        </section>
      ) : pinnedItems.length > 0 ? (
        <p className="text-center py-10" style={{color: 'var(--hint-color)'}}>Пока нет дополнительных карточек</p>
      ) : (
        <p className="text-center py-10" style={{color: 'var(--hint-color)'}}>Пока нет карточек для отображения</p>
      )}
    </Layout>
  );
};

export default CatalogPage;

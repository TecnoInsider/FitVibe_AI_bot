
import React, { useEffect } from 'react';
import { MemoryRouter, Routes, Route, Navigate } from 'react-router-dom';
import { TabBar } from './components/TabBar';
import { TelegramProvider } from './contexts/TelegramContext';

import NutritionPage from './pages/NutritionPage';
import WorkoutsPage from './pages/WorkoutsPage';
import CatalogPage from './pages/CatalogPage';
import ProfilePage from './pages/ProfilePage';
import ProductDetailPage from './pages/ProductDetailPage';
import PromoCodesPage from './pages/PromoCodesPage';
import { AppProvider } from './contexts/AppContext';
import ErrorBoundary from './components/ErrorBoundary';

function App() {
  useEffect(() => {
    document.body.className = `bg-slate-50`;
  }, []);

  return (
    <AppProvider>
      <TelegramProvider>
        {/* Этот контент будет отображен только после успешной инициализации */}
        <MemoryRouter>
          <div className="flex flex-col h-screen font-sans antialiased bg-slate-50 text-slate-800">
            <main className="flex-grow overflow-y-auto pb-24">
              <ErrorBoundary>
                <Routes>
                  <Route path="/" element={<ProfilePage />} />
                  <Route path="/nutrition" element={<NutritionPage />} />
                  <Route path="/workouts" element={<WorkoutsPage />} />
                  <Route path="/catalog" element={<CatalogPage />} />
                  <Route path="/catalog/:id" element={<ProductDetailPage />} />
                  <Route path="/profile" element={<ProfilePage />} />
                  <Route path="/profile/promocodes" element={<PromoCodesPage />} />
                  {/* Любой неизвестный путь → Профиль */}
                  <Route path="*" element={<Navigate to="/profile" replace />} />
                </Routes>
              </ErrorBoundary>
            </main>
            <TabBar />
          </div>
        </MemoryRouter>
      </TelegramProvider>
    </AppProvider>
  );
}

export default App;
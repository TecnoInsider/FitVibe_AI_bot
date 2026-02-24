
import React, { ReactNode } from 'react';
import { ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface LayoutProps {
  title: string;
  children: ReactNode;
  canGoBack?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ title, children, canGoBack = false }) => {
  const navigate = useNavigate();

  return (
    <div className="p-4 sm:p-6">
      <header className="mb-6 flex items-center">
        {canGoBack && (
          <button onClick={() => navigate(-1)} className="mr-2 p-2 -ml-2 rounded-full text-emerald-500">
            <ChevronLeft size={28} />
          </button>
        )}
        <h1 className="text-3xl font-bold text-slate-900">{title}</h1>
      </header>
      <div>{children}</div>
    </div>
  );
};

export default Layout;
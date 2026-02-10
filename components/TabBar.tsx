import React from 'react';
import { NavLink } from 'react-router-dom';
import { User, UtensilsCrossed, Dumbbell, BookOpen } from 'lucide-react';

const navItems = [
  { path: '/profile', label: 'Профиль', icon: User },
  { path: '/nutrition', label: 'Питание', icon: UtensilsCrossed },
  { path: '/workouts', label: 'Тренировки', icon: Dumbbell },
  { path: '/catalog', label: 'Каталог', icon: BookOpen },
];

export function TabBar() {
  const baseClasses = "flex flex-col items-center justify-center w-full pt-2 text-xs font-medium transition-colors duration-200";
  const activeClasses = "text-sky-500";
  const inactiveClasses = "text-slate-400";

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-sm border-t border-slate-200/80 pt-0 pb-[calc(1rem+env(safe-area-inset-bottom))]">
      <div className="flex justify-around max-w-lg mx-auto px-4">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `${baseClasses} ${isActive ? activeClasses : inactiveClasses}`}
          >
            {({ isActive }) => (
                <>
                    <item.icon className="w-6 h-6 mb-1" strokeWidth={isActive ? 2.5 : 2} />
                    <span>{item.label}</span>
                </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
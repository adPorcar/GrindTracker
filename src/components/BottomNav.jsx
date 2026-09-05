import React from 'react';
import { Home, PlusCircle, Coffee, User } from 'lucide-react';

export const BottomNav = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'home', label: 'Inicio', icon: Home },
    { id: 'new', label: 'Nueva', icon: PlusCircle },
    { id: 'grinds', label: 'Moliendas', icon: Coffee },
    { id: 'profile', label: 'Mi Perfil', icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-coffee-50/90 dark:bg-darkbg-base/90 backdrop-blur-xl border-t border-coffee-200/60 dark:border-darkbg-border/70 pb-safe transition-colors duration-200">
      <div className="max-w-md mx-auto px-4 h-16 flex items-center justify-around">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center justify-center flex-1 h-full transition-all duration-200 active:scale-90 ${
                isActive
                  ? 'text-terracotta dark:text-terracotta-light'
                  : 'text-coffee-400 hover:text-coffee-600 dark:text-coffee-400 dark:hover:text-coffee-200'
              }`}
            >
              <div
                className={`relative p-1.5 rounded-2xl transition-all ${
                  isActive
                    ? 'bg-coffee-200/50 dark:bg-darkbg-card'
                    : 'bg-transparent'
                }`}
              >
                <Icon
                  className={`w-5 h-5 transition-transform ${
                    isActive ? 'scale-110 stroke-[2.5]' : 'stroke-2'
                  }`}
                />
              </div>
              <span
                className={`text-[10px] mt-0.5 font-medium tracking-tight transition-all ${
                  isActive ? 'font-bold' : 'font-normal'
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

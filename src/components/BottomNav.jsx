import React from 'react';
import { Home, Sliders, PlusCircle, Coffee, User } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export const BottomNav = ({ activeTab, onTabChange }) => {
  const { t } = useLanguage();

  const tabs = [
    { id: 'home', label: t('navHome'), icon: Home },
    { id: 'mills', label: t('navMills'), icon: Sliders },
    { id: 'new', label: t('navNew'), icon: PlusCircle, isHighlight: true },
    { id: 'grinds', label: t('navGrinds'), icon: Coffee },
    { id: 'profile', label: t('navProfile'), icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-coffee-50/95 dark:bg-darkbg-base/95 backdrop-blur-xl border-t border-coffee-200/60 dark:border-darkbg-border/70 pb-safe transition-colors duration-200">
      <div className="max-w-md mx-auto px-2 h-16 flex items-center justify-around">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center justify-center flex-1 h-full transition-all duration-200 active:scale-95 ${
                isActive
                  ? 'text-terracotta dark:text-terracotta-light font-bold'
                  : 'text-coffee-400 hover:text-coffee-600 dark:text-coffee-400 dark:hover:text-coffee-200 font-normal'
              }`}
            >
              <div
                className={`relative p-1.5 rounded-2xl transition-all ${
                  isActive
                    ? 'bg-coffee-200/50 dark:bg-darkbg-card shadow-xs'
                    : 'bg-transparent'
                }`}
              >
                <Icon
                  className={`w-5 h-5 transition-transform ${
                    isActive ? 'scale-110 stroke-[2.4]' : 'stroke-2'
                  }`}
                />
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight truncate max-w-[64px]">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

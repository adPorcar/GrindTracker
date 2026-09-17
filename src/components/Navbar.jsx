import React from 'react';
import { Coffee, Moon, Sun, Languages } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { isConfigured } from '../config';

export const Navbar = () => {
  const { isDark, toggleTheme } = useTheme();
  const { user } = useAuth();
  const { language, toggleLanguage, t } = useLanguage();
  const configured = isConfigured();

  return (
    <header className="sticky top-0 z-30 pt-safe bg-coffee-50/90 dark:bg-darkbg-base/90 backdrop-blur-md border-b border-coffee-200/50 dark:border-darkbg-border/60 transition-colors duration-200">
      <div className="max-w-md mx-auto px-4 h-14 flex items-center justify-between">
        {/* Logo & Brand */}
        <div className="flex items-center space-x-2.5">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-coffee-700 via-coffee-800 to-terracotta flex items-center justify-center text-white shadow-soft">
            <Coffee className="w-5 h-5 text-coffee-100" />
          </div>
          <div>
            <span className="font-extrabold text-base tracking-tight text-coffee-900 dark:text-coffee-100 flex items-center gap-1">
              Grind<span className="text-terracotta dark:text-terracotta-light">Tracker</span>
            </span>
            <div className="flex items-center space-x-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${configured ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'}`}></span>
              <span className="text-[10px] text-coffee-500 dark:text-coffee-400 font-medium">
                {configured ? t('connected') : t('demoMode')}
              </span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2">
          {/* Dynamic i18n Language Toggle Button */}
          <button
            onClick={toggleLanguage}
            title={t('switchLanguage')}
            aria-label={t('switchLanguage')}
            className="h-9 px-2.5 rounded-xl flex items-center gap-1.5 bg-coffee-100/80 hover:bg-coffee-200/80 dark:bg-darkbg-card dark:hover:bg-darkbg-cardHover border border-coffee-200/60 dark:border-darkbg-border text-coffee-700 dark:text-coffee-200 transition-all active:scale-95 shadow-sm text-xs font-bold"
          >
            <Languages className="w-3.5 h-3.5 text-terracotta dark:text-terracotta-light" />
            <span className="uppercase tracking-wide">{language}</span>
          </button>

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            title={t('toggleTheme')}
            aria-label={t('toggleTheme')}
            className="w-9 h-9 rounded-xl flex items-center justify-center bg-coffee-100/80 hover:bg-coffee-200/80 dark:bg-darkbg-card dark:hover:bg-darkbg-cardHover border border-coffee-200/60 dark:border-darkbg-border text-coffee-700 dark:text-coffee-200 transition-all active:scale-95 shadow-sm"
          >
            {isDark ? (
              <Sun className="w-4 h-4 text-amber-300 transition-transform rotate-0 hover:rotate-45" />
            ) : (
              <Moon className="w-4 h-4 text-coffee-600 transition-transform -rotate-12" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};

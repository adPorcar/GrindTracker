import React from 'react';
import { Coffee, Moon, Sun, Sparkles, Wifi } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { isConfigured } from '../config';

export const Navbar = () => {
  const { isDark, toggleTheme } = useTheme();
  const { user } = useAuth();
  const configured = isConfigured();

  return (
    <header className="sticky top-0 z-30 pt-safe bg-coffee-50/85 dark:bg-darkbg-base/85 backdrop-blur-md border-b border-coffee-200/50 dark:border-darkbg-border/60 transition-colors duration-200">
      <div className="max-w-md mx-auto px-4 h-14 flex items-center justify-between">
        {/* Logo & Brand */}
        <div className="flex items-center space-x-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-coffee-600 to-coffee-800 dark:from-terracotta dark:to-coffee-700 flex items-center justify-center text-crema shadow-sm">
            <Coffee className="w-5 h-5 text-coffee-100" />
          </div>
          <div>
            <span className="font-bold text-base tracking-tight text-coffee-900 dark:text-coffee-100 flex items-center gap-1.5">
              Molienda<span className="text-terracotta dark:text-terracotta-light">Café</span>
            </span>
            <div className="flex items-center space-x-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${configured ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'}`}></span>
              <span className="text-[10px] text-coffee-500 dark:text-coffee-400 font-medium">
                {configured ? 'Google Sheets' : 'Modo Demo'}
              </span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2">
          {user && (
            <div className="hidden xs:flex items-center px-2 py-1 rounded-lg bg-coffee-100 dark:bg-darkbg-card border border-coffee-200/60 dark:border-darkbg-border text-xs text-coffee-700 dark:text-coffee-300">
              <span className="font-semibold truncate max-w-[90px]">@{user.username}</span>
            </div>
          )}

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            aria-label={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
            className="w-9 h-9 rounded-xl flex items-center justify-center bg-coffee-100/80 hover:bg-coffee-200/70 dark:bg-darkbg-card dark:hover:bg-darkbg-cardHover border border-coffee-200/60 dark:border-darkbg-border text-coffee-700 dark:text-coffee-200 transition-all active:scale-95 shadow-sm"
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

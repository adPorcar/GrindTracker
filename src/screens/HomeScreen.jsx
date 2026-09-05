import React from 'react';
import { PlusCircle, Coffee, Sparkles, SlidersHorizontal, ArrowRight, Award, Compass, History } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { GrindCard } from '../components/GrindCard';

export const HomeScreen = ({ grinds, onNavigate, onEditGrind, onDeleteGrind }) => {
  const { user } = useAuth();

  // Calculate quick metrics
  const totalGrinds = grinds.length;
  const uniqueMills = new Set(grinds.map(g => g.molino).filter(Boolean)).size;
  
  // Find favorite method
  const methodCounts = grinds.reduce((acc, curr) => {
    acc[curr.metodo] = (acc[curr.metodo] || 0) + 1;
    return acc;
  }, {});
  let favoriteMethod = 'Ninguno aún';
  let maxCount = 0;
  Object.entries(methodCounts).forEach(([method, count]) => {
    if (count > maxCount) {
      maxCount = count;
      favoriteMethod = method;
    }
  });

  const recentGrinds = grinds.slice(0, 2);

  return (
    <div className="space-y-6 pb-6 animate-in fade-in duration-200">
      {/* Personalized Welcome Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-coffee-800 via-coffee-700 to-terracotta rounded-4xl p-6 text-white shadow-soft-lg">
        {/* Subtle decorative circles */}
        <div className="absolute -right-8 -bottom-8 w-40 h-40 rounded-full bg-white/10 pointer-events-none blur-xl" />
        <div className="absolute right-4 top-4 text-white/20 pointer-events-none">
          <Coffee className="w-24 h-24 stroke-[1.2]" />
        </div>

        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-crema text-xs font-semibold backdrop-blur-sm">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Barista Notebook</span>
          </div>

          <h1 className="text-2xl font-black tracking-tight text-white">
            ¡Hola, {user?.username}! ☕
          </h1>
          <p className="text-sm text-coffee-100/90 max-w-[260px] leading-relaxed">
            ¿Qué café vamos a calibrar hoy? Lleva el registro de tus recetas y grados de molienda.
          </p>
        </div>
      </div>

      {/* Two Main Shortcut Buttons requested in specs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Shortcut 1: Nueva Molienda */}
        <button
          onClick={() => onNavigate('new')}
          className="group text-left p-5 rounded-3xl bg-white dark:bg-darkbg-card border-2 border-terracotta/40 hover:border-terracotta dark:border-terracotta/40 dark:hover:border-terracotta shadow-soft hover:shadow-soft-lg transition-all active:scale-98 flex items-center justify-between"
        >
          <div className="flex items-center gap-4">
            <div className="w-13 h-13 rounded-2xl bg-terracotta/15 dark:bg-terracotta/20 text-terracotta flex items-center justify-center p-3 transition-transform group-hover:scale-105">
              <PlusCircle className="w-7 h-7 stroke-[2.5]" />
            </div>
            <div>
              <span className="block text-base font-extrabold text-coffee-900 dark:text-coffee-100">
                Nueva Molienda
              </span>
              <span className="text-xs text-coffee-500 dark:text-coffee-400">
                Registrar nuevo grano o receta
              </span>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-terracotta transition-transform group-hover:translate-x-1" />
        </button>

        {/* Shortcut 2: Mis Moliendas */}
        <button
          onClick={() => onNavigate('grinds')}
          className="group text-left p-5 rounded-3xl bg-white dark:bg-darkbg-card border border-coffee-200/80 hover:border-coffee-400 dark:border-darkbg-border dark:hover:border-coffee-600 shadow-soft hover:shadow-soft-lg transition-all active:scale-98 flex items-center justify-between"
        >
          <div className="flex items-center gap-4">
            <div className="w-13 h-13 rounded-2xl bg-coffee-100 dark:bg-darkbg-input text-coffee-700 dark:text-coffee-300 flex items-center justify-center p-3 transition-transform group-hover:scale-105">
              <Coffee className="w-7 h-7 stroke-[2.2]" />
            </div>
            <div>
              <span className="block text-base font-extrabold text-coffee-900 dark:text-coffee-100">
                Mis Moliendas
              </span>
              <span className="text-xs text-coffee-500 dark:text-coffee-400">
                {totalGrinds} moliendas registradas
              </span>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-coffee-400 transition-transform group-hover:translate-x-1" />
        </button>
      </div>

      {/* Quick Metrics Bar */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-3.5 rounded-2xl bg-white dark:bg-darkbg-card border border-coffee-200/70 dark:border-darkbg-border shadow-sm text-center">
          <span className="text-[11px] font-bold text-coffee-400 uppercase tracking-wider block">
            Moliendas
          </span>
          <span className="text-xl font-black text-coffee-900 dark:text-coffee-100 font-mono">
            {totalGrinds}
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-white dark:bg-darkbg-card border border-coffee-200/70 dark:border-darkbg-border shadow-sm text-center">
          <span className="text-[11px] font-bold text-coffee-400 uppercase tracking-wider block">
            Molinos
          </span>
          <span className="text-xl font-black text-coffee-900 dark:text-coffee-100 font-mono">
            {uniqueMills}
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-white dark:bg-darkbg-card border border-coffee-200/70 dark:border-darkbg-border shadow-sm text-center">
          <span className="text-[11px] font-bold text-coffee-400 uppercase tracking-wider block">
            Favorito
          </span>
          <span className="text-xs font-bold text-terracotta truncate block mt-1">
            {favoriteMethod}
          </span>
        </div>
      </div>

      {/* Recent Moliendas Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-coffee-500 dark:text-coffee-400" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-coffee-700 dark:text-coffee-300">
              Moliendas Recientes
            </h2>
          </div>
          {totalGrinds > 2 && (
            <button
              onClick={() => onNavigate('grinds')}
              className="text-xs font-bold text-terracotta hover:underline"
            >
              Ver todas ({totalGrinds})
            </button>
          )}
        </div>

        {recentGrinds.length > 0 ? (
          <div className="space-y-3">
            {recentGrinds.map((grind) => (
              <GrindCard
                key={grind.id}
                grind={grind}
                onEdit={onEditGrind}
                onDelete={onDeleteGrind}
              />
            ))}
          </div>
        ) : (
          <div className="p-8 text-center rounded-3xl bg-white dark:bg-darkbg-card border border-dashed border-coffee-300 dark:border-darkbg-border">
            <Coffee className="w-10 h-10 text-coffee-300 dark:text-coffee-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-coffee-600 dark:text-coffee-400">
              Aún no tienes moliendas registradas.
            </p>
            <button
              onClick={() => onNavigate('new')}
              className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-terracotta text-white text-xs font-bold shadow-sm"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Registrar primera molienda</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

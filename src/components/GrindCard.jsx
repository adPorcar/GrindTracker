import React from 'react';
import { Settings2, Globe, Calendar, Edit3, Trash2, Quote } from 'lucide-react';

const METHOD_STYLES = {
  'Espresso': {
    bg: 'bg-orange-100 text-orange-800 dark:bg-orange-950/50 dark:text-orange-300 border-orange-200 dark:border-orange-800/40',
    dot: 'bg-orange-500'
  },
  'Mokka': {
    bg: 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 border-amber-200 dark:border-amber-800/40',
    dot: 'bg-amber-500'
  },
  'Filtro': {
    bg: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950/50 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800/40',
    dot: 'bg-yellow-500'
  },
  'Aeropress': {
    bg: 'bg-teal-100 text-teal-800 dark:bg-teal-950/50 dark:text-teal-300 border-teal-200 dark:border-teal-800/40',
    dot: 'bg-teal-500'
  },
  'Prensa Francesa': {
    bg: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/40',
    dot: 'bg-emerald-500'
  },
  'Cold Brew': {
    bg: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/40',
    dot: 'bg-indigo-500'
  },
};

export const GrindCard = ({ grind, onEdit, onDelete }) => {
  const methodStyle = METHOD_STYLES[grind.metodo] || {
    bg: 'bg-coffee-100 text-coffee-800 dark:bg-darkbg-card dark:text-coffee-200 border-coffee-200 dark:border-darkbg-border',
    dot: 'bg-coffee-500'
  };

  return (
    <div className="group relative bg-white dark:bg-darkbg-card rounded-3xl p-5 border border-coffee-200/70 dark:border-darkbg-border shadow-soft dark:shadow-dark-soft hover:shadow-soft-lg transition-all duration-200">
      {/* Header with Method Badge & Grind Number */}
      <div className="flex items-start justify-between gap-3 mb-3.5">
        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${methodStyle.bg}`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${methodStyle.dot}`} />
          {grind.metodo}
        </span>

        {/* Grind Size Display */}
        <div className="flex flex-col items-end">
          <div className="flex items-baseline gap-1 bg-coffee-50 dark:bg-darkbg-input px-3 py-1 rounded-2xl border border-coffee-200/60 dark:border-darkbg-border">
            <span className="text-[10px] uppercase font-bold text-coffee-500 dark:text-coffee-400">
              Paso
            </span>
            <span className="text-lg font-black text-coffee-900 dark:text-coffee-100 font-mono">
              {Number(grind.grado).toFixed(1)}
            </span>
          </div>
        </div>
      </div>

      {/* Main Info */}
      <div className="space-y-1.5 mb-4">
        <div className="flex items-center gap-2 text-coffee-900 dark:text-coffee-100 font-bold text-base">
          <Settings2 className="w-4 h-4 text-terracotta flex-shrink-0" />
          <span className="truncate">{grind.molino}</span>
        </div>

        <div className="flex items-center gap-2 text-sm text-coffee-600 dark:text-coffee-300 font-medium">
          <Globe className="w-4 h-4 text-coffee-400 flex-shrink-0" />
          <span className="truncate">{grind.pais}</span>
        </div>
      </div>

      {/* Tasting notes / Comment */}
      {grind.comentario && (
        <div className="relative mb-4 text-xs text-coffee-600 dark:text-coffee-300 bg-coffee-50/70 dark:bg-darkbg-input/60 p-3 rounded-2xl border border-coffee-200/50 dark:border-darkbg-border/50 italic leading-relaxed">
          "{grind.comentario}"
        </div>
      )}

      {/* Footer Info & Actions */}
      <div className="flex items-center justify-between pt-3 border-t border-coffee-100 dark:border-darkbg-border/60 text-xs text-coffee-400">
        <div className="flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5" />
          <span>{grind.fecha || 'Hoy'}</span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onEdit(grind)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-coffee-100/70 hover:bg-coffee-200 dark:bg-darkbg-input dark:hover:bg-darkbg-cardHover text-coffee-700 dark:text-coffee-200 transition-colors font-medium active:scale-95"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Editar</span>
          </button>
          
          {onDelete && (
            <button
              onClick={() => onDelete(grind.id)}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors active:scale-95"
              aria-label="Eliminar molienda"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

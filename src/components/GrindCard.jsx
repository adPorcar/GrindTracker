import React from 'react';
import { Settings2, Globe, Calendar, Edit3, Trash2, Scale, Thermometer, Flame, Tag } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const METHOD_STYLES = {
  'Espresso': {
    bg: 'bg-orange-100 text-orange-900 dark:bg-orange-950/60 dark:text-orange-300 border-orange-200 dark:border-orange-800/50',
    dot: 'bg-orange-500'
  },
  'Mokka': {
    bg: 'bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800/50',
    dot: 'bg-amber-500'
  },
  'Filtro': {
    bg: 'bg-yellow-100 text-yellow-900 dark:bg-yellow-950/60 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800/50',
    dot: 'bg-yellow-500'
  },
  'Aeropress': {
    bg: 'bg-teal-100 text-teal-900 dark:bg-teal-950/60 dark:text-teal-300 border-teal-200 dark:border-teal-800/50',
    dot: 'bg-teal-500'
  },
  'Prensa Francesa': {
    bg: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/50',
    dot: 'bg-emerald-500'
  },
  'Cold Brew': {
    bg: 'bg-indigo-100 text-indigo-900 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/50',
    dot: 'bg-indigo-500'
  },
};

export const GrindCard = ({ grind, onEdit, onDelete }) => {
  const { t } = useLanguage();

  const methodStyle = METHOD_STYLES[grind.metodo] || {
    bg: 'bg-coffee-100 text-coffee-800 dark:bg-darkbg-card dark:text-coffee-200 border-coffee-200 dark:border-darkbg-border',
    dot: 'bg-coffee-500'
  };

  const hasEspressoRatio = grind.metodo === 'Espresso' && grind.cafe_in && grind.cafe_out;
  const ratioCalc = hasEspressoRatio
    ? (parseFloat(grind.cafe_out) / parseFloat(grind.cafe_in)).toFixed(1)
    : null;

  return (
    <div className="group relative bg-white dark:bg-darkbg-card rounded-3xl p-5 border border-coffee-200/70 dark:border-darkbg-border shadow-soft dark:shadow-dark-soft hover:shadow-soft-lg transition-all duration-200">
      {/* Header: Method Badge, Process Badge & Grind Size Display */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${methodStyle.bg}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${methodStyle.dot}`} />
            {grind.metodo}
          </span>

          {grind.proceso && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-coffee-100/70 dark:bg-darkbg-input text-coffee-700 dark:text-coffee-300 border border-coffee-200/60 dark:border-darkbg-border">
              {grind.proceso}
            </span>
          )}

          {grind.variedad && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-coffee-50 dark:bg-darkbg-input text-coffee-600 dark:text-coffee-400 border border-coffee-200/40 dark:border-darkbg-border/60">
              {grind.variedad}
            </span>
          )}
        </div>

        {/* Grind Size Display */}
        <div className="flex flex-col items-end flex-shrink-0">
          <div className="flex items-baseline gap-1 bg-coffee-50 dark:bg-darkbg-input px-3 py-1 rounded-2xl border border-coffee-200/60 dark:border-darkbg-border">
            <span className="text-[10px] uppercase font-bold text-coffee-500 dark:text-coffee-400">
              {t('step')}
            </span>
            <span className="text-base font-black text-coffee-900 dark:text-coffee-100 font-mono">
              {Number(grind.grado).toFixed(1)}
            </span>
          </div>
        </div>
      </div>

      {/* Main Coffee & Roaster Info */}
      <div className="space-y-1 mb-3">
        <h3 className="text-base font-black text-coffee-900 dark:text-coffee-100 tracking-tight line-clamp-1">
          {grind.nombre_cafe || grind.pais || 'Café de Especialidad'}
        </h3>
        
        <div className="flex items-center gap-3 text-xs text-coffee-600 dark:text-coffee-300">
          {grind.tostadero && (
            <span className="font-semibold text-terracotta dark:text-terracotta-light truncate">
              {grind.tostadero}
            </span>
          )}
          {grind.pais && (
            <div className="flex items-center gap-1">
              <Globe className="w-3 h-3 text-coffee-400" />
              <span className="truncate">{grind.pais}</span>
            </div>
          )}
        </div>
      </div>

      {/* Mill name & extra parameters row */}
      <div className="flex flex-wrap items-center gap-2 mb-3 text-xs">
        {/* Mill */}
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-coffee-50 dark:bg-darkbg-input/60 border border-coffee-200/50 dark:border-darkbg-border/50 text-coffee-700 dark:text-coffee-300 font-medium">
          <Settings2 className="w-3.5 h-3.5 text-terracotta" />
          <span className="truncate max-w-[130px]">{grind.molino}</span>
        </div>

        {/* Espresso In/Out Ratio Pill */}
        {hasEspressoRatio && (
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-orange-50 dark:bg-orange-950/30 border border-orange-200/60 dark:border-orange-800/40 text-orange-900 dark:text-orange-200 font-mono font-bold text-[11px]">
            <Scale className="w-3 h-3 text-orange-600" />
            <span>{grind.cafe_in}g → {grind.cafe_out}g (1:{ratioCalc})</span>
          </div>
        )}

        {/* Water temp */}
        {grind.temp_agua && (
          <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-coffee-50 dark:bg-darkbg-input/60 border border-coffee-200/50 dark:border-darkbg-border/50 text-coffee-700 dark:text-coffee-300 font-mono text-[11px]">
            <Thermometer className="w-3 h-3 text-terracotta" />
            <span>{grind.temp_agua}°C</span>
          </div>
        )}
      </div>

      {/* Flavor profile tags */}
      {grind.perfil_sabor && (
        <div className="mb-3 flex items-start gap-1.5 text-xs text-coffee-600 dark:text-coffee-300">
          <Tag className="w-3.5 h-3.5 text-coffee-400 mt-0.5 flex-shrink-0" />
          <p className="line-clamp-2 italic text-[11px] leading-relaxed">
            {grind.perfil_sabor}
          </p>
        </div>
      )}

      {/* Comments / Tasting notes */}
      {grind.comentario && (
        <div className="mb-3 text-xs text-coffee-600 dark:text-coffee-300 bg-coffee-50/70 dark:bg-darkbg-input/60 p-2.5 rounded-2xl border border-coffee-200/50 dark:border-darkbg-border/50 italic leading-relaxed">
          "{grind.comentario}"
        </div>
      )}

      {/* Footer: Date & Actions */}
      <div className="flex items-center justify-between pt-3 border-t border-coffee-100 dark:border-darkbg-border/60 text-xs text-coffee-400">
        <div className="flex items-center gap-1.5 text-[11px]">
          <Calendar className="w-3.5 h-3.5" />
          <span>{grind.fecha || t('today')}</span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onEdit(grind)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-coffee-100/70 hover:bg-coffee-200 dark:bg-darkbg-input dark:hover:bg-darkbg-cardHover text-coffee-700 dark:text-coffee-200 transition-colors font-semibold text-xs active:scale-95"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>{t('editGrindTitle')}</span>
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

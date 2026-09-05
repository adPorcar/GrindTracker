import React, { useState } from 'react';
import { Settings2, Globe, Coffee, Hash, MessageSquare, Plus, CheckCircle2, Minus, Sparkles } from 'lucide-react';

const COFFEE_METHODS = [
  'Espresso',
  'Mokka',
  'Filtro',
  'Aeropress',
  'Prensa Francesa',
  'Cold Brew'
];

const DEFAULT_MILLS = [
  'Comandante C40',
  'Eureka Mignon Specialita',
  '1Zpresso JX-Pro',
  'Timemore C2 / C3',
  'Baratza Encore',
  'Kingrinder K6',
  'Fellow Ode Gen 2',
  'DF64 Gen 2'
];

const POPULAR_COUNTRIES = [
  'Colombia',
  'Etiopía',
  'Kenia',
  'Guatemala',
  'Costa Rica',
  'Brasil',
  'Panamá',
  'Perú'
];

export const NewGrindScreen = ({ previousGrinds, onSave, onCancel }) => {
  // Extract unique mills already recorded + defaults
  const userMills = Array.from(new Set(previousGrinds.map(g => g.molino).filter(Boolean)));
  const allSuggestedMills = Array.from(new Set([...userMills, ...DEFAULT_MILLS]));

  const [molino, setMolino] = useState(userMills[0] || 'Comandante C40');
  const [metodo, setMetodo] = useState('Espresso');
  const [pais, setPais] = useState('');
  const [grado, setGrado] = useState(3.5);
  const [comentario, setComentario] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleStepper = (delta) => {
    setGrado(prev => {
      const val = parseFloat((parseFloat(prev || 0) + delta).toFixed(1));
      return val >= 0 ? val : 0;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!molino.trim() || !metodo || !pais.trim() || grado === '') return;

    setSubmitting(true);
    try {
      await onSave({
        molino: molino.trim(),
        metodo,
        pais: pais.trim(),
        grado: parseFloat(grado),
        comentario: comentario.trim(),
        fecha: new Date().toLocaleDateString('es-ES')
      });
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
      }, 2000);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto space-y-6 pb-6 animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-coffee-900 dark:text-coffee-100">
            Nueva Molienda
          </h1>
          <p className="text-xs text-coffee-500 dark:text-coffee-400 mt-0.5">
            Calibra y anota el punto exacto para esta extracción
          </p>
        </div>
      </div>

      {showSuccess && (
        <div className="p-4 rounded-3xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 flex items-center gap-3 text-emerald-800 dark:text-emerald-200 text-sm animate-in zoom-in-95">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-500" />
          <span className="font-bold">¡Molienda guardada correctamente en tu hoja!</span>
        </div>
      )}

      {/* Form Container */}
      <form onSubmit={handleSubmit} className="bg-white dark:bg-darkbg-card rounded-4xl p-6 border border-coffee-200/80 dark:border-darkbg-border shadow-soft dark:shadow-dark-soft space-y-5">
        {/* 1. Molino con autocompletado y sugerencias rápidas */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-bold text-coffee-800 dark:text-coffee-200 uppercase tracking-wider flex items-center gap-1.5">
              <Settings2 className="w-3.5 h-3.5 text-terracotta" />
              <span>Molino / Molinillo *</span>
            </label>
            <span className="text-[10px] text-coffee-400">Escribe o selecciona</span>
          </div>

          <input
            type="text"
            list="mills-list"
            value={molino}
            onChange={(e) => setMolino(e.target.value)}
            placeholder="Ej. Comandante C40, Eureka Mignon..."
            required
            className="w-full px-4 py-3 rounded-2xl bg-coffee-50/50 dark:bg-darkbg-input border border-coffee-200 dark:border-darkbg-border text-coffee-900 dark:text-coffee-100 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-terracotta/40 focus:border-terracotta transition-all"
          />
          <datalist id="mills-list">
            {allSuggestedMills.map((m, idx) => (
              <option key={idx} value={m} />
            ))}
          </datalist>

          {/* Quick pills for mills */}
          <div className="flex flex-wrap gap-1.5 mt-2">
            {allSuggestedMills.slice(0, 4).map((m, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setMolino(m)}
                className={`text-[11px] px-2.5 py-1 rounded-xl transition-all ${
                  molino === m
                    ? 'bg-coffee-800 dark:bg-terracotta text-white font-bold'
                    : 'bg-coffee-100/70 hover:bg-coffee-200 dark:bg-darkbg-input dark:hover:bg-darkbg-cardHover text-coffee-600 dark:text-coffee-300 font-medium'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        {/* 2. Método de Café (Dropdown obligatorio) */}
        <div>
          <label className="text-xs font-bold text-coffee-800 dark:text-coffee-200 uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
            <Coffee className="w-3.5 h-3.5 text-terracotta" />
            <span>Método de Café *</span>
          </label>
          <div className="relative">
            <select
              value={metodo}
              onChange={(e) => setMetodo(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-2xl bg-coffee-50/50 dark:bg-darkbg-input border border-coffee-200 dark:border-darkbg-border text-coffee-900 dark:text-coffee-100 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-terracotta/40 focus:border-terracotta transition-all appearance-none cursor-pointer"
            >
              {COFFEE_METHODS.map((m) => (
                <option key={m} value={m} className="dark:bg-darkbg-card py-1">
                  {m}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-coffee-500">
              ▼
            </div>
          </div>
        </div>

        {/* 3. País de la Variedad */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-bold text-coffee-800 dark:text-coffee-200 uppercase tracking-wider flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-terracotta" />
              <span>País / Variedad de Especialidad *</span>
            </label>
          </div>

          <input
            type="text"
            list="countries-list"
            value={pais}
            onChange={(e) => setPais(e.target.value)}
            placeholder="Ej. Etiopía Yirgacheffe, Colombia Geisha..."
            required
            className="w-full px-4 py-3 rounded-2xl bg-coffee-50/50 dark:bg-darkbg-input border border-coffee-200 dark:border-darkbg-border text-coffee-900 dark:text-coffee-100 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-terracotta/40 focus:border-terracotta transition-all"
          />
          <datalist id="countries-list">
            {POPULAR_COUNTRIES.map((c, idx) => (
              <option key={idx} value={c} />
            ))}
          </datalist>

          {/* Quick country pills */}
          <div className="flex flex-wrap gap-1.5 mt-2">
            {POPULAR_COUNTRIES.slice(0, 5).map((c, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setPais(c)}
                className={`text-[11px] px-2.5 py-0.5 rounded-xl transition-all ${
                  pais.toLowerCase().includes(c.toLowerCase())
                    ? 'bg-terracotta text-white font-bold'
                    : 'bg-coffee-100/70 hover:bg-coffee-200 dark:bg-darkbg-input text-coffee-600 dark:text-coffee-400 font-medium'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* 4. Grado de Molienda (Decimal Stepper) */}
        <div>
          <label className="text-xs font-bold text-coffee-800 dark:text-coffee-200 uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
            <Hash className="w-3.5 h-3.5 text-terracotta" />
            <span>Grado de Molienda (Paso / Clics) *</span>
          </label>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => handleStepper(-0.5)}
              className="w-12 h-12 rounded-2xl bg-coffee-100 hover:bg-coffee-200 dark:bg-darkbg-input dark:hover:bg-darkbg-cardHover text-coffee-800 dark:text-coffee-200 flex items-center justify-center font-bold text-lg transition-transform active:scale-90 border border-coffee-200/80 dark:border-darkbg-border"
              aria-label="Restar medio punto"
            >
              <Minus className="w-5 h-5" />
            </button>

            <div className="flex-1 relative">
              <input
                type="number"
                step="0.1"
                min="0"
                value={grado}
                onChange={(e) => setGrado(e.target.value)}
                required
                className="w-full text-center py-3 rounded-2xl bg-coffee-50/50 dark:bg-darkbg-input border border-coffee-200 dark:border-darkbg-border text-coffee-900 dark:text-coffee-100 text-xl font-mono font-black focus:outline-none focus:ring-2 focus:ring-terracotta/40 focus:border-terracotta transition-all"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] uppercase font-bold text-coffee-400">
                Paso
              </span>
            </div>

            <button
              type="button"
              onClick={() => handleStepper(0.5)}
              className="w-12 h-12 rounded-2xl bg-coffee-100 hover:bg-coffee-200 dark:bg-darkbg-input dark:hover:bg-darkbg-cardHover text-coffee-800 dark:text-coffee-200 flex items-center justify-center font-bold text-lg transition-transform active:scale-90 border border-coffee-200/80 dark:border-darkbg-border"
              aria-label="Sumar medio punto"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>

          <div className="flex justify-between items-center px-1 mt-1 text-[11px] text-coffee-400">
            <span>Fino (Espresso)</span>
            <span>Medio (Filtro)</span>
            <span>Grueso (Cold Brew)</span>
          </div>
        </div>

        {/* 5. Comentario / Notas de Cata */}
        <div>
          <label className="text-xs font-bold text-coffee-800 dark:text-coffee-200 uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
            <MessageSquare className="w-3.5 h-3.5 text-terracotta" />
            <span>Comentarios y Receta (Opcional)</span>
          </label>
          <textarea
            rows="3"
            value={comentario}
            onChange={(e) => setComentario(e.target.value)}
            placeholder="Ej. Ratio 18g in / 36g out en 27s. Notas de cata a jazmín, miel y durazno..."
            className="w-full px-4 py-3 rounded-2xl bg-coffee-50/50 dark:bg-darkbg-input border border-coffee-200 dark:border-darkbg-border text-coffee-900 dark:text-coffee-100 text-sm focus:outline-none focus:ring-2 focus:ring-terracotta/40 focus:border-terracotta transition-all resize-none"
          />
        </div>

        {/* Action Submit */}
        <button
          type="submit"
          disabled={submitting}
          className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-coffee-700 to-terracotta hover:from-coffee-800 hover:to-terracotta-dark text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50"
        >
          {submitting ? (
            <span className="inline-flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Guardando en Google Sheets...</span>
            </span>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Guardar Molienda</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
};

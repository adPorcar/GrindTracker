import React, { useState, useEffect, useMemo } from 'react';
import {
  Settings2,
  Globe,
  Coffee,
  Hash,
  MessageSquare,
  Plus,
  CheckCircle2,
  Minus,
  Sparkles,
  Flame,
  Scale,
  Thermometer,
  Tag,
  AlertTriangle
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const COFFEE_METHODS = [
  'Espresso',
  'Mokka',
  'Filtro',
  'Aeropress',
  'Prensa Francesa',
  'Cold Brew'
];

const COFFEE_VARIETIES = [
  'Arábica',
  'Robusta',
  'Libérica',
  'Excelsa'
];

const COFFEE_PROCESSES = [
  'Natural',
  'Lavado',
  'Honey',
  'Anaeróbico',
  'Maceración Carbónica',
  'Koji'
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

const SUGGESTED_FLAVORS = [
  'Floral',
  'Frutal',
  'Cítrico',
  'Chocolate',
  'Caramelo',
  'Frutos Rojos',
  'Jazmín',
  'Miel'
];

export const NewGrindScreen = ({ mills = [], onSave, onNavigateMills }) => {
  const { t } = useLanguage();

  // Selected mill state
  const [selectedMillId, setSelectedMillId] = useState(mills[0]?.id || '');
  const activeMill = useMemo(() => {
    return mills.find((m) => String(m.id) === String(selectedMillId)) || mills[0] || null;
  }, [mills, selectedMillId]);

  // Form fields
  const [nombreCafe, setNombreCafe] = useState('');
  const [tostadero, setTostadero] = useState('');
  const [metodo, setMetodo] = useState('Espresso');
  const [variedad, setVariedad] = useState('Arábica');
  const [proceso, setProceso] = useState('Lavado');
  const [pais, setPais] = useState('');
  const [perfilSabor, setPerfilSabor] = useState('');
  const [tempAgua, setTempAgua] = useState('');
  
  // Espresso conditional fields
  const [cafeIn, setCafeIn] = useState('18.0');
  const [cafeOut, setCafeOut] = useState('36.0');

  // Grind settings — for dial grinders we use an internal integer step index
  const [grado, setGrado] = useState(12.0);
  const [dialStep, setDialStep] = useState(0); // internal index for dial: 0..totalSteps-1
  const [comentario, setComentario] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Sync selected mill when mills list updates
  useEffect(() => {
    if (!selectedMillId && mills.length > 0) {
      setSelectedMillId(mills[0].id);
    }
  }, [mills, selectedMillId]);

  // Calculate dynamic slider configuration according to selected mill
  const sliderConfig = useMemo(() => {
    if (!activeMill) {
      return { min: 0, max: 40, step: 0.5, unit: t('grindSettingUnitClicks'), isDial: false, stepsPerNum: 0, totalNumbers: 0 };
    }

    if (activeMill.tipo === 'dial') {
      const maxNum = Number(activeMill.total_numeros) || 10;
      const stepsPerNum = Number(activeMill.pasos_por_numero) || 4;
      // Total internal positions: number 1 step 1 through number maxNum step stepsPerNum
      const totalPositions = maxNum * stepsPerNum;
      return {
        min: 0,             // internal index min (maps to 1.1)
        max: totalPositions - 1, // internal index max (maps to maxNum.stepsPerNum)
        step: 1,            // each click = 1 internal step
        unit: t('grindSettingUnitDial'),
        isDial: true,
        stepsPerNum,
        totalNumbers: maxNum
      };
    } else {
      const maxClicks = Number(activeMill.total_clicks) || 40;
      return {
        min: 0,
        max: maxClicks,
        step: 0.5,
        unit: t('grindSettingUnitClicks'),
        isDial: false,
        stepsPerNum: 0,
        totalNumbers: 0
      };
    }
  }, [activeMill, t]);

  /**
   * Converts an internal dial step index to display format "x.y"
   * where x = integer number (1-based) and y = sub-step (1-based).
   * E.g. with stepsPerNum=4: index 0 → "1.1", 1 → "1.2", 3 → "1.4", 4 → "2.1"
   */
  const formatDialValue = (index, stepsPerNum) => {
    const intPart = Math.floor(index / stepsPerNum) + 1;
    const subStep = (index % stepsPerNum) + 1;
    return `${intPart}.${subStep}`;
  };

  /**
   * Parses a dial display string "x.y" back to internal step index.
   * "1.1" → 0, "1.4" → 3, "2.1" → 4  (with stepsPerNum=4)
   */
  const parseDialValue = (displayStr, stepsPerNum) => {
    const parts = String(displayStr).split('.');
    const intPart = parseInt(parts[0]) || 1;
    const subStep = parseInt(parts[1]) || 1;
    return (intPart - 1) * stepsPerNum + (subStep - 1);
  };

  // When active mill changes, reset dial step index or clamp grado
  useEffect(() => {
    if (activeMill) {
      if (sliderConfig.isDial) {
        // Reset to first position when switching to a dial mill
        setDialStep(0);
      } else {
        setGrado((prev) => {
          const num = parseFloat(prev);
          if (num > sliderConfig.max) return sliderConfig.max;
          if (num < sliderConfig.min) return sliderConfig.min;
          return prev;
        });
      }
    }
  }, [activeMill, sliderConfig]);

  // Step button handler
  const handleStepper = (delta) => {
    if (sliderConfig.isDial) {
      setDialStep((prev) => {
        const next = prev + delta;
        if (next < sliderConfig.min) return sliderConfig.min;
        if (next > sliderConfig.max) return sliderConfig.max;
        return next;
      });
    } else {
      setGrado((prev) => {
        const step = sliderConfig.step || 0.5;
        const nextVal = parseFloat((parseFloat(prev || 0) + delta * step).toFixed(2));
        if (nextVal < sliderConfig.min) return sliderConfig.min;
        if (nextVal > sliderConfig.max) return sliderConfig.max;
        return nextVal;
      });
    }
  };

  // Add flavor chip
  const addFlavorChip = (flavor) => {
    if (!perfilSabor.trim()) {
      setPerfilSabor(flavor);
    } else if (!perfilSabor.toLowerCase().includes(flavor.toLowerCase())) {
      setPerfilSabor((prev) => `${prev}, ${flavor}`);
    }
  };

  // Ratio calculation for espresso
  const espressoRatio = useMemo(() => {
    const inVal = parseFloat(cafeIn);
    const outVal = parseFloat(cafeOut);
    if (inVal > 0 && outVal > 0) {
      return (outVal / inVal).toFixed(1);
    }
    return null;
  }, [cafeIn, cafeOut]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!activeMill) return;
    if (!nombreCafe.trim() || !tostadero.trim() || !pais.trim()) return;

    if (metodo === 'Espresso') {
      if (!cafeIn || !cafeOut || parseFloat(cafeIn) <= 0 || parseFloat(cafeOut) <= 0) {
        alert('Para el método Espresso, los campos Café IN y Café OUT son obligatorios.');
        return;
      }
    }

    setSubmitting(true);
    try {
      // For dial grinders, save the display notation (e.g. "3.2") as the grado
      const gradoToSave = sliderConfig.isDial
        ? formatDialValue(dialStep, sliderConfig.stepsPerNum)
        : parseFloat(grado);

      await onSave({
        molino: activeMill.nombre,
        nombre_cafe: nombreCafe.trim(),
        tostadero: tostadero.trim(),
        metodo,
        variedad,
        proceso,
        pais: pais.trim(),
        perfil_sabor: perfilSabor.trim(),
        temp_agua: tempAgua ? parseFloat(tempAgua) : null,
        cafe_in: metodo === 'Espresso' ? parseFloat(cafeIn) : null,
        cafe_out: metodo === 'Espresso' ? parseFloat(cafeOut) : null,
        grado: gradoToSave,
        comentario: comentario.trim(),
        fecha: new Date().toLocaleDateString('es-ES')
      });

      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2500);

      // Reset specific fields but keep favorites
      setNombreCafe('');
      setPerfilSabor('');
      setComentario('');
    } finally {
      setSubmitting(false);
    }
  };

  // If no mills are registered yet, show clear warning with shortcut
  if (!mills || mills.length === 0) {
    return (
      <div className="max-w-md mx-auto p-6 space-y-4 text-center bg-white dark:bg-darkbg-card rounded-4xl border border-coffee-200 dark:border-darkbg-border shadow-soft">
        <div className="w-14 h-14 rounded-2xl bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-300 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-7 h-7" />
        </div>
        <h2 className="text-lg font-bold text-coffee-900 dark:text-coffee-100">
          {t('noMillsWarning')}
        </h2>
        <p className="text-xs text-coffee-600 dark:text-coffee-400">
          Para calibrar el grado exacto de molienda necesitas primero registrar al menos un molino (con ajuste Clicks o Dial).
        </p>
        <button
          onClick={onNavigateMills}
          className="mt-2 inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-terracotta text-white text-xs font-bold shadow-soft"
        >
          <Settings2 className="w-4 h-4" />
          <span>{t('goToMills')}</span>
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto space-y-5 pb-6 animate-in fade-in duration-200">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-black tracking-tight text-coffee-900 dark:text-coffee-100">
          {t('newGrindTitle')}
        </h1>
        <p className="text-xs text-coffee-500 dark:text-coffee-400 mt-0.5">
          {t('newGrindSubtitle')}
        </p>
      </div>

      {showSuccess && (
        <div className="p-4 rounded-3xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 flex items-center gap-3 text-emerald-800 dark:text-emerald-200 text-sm animate-in zoom-in-95">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-500" />
          <span className="font-bold">{t('grindSavedSuccess')}</span>
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="bg-white dark:bg-darkbg-card rounded-4xl p-6 border border-coffee-200/80 dark:border-darkbg-border shadow-soft dark:shadow-dark-soft space-y-5">
        
        {/* 1. Selección Dinámica de Molino */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-bold text-coffee-800 dark:text-coffee-200 uppercase tracking-wider flex items-center gap-1.5">
              <Settings2 className="w-3.5 h-3.5 text-terracotta" />
              <span>{t('selectMillLabel')}</span>
            </label>
            <span className="text-[10px] text-terracotta font-semibold">
              {activeMill?.tipo === 'dial' ? t('millTypeDial') : t('millTypeClicks')}
            </span>
          </div>

          <div className="relative">
            <select
              value={selectedMillId}
              onChange={(e) => setSelectedMillId(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-2xl bg-coffee-50/50 dark:bg-darkbg-input border border-coffee-200 dark:border-darkbg-border text-coffee-900 dark:text-coffee-100 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-terracotta/40 focus:border-terracotta transition-all appearance-none cursor-pointer"
            >
              {mills.map((m) => (
                <option key={m.id} value={m.id} className="dark:bg-darkbg-card">
                  {m.nombre} ({m.tipo === 'dial' ? `Dial 1-${m.total_numeros}` : `${m.total_clicks} Clicks`})
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-coffee-400">
              ▼
            </div>
          </div>
        </div>

        {/* 2. Barra Progresiva / Range Slider Adaptativo del Grado de Molienda */}
        <div className="bg-coffee-50/70 dark:bg-darkbg-input/60 p-4 rounded-3xl border border-coffee-200/60 dark:border-darkbg-border/60 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-coffee-800 dark:text-coffee-200 uppercase tracking-wider flex items-center gap-1.5">
              <Hash className="w-3.5 h-3.5 text-terracotta" />
              <span>{t('grindSettingLabel')}</span>
            </label>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-xl bg-terracotta/15 text-terracotta dark:bg-terracotta/20 dark:text-terracotta-light font-mono">
              {sliderConfig.isDial
                ? formatDialValue(dialStep, sliderConfig.stepsPerNum)
                : Number(grado).toFixed(1)
              } {sliderConfig.unit}
            </span>
          </div>

          {/* Stepper + Input display */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => handleStepper(-1)}
              className="w-11 h-11 rounded-2xl bg-white dark:bg-darkbg-card hover:bg-coffee-100 dark:hover:bg-darkbg-cardHover text-coffee-800 dark:text-coffee-200 flex items-center justify-center font-bold text-lg transition-transform active:scale-90 border border-coffee-200/80 dark:border-darkbg-border shadow-xs"
              aria-label="Restar paso"
            >
              <Minus className="w-4 h-4" />
            </button>

            <div className="flex-1 relative">
              {sliderConfig.isDial ? (
                /* Dial: show formatted x.y value as read-only styled display */
                <div
                  className="w-full text-center py-2.5 rounded-2xl bg-white dark:bg-darkbg-card border border-coffee-200 dark:border-darkbg-border text-coffee-900 dark:text-coffee-100 text-xl font-mono font-black shadow-xs select-none"
                >
                  {formatDialValue(dialStep, sliderConfig.stepsPerNum)}
                </div>
              ) : (
                /* Clicks: standard numeric input */
                <input
                  type="number"
                  step={sliderConfig.step}
                  min={sliderConfig.min}
                  max={sliderConfig.max}
                  value={grado}
                  onChange={(e) => setGrado(e.target.value === '' ? '' : parseFloat(e.target.value))}
                  required
                  className="w-full text-center py-2.5 rounded-2xl bg-white dark:bg-darkbg-card border border-coffee-200 dark:border-darkbg-border text-coffee-900 dark:text-coffee-100 text-xl font-mono font-black focus:outline-none focus:ring-2 focus:ring-terracotta/40 transition-all shadow-xs"
                />
              )}
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] uppercase font-bold text-coffee-400">
                {sliderConfig.unit}
              </span>
            </div>

            <button
              type="button"
              onClick={() => handleStepper(1)}
              className="w-11 h-11 rounded-2xl bg-white dark:bg-darkbg-card hover:bg-coffee-100 dark:hover:bg-darkbg-cardHover text-coffee-800 dark:text-coffee-200 flex items-center justify-center font-bold text-lg transition-transform active:scale-90 border border-coffee-200/80 dark:border-darkbg-border shadow-xs"
              aria-label="Sumar paso"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Progressive Range Slider */}
          <div className="pt-1">
            {sliderConfig.isDial ? (
              /* Dial: slider over internal integer steps */
              <>
                <input
                  type="range"
                  min={sliderConfig.min}
                  max={sliderConfig.max}
                  step={1}
                  value={dialStep}
                  onChange={(e) => setDialStep(parseInt(e.target.value))}
                  className="w-full h-2.5 bg-coffee-200 dark:bg-darkbg-border rounded-lg appearance-none cursor-pointer accent-terracotta"
                />
                <div className="flex justify-between items-center text-[10px] text-coffee-400 font-mono mt-1 px-1">
                  <span>{formatDialValue(0, sliderConfig.stepsPerNum)}</span>
                  <span>{t('grindMedium')}</span>
                  <span>{formatDialValue(sliderConfig.max, sliderConfig.stepsPerNum)}</span>
                </div>
              </>
            ) : (
              /* Clicks: standard float slider */
              <>
                <input
                  type="range"
                  min={sliderConfig.min}
                  max={sliderConfig.max}
                  step={sliderConfig.step}
                  value={grado || sliderConfig.min}
                  onChange={(e) => setGrado(parseFloat(e.target.value))}
                  className="w-full h-2.5 bg-coffee-200 dark:bg-darkbg-border rounded-lg appearance-none cursor-pointer accent-terracotta"
                />
                <div className="flex justify-between items-center text-[10px] text-coffee-400 font-mono mt-1 px-1">
                  <span>Min: {sliderConfig.min}</span>
                  <span>{t('grindMedium')}</span>
                  <span>Max: {sliderConfig.max}</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* 3. Nombre del Café y Tostadero */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-coffee-800 dark:text-coffee-200 uppercase tracking-wider mb-1.5">
              {t('coffeeNameLabel')}
            </label>
            <input
              type="text"
              value={nombreCafe}
              onChange={(e) => setNombreCafe(e.target.value)}
              placeholder={t('coffeeNamePlaceholder')}
              required
              className="w-full px-4 py-3 rounded-2xl bg-coffee-50/50 dark:bg-darkbg-input border border-coffee-200 dark:border-darkbg-border text-coffee-900 dark:text-coffee-100 text-sm font-medium focus:ring-2 focus:ring-terracotta/40 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-coffee-800 dark:text-coffee-200 uppercase tracking-wider mb-1.5">
              {t('roasterLabel')}
            </label>
            <input
              type="text"
              value={tostadero}
              onChange={(e) => setTostadero(e.target.value)}
              placeholder={t('roasterPlaceholder')}
              required
              className="w-full px-4 py-3 rounded-2xl bg-coffee-50/50 dark:bg-darkbg-input border border-coffee-200 dark:border-darkbg-border text-coffee-900 dark:text-coffee-100 text-sm font-medium focus:ring-2 focus:ring-terracotta/40 focus:outline-none"
            />
          </div>
        </div>

        {/* 4. Método, Variedad y Proceso */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Método */}
          <div>
            <label className="block text-xs font-bold text-coffee-800 dark:text-coffee-200 uppercase tracking-wider mb-1.5">
              {t('methodLabel')}
            </label>
            <select
              value={metodo}
              onChange={(e) => setMetodo(e.target.value)}
              required
              className="w-full px-3 py-3 rounded-2xl bg-coffee-50/50 dark:bg-darkbg-input border border-coffee-200 dark:border-darkbg-border text-coffee-900 dark:text-coffee-100 text-sm font-semibold focus:ring-2 focus:ring-terracotta/40 cursor-pointer"
            >
              {COFFEE_METHODS.map((m) => (
                <option key={m} value={m} className="dark:bg-darkbg-card">
                  {m}
                </option>
              ))}
            </select>
          </div>

          {/* Variedad */}
          <div>
            <label className="block text-xs font-bold text-coffee-800 dark:text-coffee-200 uppercase tracking-wider mb-1.5">
              {t('varietyLabel')}
            </label>
            <select
              value={variedad}
              onChange={(e) => setVariedad(e.target.value)}
              required
              className="w-full px-3 py-3 rounded-2xl bg-coffee-50/50 dark:bg-darkbg-input border border-coffee-200 dark:border-darkbg-border text-coffee-900 dark:text-coffee-100 text-sm font-semibold focus:ring-2 focus:ring-terracotta/40 cursor-pointer"
            >
              {COFFEE_VARIETIES.map((v) => (
                <option key={v} value={v} className="dark:bg-darkbg-card">
                  {v}
                </option>
              ))}
            </select>
          </div>

          {/* Proceso */}
          <div>
            <label className="block text-xs font-bold text-coffee-800 dark:text-coffee-200 uppercase tracking-wider mb-1.5">
              {t('processLabel')}
            </label>
            <select
              value={proceso}
              onChange={(e) => setProceso(e.target.value)}
              required
              className="w-full px-3 py-3 rounded-2xl bg-coffee-50/50 dark:bg-darkbg-input border border-coffee-200 dark:border-darkbg-border text-coffee-900 dark:text-coffee-100 text-sm font-semibold focus:ring-2 focus:ring-terracotta/40 cursor-pointer"
            >
              {COFFEE_PROCESSES.map((p) => (
                <option key={p} value={p} className="dark:bg-darkbg-card">
                  {p}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 5. LÓGICA CONDICIONAL PARA ESPRESSO (Café IN / Café OUT) */}
        {metodo === 'Espresso' && (
          <div className="bg-orange-50/80 dark:bg-orange-950/20 border-2 border-orange-200 dark:border-orange-800/40 rounded-3xl p-4 space-y-3 animate-in slide-in-from-top-2 duration-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-orange-900 dark:text-orange-300 flex items-center gap-1.5">
                <Scale className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                <span>{t('espressoSectionTitle')}</span>
              </span>
              {espressoRatio && (
                <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-orange-200 dark:bg-orange-900/60 text-orange-900 dark:text-orange-200">
                  {t('ratioLabel', { ratio: espressoRatio })}
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-orange-800 dark:text-orange-300 mb-1">
                  {t('espressoCoffeeInLabel')}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    value={cafeIn}
                    onChange={(e) => setCafeIn(e.target.value)}
                    placeholder={t('espressoCoffeeInPlaceholder')}
                    required
                    className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-darkbg-input border border-orange-300/70 dark:border-orange-800/50 text-coffee-900 dark:text-coffee-100 font-mono font-bold text-sm focus:ring-2 focus:ring-orange-400 focus:outline-none"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-coffee-400">
                    g
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-orange-800 dark:text-orange-300 mb-1">
                  {t('espressoCoffeeOutLabel')}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    value={cafeOut}
                    onChange={(e) => setCafeOut(e.target.value)}
                    placeholder={t('espressoCoffeeOutPlaceholder')}
                    required
                    className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-darkbg-input border border-orange-300/70 dark:border-orange-800/50 text-coffee-900 dark:text-coffee-100 font-mono font-bold text-sm focus:ring-2 focus:ring-orange-400 focus:outline-none"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-coffee-400">
                    g
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 6. País de Origen & Temperatura de Agua */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-coffee-800 dark:text-coffee-200 uppercase tracking-wider mb-1.5">
              {t('countryLabel')}
            </label>
            <input
              type="text"
              list="country-suggestions"
              value={pais}
              onChange={(e) => setPais(e.target.value)}
              placeholder={t('countryPlaceholder')}
              required
              className="w-full px-4 py-3 rounded-2xl bg-coffee-50/50 dark:bg-darkbg-input border border-coffee-200 dark:border-darkbg-border text-coffee-900 dark:text-coffee-100 text-sm font-medium focus:ring-2 focus:ring-terracotta/40 focus:outline-none"
            />
            <datalist id="country-suggestions">
              {POPULAR_COUNTRIES.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>

            {/* Quick Country Pills */}
            <div className="flex flex-wrap gap-1 mt-1.5">
              {POPULAR_COUNTRIES.slice(0, 4).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setPais(c)}
                  className={`text-[10px] px-2 py-0.5 rounded-lg transition-all ${
                    pais.toLowerCase() === c.toLowerCase()
                      ? 'bg-terracotta text-white font-bold'
                      : 'bg-coffee-100/70 hover:bg-coffee-200 dark:bg-darkbg-input text-coffee-600 dark:text-coffee-300'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-coffee-800 dark:text-coffee-200 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <Thermometer className="w-3.5 h-3.5 text-terracotta" />
              <span>{t('waterTempLabel')}</span>
            </label>
            <div className="relative">
              <input
                type="number"
                min="50"
                max="100"
                value={tempAgua}
                onChange={(e) => setTempAgua(e.target.value)}
                placeholder={t('waterTempPlaceholder')}
                className="w-full px-4 py-3 rounded-2xl bg-coffee-50/50 dark:bg-darkbg-input border border-coffee-200 dark:border-darkbg-border text-coffee-900 dark:text-coffee-100 text-sm font-mono font-medium focus:ring-2 focus:ring-terracotta/40 focus:outline-none"
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-coffee-400">
                °C
              </span>
            </div>

            {/* Quick Temp Pills */}
            <div className="flex gap-1.5 mt-1.5">
              {[88, 91, 93, 95].map((temp) => (
                <button
                  key={temp}
                  type="button"
                  onClick={() => setTempAgua(String(temp))}
                  className={`text-[10px] px-2 py-0.5 rounded-lg font-mono transition-all ${
                    String(tempAgua) === String(temp)
                      ? 'bg-terracotta text-white font-bold'
                      : 'bg-coffee-100/70 hover:bg-coffee-200 dark:bg-darkbg-input text-coffee-600 dark:text-coffee-300'
                  }`}
                >
                  {temp}°C
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 7. Perfil de Sabor (Tags y Chips) */}
        <div>
          <label className="block text-xs font-bold text-coffee-800 dark:text-coffee-200 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5 text-terracotta" />
            <span>{t('flavorProfileLabel')}</span>
          </label>
          <input
            type="text"
            value={perfilSabor}
            onChange={(e) => setPerfilSabor(e.target.value)}
            placeholder={t('flavorProfilePlaceholder')}
            className="w-full px-4 py-3 rounded-2xl bg-coffee-50/50 dark:bg-darkbg-input border border-coffee-200 dark:border-darkbg-border text-coffee-900 dark:text-coffee-100 text-sm font-medium focus:ring-2 focus:ring-terracotta/40 focus:outline-none"
          />

          {/* Flavor Chips */}
          <div className="flex flex-wrap gap-1.5 mt-2">
            {SUGGESTED_FLAVORS.map((flavor) => (
              <button
                key={flavor}
                type="button"
                onClick={() => addFlavorChip(flavor)}
                className="text-[11px] px-2.5 py-0.5 rounded-xl bg-coffee-100/70 hover:bg-coffee-200 dark:bg-darkbg-input dark:hover:bg-darkbg-cardHover text-coffee-700 dark:text-coffee-300 transition-colors font-medium active:scale-95"
              >
                + {flavor}
              </button>
            ))}
          </div>
        </div>

        {/* 8. Comentarios / Receta */}
        <div>
          <label className="block text-xs font-bold text-coffee-800 dark:text-coffee-200 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5 text-terracotta" />
            <span>{t('commentsLabel')}</span>
          </label>
          <textarea
            rows="3"
            value={comentario}
            onChange={(e) => setComentario(e.target.value)}
            placeholder={t('commentsPlaceholder')}
            className="w-full px-4 py-3 rounded-2xl bg-coffee-50/50 dark:bg-darkbg-input border border-coffee-200 dark:border-darkbg-border text-coffee-900 dark:text-coffee-100 text-sm focus:ring-2 focus:ring-terracotta/40 focus:outline-none resize-none"
          />
        </div>

        {/* Action Submit */}
        <button
          type="submit"
          disabled={submitting}
          className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-coffee-800 via-coffee-700 to-terracotta hover:from-coffee-900 hover:to-terracotta-dark text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50"
        >
          {submitting ? (
            <span className="inline-flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>{t('savingGrind')}</span>
            </span>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>{t('saveGrindButton')}</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
};

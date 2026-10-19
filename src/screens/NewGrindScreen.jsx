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
  AlertTriangle,
  Mountain,
  Timer
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { CylindricalDialSelector } from '../components/CylindricalDialSelector';
import {
  USUAL_VARIETIES,
  SUGGESTED_VARIETIES_DATALIST,
  USUAL_PROCESSES,
  SUGGESTED_PROCESSES_DATALIST,
  COFFEE_METHODS,
  POPULAR_COUNTRIES,
  SUGGESTED_FLAVORS,
  isOptionSelected
} from '../constants/coffee';

export const NewGrindScreen = ({ mills = [], onSave, onNavigateMills }) => {
  const { t, language } = useLanguage();

  // Cleaned and normalized list of mills with guaranteed non-empty unique IDs
  const validMills = useMemo(() => {
    if (!Array.isArray(mills)) return [];
    return mills
      .filter((m) => m && typeof m === 'object')
      .map((m, idx) => ({
        ...m,
        id: String(m.id || m.nombre || m.name || `mill_${idx}_${Date.now()}`),
        nombre: m.nombre || m.name || `Molino ${idx + 1}`
      }));
  }, [mills]);

  // Selected mill state
  const [selectedMillId, setSelectedMillId] = useState(() => (mills[0]?.id ? String(mills[0].id) : ''));

  // Active mill ID: guarantees that a valid mill ID is selected whenever mills exist
  const activeMillId = useMemo(() => {
    if (validMills.length === 0) return '';
    const found = validMills.find((m) => String(m.id) === String(selectedMillId));
    return found ? String(found.id) : String(validMills[0].id);
  }, [validMills, selectedMillId]);

  const activeMill = useMemo(() => {
    if (validMills.length === 0) return null;
    return validMills.find((m) => String(m.id) === activeMillId) || validMills[0] || null;
  }, [validMills, activeMillId]);

  // Form fields
  const [nombreCafe, setNombreCafe] = useState('');
  const [tostadero, setTostadero] = useState('');
  const [metodo, setMetodo] = useState('Espresso');
  const [variedad, setVariedad] = useState(() => (language === 'en' ? 'Arabica' : 'Arábica'));
  const [altitud, setAltitud] = useState('');
  const [proceso, setProceso] = useState(() => (language === 'en' ? 'Washed' : 'Lavado'));
  const [pais, setPais] = useState('');
  const [perfilSabor, setPerfilSabor] = useState('');
  const [tempAgua, setTempAgua] = useState('');
  
  // Espresso conditional fields
  const [cafeIn, setCafeIn] = useState('18.0');
  const [cafeOut, setCafeOut] = useState('36.0');
  const [extractionTime, setExtractionTime] = useState('');

  // Grind settings
  const [grado, setGrado] = useState(12.0);
  const [comentario, setComentario] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Sync selected mill when mills list updates
  useEffect(() => {
    if (mills.length > 0 && activeMillId && selectedMillId !== activeMillId) {
      setSelectedMillId(activeMillId);
    }
  }, [mills, activeMillId, selectedMillId]);

  // Calculate dynamic slider configuration according to selected mill
  const sliderConfig = useMemo(() => {
    if (!activeMill) {
      return { min: 1, max: 40, step: 1, unit: t('grindSettingUnitClicks'), isDial: false, stepsPerNum: 0, totalNumbers: 0 };
    }

    const isDial = String(activeMill.type || activeMill.tipo || '').toLowerCase() === 'dial';
    if (isDial) {
      const maxNum = Number(activeMill.total_dial_numbers || activeMill.total_numeros) || 11;
      const stepsPerNum = Number(activeMill.dial_steps || activeMill.pasos_por_numero) || 4;
      return {
        min: 0,
        max: maxNum,
        step: 0.1,
        unit: t('grindSettingUnitDial') || 'Dial',
        isDial: true,
        stepsPerNum,
        totalNumbers: maxNum
      };
    } else {
      const maxClicks = Number(activeMill.total_clicks) || 40;
      return {
        min: 1,
        max: maxClicks,
        step: 1,
        unit: t('grindSettingUnitClicks') || 'Clicks',
        isDial: false,
        stepsPerNum: 0,
        totalNumbers: 0
      };
    }
  }, [activeMill, t]);

  // When active mill changes, ensure grado is within proper bounds
  useEffect(() => {
    if (activeMill) {
      if (sliderConfig.isDial) {
        setGrado((prev) => {
          const num = parseFloat(prev);
          if (isNaN(num) || num > sliderConfig.max || num < 0) return 4.0;
          return prev;
        });
      } else {
        setGrado((prev) => {
          const num = Math.round(parseFloat(prev));
          if (isNaN(num) || num > sliderConfig.max || num < 1) return Math.min(15, sliderConfig.max);
          return num;
        });
      }
    }
  }, [activeMill, sliderConfig]);

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
    const effectiveMill = activeMill || mills[0];
    if (!effectiveMill) {
      setErrorMsg('Por favor, registra o selecciona un molino primero.');
      return;
    }
    if (!nombreCafe.trim() || !tostadero.trim() || !pais.trim()) {
      setErrorMsg('Por favor, completa los campos requeridos (Café, Tostadero y País).');
      return;
    }

    if (metodo === 'Espresso') {
      if (!cafeIn || !cafeOut || parseFloat(cafeIn) <= 0 || parseFloat(cafeOut) <= 0) {
        setErrorMsg('Para el método Espresso, los campos Café IN y Café OUT son obligatorios.');
        return;
      }
    }

    setSubmitting(true);
    setErrorMsg('');
    setShowSuccess(false);

    try {
      const rawGrado = sliderConfig.isDial
        ? (grado !== undefined && grado !== null && grado !== '' ? parseFloat(Number(grado).toFixed(2)) : 0)
        : (parseInt(grado, 10) || 0);

      const grindPayload = {
        molino: effectiveMill.nombre || effectiveMill.name || '',
        nombre_cafe: nombreCafe.trim(),
        coffee_name: nombreCafe.trim(),
        tostadero: tostadero.trim(),
        roaster: tostadero.trim(),
        metodo,
        variedad: variedad.trim(),
        altitud: altitud.trim(),
        altitude: altitud.trim(),
        proceso,
        pais: pais.trim(),
        perfil_sabor: perfilSabor.trim(),
        flavor_profile: perfilSabor.trim(),
        temp_agua: tempAgua ? parseFloat(tempAgua) : null,
        water_temp: tempAgua ? parseFloat(tempAgua) : null,
        cafe_in: metodo === 'Espresso' ? (parseFloat(cafeIn) || null) : null,
        dose_in: metodo === 'Espresso' ? (parseFloat(cafeIn) || null) : null,
        cafe_out: metodo === 'Espresso' ? (parseFloat(cafeOut) || null) : null,
        yield_out: metodo === 'Espresso' ? (parseFloat(cafeOut) || null) : null,
        extraction_time: (metodo === 'Espresso' && extractionTime) ? (parseFloat(extractionTime) || null) : null,
        tiempo_extraccion: (metodo === 'Espresso' && extractionTime) ? (parseFloat(extractionTime) || null) : null,
        grado: rawGrado,
        comentario: comentario.trim(),
        fecha: new Date().toLocaleDateString('es-ES')
      };

      const response = await onSave(grindPayload);

      // Verificación estricta de respuesta: solo mostrar éxito si success es explícitamente true
      const isSuccess = response && (response.success === true || (response.data && response.data.success === true));
      if (!isSuccess) {
        const errorDetail = (response && (response.message || (response.data && response.data.message))) 
          || 'Error al registrar la molienda en Google Sheets.';
        throw new Error(errorDetail);
      }

      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2500);

      // Reset specific fields but keep favorites
      setNombreCafe('');
      setPerfilSabor('');
      setAltitud('');
      setExtractionTime('');
      setComentario('');
    } catch (err) {
      console.error('Error al guardar molienda:', err);
      setErrorMsg(err.message || 'Error al guardar la molienda');
      setTimeout(() => setErrorMsg(''), 6000);
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

      {errorMsg && (
        <div className="p-4 rounded-3xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 flex items-center gap-3 text-red-800 dark:text-red-200 text-sm animate-in zoom-in-95">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 text-red-500" />
          <span className="font-bold">{errorMsg}</span>
        </div>
      )}

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
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold text-coffee-800 dark:text-coffee-200 uppercase tracking-wider flex items-center gap-1.5">
              <Settings2 className="w-4 h-4 text-terracotta" />
              <span>{t('selectMillLabel')}</span>
            </label>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-terracotta/10 text-terracotta border border-terracotta/20">
              {String(activeMill?.tipo || activeMill?.type || '').toLowerCase() === 'dial' ? t('millTypeDial') : t('millTypeClicks')}
            </span>
          </div>

          <div className="relative">
            <select
              value={activeMillId}
              onChange={(e) => setSelectedMillId(e.target.value)}
              required
              className="w-full pl-4 pr-10 py-3 rounded-2xl bg-coffee-50/50 dark:bg-darkbg-input border border-coffee-200 dark:border-darkbg-border text-coffee-900 dark:text-coffee-100 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-terracotta/40 focus:border-terracotta transition-all appearance-none cursor-pointer"
            >
              {validMills.map((m) => {
                const isDial = String(m.tipo || m.type || '').toLowerCase() === 'dial';
                const count = isDial
                  ? (m.total_numeros || m.total_dial_numbers || 11)
                  : (m.total_clicks || 40);
                const label = isDial ? `Dial 1-${count}` : `${count} Clicks`;
                return (
                  <option key={m.id} value={m.id} className="dark:bg-darkbg-card">
                    {m.nombre} ({label})
                  </option>
                );
              })}
            </select>
            <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-coffee-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>

        {/* 2. Unified Cylindrical Drum Dial & Clicks Wheel Interface */}
        <div>
          <CylindricalDialSelector
            mode={sliderConfig.isDial ? 'dial' : 'clicks'}
            value={grado}
            onChange={(val) => setGrado(val)}
            totalNumbers={sliderConfig.totalNumbers}
            dialSteps={sliderConfig.stepsPerNum}
            totalClicks={sliderConfig.max}
            min={sliderConfig.min}
            unit={sliderConfig.unit}
          />
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

        {/* 4. Método de Preparación */}
        <div>
          <label className="block text-xs font-bold text-coffee-800 dark:text-coffee-200 uppercase tracking-wider mb-1.5">
            {t('methodLabel')}
          </label>
          <select
            value={metodo}
            onChange={(e) => setMetodo(e.target.value)}
            required
            className="w-full px-4 py-3 rounded-2xl bg-coffee-50/50 dark:bg-darkbg-input border border-coffee-200 dark:border-darkbg-border text-coffee-900 dark:text-coffee-100 text-sm font-semibold focus:ring-2 focus:ring-terracotta/40 cursor-pointer"
          >
            {COFFEE_METHODS.map((m) => (
              <option key={m.id} value={m.es} className="dark:bg-darkbg-card">
                {language === 'en' ? m.en : m.es}
              </option>
            ))}
          </select>
        </div>

        {/* Variedad de Café con Chips de Acceso Rápido (Arábica, Robusta, Libérica, Excelsa) y entrada personalizada */}
        <div>
          <label className="block text-xs font-bold text-coffee-800 dark:text-coffee-200 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <Coffee className="w-3.5 h-3.5 text-terracotta" />
            <span>{t('varietyLabel')}</span>
          </label>
          <div className="relative">
            <input
              type="text"
              list="variety-suggestions"
              value={variedad}
              onChange={(e) => setVariedad(e.target.value)}
              placeholder={t('varietyPlaceholder')}
              required
              className="w-full px-4 py-3 rounded-2xl bg-coffee-50/50 dark:bg-darkbg-input border border-coffee-200 dark:border-darkbg-border text-coffee-900 dark:text-coffee-100 text-sm font-medium focus:ring-2 focus:ring-terracotta/40 focus:outline-none"
            />
            <datalist id="variety-suggestions">
              {SUGGESTED_VARIETIES_DATALIST.map((v) => (
                <option key={v} value={v} />
              ))}
            </datalist>
          </div>

          {/* Quick Variety Chips (Arábica, Robusta, Libérica, Excelsa traducidos) */}
          <div className="flex flex-wrap gap-1.5 mt-2">
            {USUAL_VARIETIES.map((v) => {
              const label = language === 'en' ? v.en : v.es;
              const isSelected = isOptionSelected(variedad, v);
              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setVariedad(label)}
                  className={`text-[11px] px-2.5 py-1 rounded-xl transition-all font-medium active:scale-95 ${
                    isSelected
                      ? 'bg-terracotta text-white font-bold shadow-xs'
                      : 'bg-coffee-100/70 hover:bg-coffee-200 dark:bg-darkbg-input dark:hover:bg-darkbg-cardHover text-coffee-700 dark:text-coffee-300'
                  }`}
                >
                  {isSelected ? '✓ ' : '+ '}{label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Proceso de Café con Chips de Acceso Rápido y entrada personalizada */}
        <div>
          <label className="block text-xs font-bold text-coffee-800 dark:text-coffee-200 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5 text-terracotta" />
            <span>{t('processLabel')}</span>
          </label>
          <div className="relative">
            <input
              type="text"
              list="process-suggestions"
              value={proceso}
              onChange={(e) => setProceso(e.target.value)}
              placeholder={t('processPlaceholder')}
              required
              className="w-full px-4 py-3 rounded-2xl bg-coffee-50/50 dark:bg-darkbg-input border border-coffee-200 dark:border-darkbg-border text-coffee-900 dark:text-coffee-100 text-sm font-medium focus:ring-2 focus:ring-terracotta/40 focus:outline-none"
            />
            <datalist id="process-suggestions">
              {SUGGESTED_PROCESSES_DATALIST.map((p) => (
                <option key={p} value={p} />
              ))}
            </datalist>
          </div>

          {/* Quick Process Chips (Natural, Lavado/Washed, Honey, Anaeróbico/Anaerobic, etc. traducidos) */}
          <div className="flex flex-wrap gap-1.5 mt-2">
            {USUAL_PROCESSES.map((p) => {
              const label = language === 'en' ? p.en : p.es;
              const isSelected = isOptionSelected(proceso, p);
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setProceso(label)}
                  className={`text-[11px] px-2.5 py-1 rounded-xl transition-all font-medium active:scale-95 ${
                    isSelected
                      ? 'bg-terracotta text-white font-bold shadow-xs'
                      : 'bg-coffee-100/70 hover:bg-coffee-200 dark:bg-darkbg-input dark:hover:bg-darkbg-cardHover text-coffee-700 dark:text-coffee-300'
                  }`}
                >
                  {isSelected ? '✓ ' : '+ '}{label}
                </button>
              );
            })}
          </div>
        </div>

        {/* 5. LÓGICA CONDICIONAL PARA ESPRESSO (Café IN / Café OUT / Tiempo Extracción) */}
        {metodo === 'Espresso' && (
          <div className="bg-orange-50/80 dark:bg-orange-950/20 border-2 border-orange-200 dark:border-orange-800/40 rounded-3xl p-4 space-y-3 animate-in slide-in-from-top-2 duration-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-orange-900 dark:text-orange-300 flex items-center gap-1.5">
                <Scale className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                <span>{t('espressoSectionTitle')}</span>
              </span>
              {espressoRatio && (
                <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-orange-200 dark:bg-orange-900/60 text-orange-900 dark:text-orange-200">
                  {t('ratioLabel', { ratio: espressoRatio })}{extractionTime ? ` • ${extractionTime}s` : ''}
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Café IN */}
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

              {/* Café OUT */}
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

              {/* Tiempo de Extracción (s, opcional) */}
              <div>
                <label className="block text-[11px] font-bold text-orange-800 dark:text-orange-300 mb-1 flex items-center gap-1">
                  <Timer className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />
                  <span>{t('espressoExtractionTimeLabel') || 'Tiempo Extracción'}</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="1"
                    min="1"
                    max="180"
                    value={extractionTime}
                    onChange={(e) => setExtractionTime(e.target.value)}
                    placeholder={t('espressoExtractionTimePlaceholder') || '28'}
                    className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-darkbg-input border border-orange-300/70 dark:border-orange-800/50 text-coffee-900 dark:text-coffee-100 font-mono font-bold text-sm focus:ring-2 focus:ring-orange-400 focus:outline-none"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-coffee-400">
                    s
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 6. País de Origen, Altitud & Temperatura de Agua */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* País */}
          <div>
            <label className="block text-xs font-bold text-coffee-800 dark:text-coffee-200 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-terracotta" />
              <span>{t('countryLabel')}</span>
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

          {/* Altitud (m s. n. m., opcional) */}
          <div>
            <label className="block text-xs font-bold text-coffee-800 dark:text-coffee-200 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Mountain className="w-3.5 h-3.5 text-terracotta" />
              <span>{t('altitudeLabel') || 'Altitud (opcional)'}</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={altitud}
                onChange={(e) => setAltitud(e.target.value)}
                placeholder={t('altitudePlaceholder') || 'Ej. 1800m o 1800'}
                className="w-full px-4 py-3 rounded-2xl bg-coffee-50/50 dark:bg-darkbg-input border border-coffee-200 dark:border-darkbg-border text-coffee-900 dark:text-coffee-100 text-sm font-medium focus:ring-2 focus:ring-terracotta/40 focus:outline-none"
              />
            </div>

            {/* Quick Altitude Pills */}
            <div className="flex flex-wrap gap-1 mt-1.5">
              {['1500m', '1800m', '2000m'].map((alt) => (
                <button
                  key={alt}
                  type="button"
                  onClick={() => setAltitud(alt)}
                  className={`text-[10px] px-2 py-0.5 rounded-lg font-mono transition-all ${
                    altitud === alt
                      ? 'bg-terracotta text-white font-bold'
                      : 'bg-coffee-100/70 hover:bg-coffee-200 dark:bg-darkbg-input text-coffee-600 dark:text-coffee-300'
                  }`}
                >
                  {alt}
                </button>
              ))}
            </div>
          </div>

          {/* Temperatura */}
          <div>
            <label className="block text-xs font-bold text-coffee-800 dark:text-coffee-200 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
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

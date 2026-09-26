import React, { useState, useEffect, useMemo } from 'react';
import { Modal } from './Modal';
import { DialSlider } from './DialSlider';
import { useLanguage } from '../context/LanguageContext';
import { Scale, Thermometer, Tag, MessageSquare, AlertCircle, Sliders } from 'lucide-react';

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

export const EditGrindModal = ({
  isOpen,
  onClose,
  grind,
  mills = [],
  onSave
}) => {
  const { t } = useLanguage();
  const [isUpdating, setIsUpdating] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Form state
  const [editForm, setEditForm] = useState({
    molino: '',
    nombre_cafe: '',
    tostadero: '',
    metodo: 'Espresso',
    variedad: 'Arábica',
    proceso: 'Lavado',
    pais: '',
    perfil_sabor: '',
    temp_agua: '',
    cafe_in: '18.0',
    cafe_out: '36.0',
    grado: 0,
    comentario: ''
  });

  // Pre-populate form accurately when grind prop changes
  useEffect(() => {
    if (grind) {
      const initialMillName = grind.molino || (mills[0]?.name || mills[0]?.nombre || '');
      const coffeeName = grind.coffee_name || grind.coffeeName || grind.nombre_cafe || grind.nombre || '';
      const roaster = grind.roaster || grind.tostadero || '';
      const method = grind.metodo || grind.method || 'Espresso';
      const variety = grind.variedad || grind.variety || 'Arábica';
      const process = grind.proceso || grind.process || 'Lavado';
      const country = grind.pais || grind.country || '';
      const flavor = grind.flavor_profile || grind.flavorProfile || grind.perfil_sabor || '';
      
      const rawTemp = grind.water_temp ?? grind.waterTemp ?? grind.temp_agua;
      const waterTemp = (rawTemp !== null && rawTemp !== undefined && rawTemp !== '') ? String(rawTemp) : '';

      const rawIn = grind.dose_in ?? grind.doseIn ?? grind.cafe_in;
      const cafeIn = (rawIn !== null && rawIn !== undefined && rawIn !== '') ? String(rawIn) : '18.0';

      const rawOut = grind.yield_out ?? grind.yieldOut ?? grind.cafe_out;
      const cafeOut = (rawOut !== null && rawOut !== undefined && rawOut !== '') ? String(rawOut) : '36.0';

      const rawGrado = grind.grado ?? grind.grind_size ?? grind.grindSetting ?? 0;
      const grado = isNaN(rawGrado) ? 0 : parseFloat(rawGrado);

      const comment = grind.comentario || grind.comment || grind.comments || '';

      setEditForm({
        molino: initialMillName,
        nombre_cafe: coffeeName,
        tostadero: roaster,
        metodo: method,
        variedad: variety,
        proceso: process,
        pais: country,
        perfil_sabor: flavor,
        temp_agua: waterTemp,
        cafe_in: cafeIn,
        cafe_out: cafeOut,
        grado: grado,
        comentario: comment
      });
      setErrorMsg('');
    }
  }, [grind, mills]);

  // Identify active mill configuration
  const activeMill = useMemo(() => {
    return mills.find((m) =>
      String(m.name || m.nombre).toLowerCase() === String(editForm.molino || '').toLowerCase()
    ) || mills[0] || null;
  }, [mills, editForm.molino]);

  const isDial = useMemo(() => {
    if (!activeMill) return false;
    return String(activeMill.type || activeMill.tipo || '').toLowerCase() === 'dial';
  }, [activeMill]);

  const dialNumbers = useMemo(() => {
    if (!activeMill) return 11;
    return Number(activeMill.total_dial_numbers || activeMill.total_numeros) || 11;
  }, [activeMill]);

  const dialSteps = useMemo(() => {
    if (!activeMill) return 4;
    return Number(activeMill.dial_steps || activeMill.pasos_por_numero) || 4;
  }, [activeMill]);

  const maxClicks = useMemo(() => {
    if (!activeMill) return 40;
    return Number(activeMill.total_clicks) || 40;
  }, [activeMill]);

  // Add flavor chip
  const addFlavorChip = (flavor) => {
    if (!editForm.perfil_sabor.trim()) {
      setEditForm((prev) => ({ ...prev, perfil_sabor: flavor }));
    } else if (!editForm.perfil_sabor.toLowerCase().includes(flavor.toLowerCase())) {
      setEditForm((prev) => ({ ...prev, perfil_sabor: `${prev.perfil_sabor}, ${flavor}` }));
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!grind) return;
    setErrorMsg('');

    if (!editForm.nombre_cafe.trim() || !editForm.tostadero.trim() || !editForm.pais.trim()) {
      setErrorMsg(t('errorAllFields'));
      return;
    }

    if (editForm.metodo === 'Espresso') {
      if (!editForm.cafe_in || !editForm.cafe_out) {
        setErrorMsg('Para Espresso, los campos Café IN y Café OUT son requeridos.');
        return;
      }
    }

    setIsUpdating(true);
    try {
      const cleanCoffeeName = editForm.nombre_cafe.trim();
      const cleanRoaster = editForm.tostadero.trim();
      const cleanFlavor = editForm.perfil_sabor.trim();
      const cleanCountry = editForm.pais.trim();
      const parsedTemp = editForm.temp_agua ? parseFloat(editForm.temp_agua) : null;
      const parsedIn = editForm.metodo === 'Espresso' ? (parseFloat(editForm.cafe_in) || null) : null;
      const parsedOut = editForm.metodo === 'Espresso' ? (parseFloat(editForm.cafe_out) || null) : null;
      const parsedGrado = parseFloat(editForm.grado) || 0;

      const payload = {
        id: grind.id,
        molino: editForm.molino,
        coffee_name: cleanCoffeeName,
        nombre_cafe: cleanCoffeeName,
        roaster: cleanRoaster,
        tostadero: cleanRoaster,
        metodo: editForm.metodo,
        variedad: editForm.variedad,
        proceso: editForm.proceso,
        pais: cleanCountry,
        flavor_profile: cleanFlavor,
        perfil_sabor: cleanFlavor,
        water_temp: parsedTemp,
        temp_agua: parsedTemp,
        dose_in: parsedIn,
        cafe_in: parsedIn,
        yield_out: parsedOut,
        cafe_out: parsedOut,
        grado: parsedGrado,
        comentario: editForm.comentario.trim(),
        fecha: grind.fecha
      };

      await onSave(payload);
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Error al actualizar la molienda');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('editGrindTitle') || 'Editar Molienda'}
    >
      <form onSubmit={handleSave} className="space-y-4">
        {errorMsg && (
          <div className="p-3 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 flex items-start gap-2 text-xs text-red-700 dark:text-red-300">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* 1. Selección de Molino */}
        <div>
          <label className="block text-xs font-bold text-coffee-700 dark:text-coffee-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-terracotta" />
            <span>{t('selectMillLabel')}</span>
          </label>
          <select
            value={editForm.molino}
            onChange={(e) => setEditForm({ ...editForm, molino: e.target.value })}
            className="w-full px-4 py-2.5 rounded-2xl bg-white dark:bg-darkbg-input border border-coffee-200 dark:border-darkbg-border text-coffee-900 dark:text-coffee-100 text-sm font-semibold focus:ring-2 focus:ring-terracotta/40"
          >
            {mills.map((m) => {
              const name = m.name || m.nombre;
              return (
                <option key={m.id} value={name}>
                  {name} ({m.type || m.tipo})
                </option>
              );
            })}
            {!mills.some(m => (m.name || m.nombre) === editForm.molino) && editForm.molino && (
              <option value={editForm.molino}>{editForm.molino}</option>
            )}
          </select>
        </div>

        {/* 2. Ajuste de Grado: Dial Slider Mahlkönig o Clicks Slider */}
        <div>
          <label className="block text-xs font-bold text-coffee-700 dark:text-coffee-300 uppercase tracking-wider mb-1.5">
            {t('grindSettingLabel')}
          </label>

          {isDial ? (
            <DialSlider
              value={editForm.grado}
              onChange={(newVal) => setEditForm({ ...editForm, grado: newVal })}
              totalNumbers={dialNumbers}
              dialSteps={dialSteps}
              min={0}
            />
          ) : (
            <div className="bg-coffee-100/40 dark:bg-darkbg-input/40 p-4 rounded-3xl border border-coffee-200/70 dark:border-darkbg-border space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-coffee-600 dark:text-coffee-300">
                  Ajuste de Clicks
                </span>
                <span className="text-lg font-black font-mono text-terracotta">
                  {Number(editForm.grado).toFixed(1)} clicks
                </span>
              </div>
              <input
                type="range"
                min="0"
                max={maxClicks}
                step="0.5"
                value={editForm.grado}
                onChange={(e) => setEditForm({ ...editForm, grado: parseFloat(e.target.value) })}
                className="w-full h-2.5 bg-coffee-200 dark:bg-darkbg-border rounded-lg appearance-none cursor-pointer accent-terracotta"
              />
              <div className="flex justify-between text-[10px] text-coffee-400 font-mono">
                <span>0 clicks</span>
                <span>{maxClicks} clicks</span>
              </div>
            </div>
          )}
        </div>

        {/* 3. Café y Tostadero */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs font-bold text-coffee-700 dark:text-coffee-300 uppercase tracking-wider mb-1">
              {t('coffeeNameLabel')}
            </label>
            <input
              type="text"
              value={editForm.nombre_cafe}
              onChange={(e) => setEditForm({ ...editForm, nombre_cafe: e.target.value })}
              placeholder={t('coffeeNamePlaceholder')}
              required
              className="w-full px-3 py-2.5 rounded-2xl bg-white dark:bg-darkbg-input border border-coffee-200 dark:border-darkbg-border text-coffee-900 dark:text-coffee-100 text-sm font-medium focus:ring-2 focus:ring-terracotta/40"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-coffee-700 dark:text-coffee-300 uppercase tracking-wider mb-1">
              {t('roasterLabel')}
            </label>
            <input
              type="text"
              value={editForm.tostadero}
              onChange={(e) => setEditForm({ ...editForm, tostadero: e.target.value })}
              placeholder={t('roasterPlaceholder')}
              required
              className="w-full px-3 py-2.5 rounded-2xl bg-white dark:bg-darkbg-input border border-coffee-200 dark:border-darkbg-border text-coffee-900 dark:text-coffee-100 text-sm font-medium focus:ring-2 focus:ring-terracotta/40"
            />
          </div>
        </div>

        {/* 4. Método, Variedad, Proceso */}
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="block text-[11px] font-bold text-coffee-700 dark:text-coffee-300 uppercase tracking-wider mb-1">
              {t('methodLabel')}
            </label>
            <select
              value={editForm.metodo}
              onChange={(e) => setEditForm({ ...editForm, metodo: e.target.value })}
              className="w-full px-2 py-2 rounded-xl bg-white dark:bg-darkbg-input border border-coffee-200 dark:border-darkbg-border text-coffee-900 dark:text-coffee-100 text-xs font-semibold focus:ring-2 focus:ring-terracotta/40"
            >
              {COFFEE_METHODS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-coffee-700 dark:text-coffee-300 uppercase tracking-wider mb-1">
              {t('varietyLabel')}
            </label>
            <select
              value={editForm.variedad}
              onChange={(e) => setEditForm({ ...editForm, variedad: e.target.value })}
              className="w-full px-2 py-2 rounded-xl bg-white dark:bg-darkbg-input border border-coffee-200 dark:border-darkbg-border text-coffee-900 dark:text-coffee-100 text-xs font-semibold focus:ring-2 focus:ring-terracotta/40"
            >
              {COFFEE_VARIETIES.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-coffee-700 dark:text-coffee-300 uppercase tracking-wider mb-1">
              {t('processLabel')}
            </label>
            <select
              value={editForm.proceso}
              onChange={(e) => setEditForm({ ...editForm, proceso: e.target.value })}
              className="w-full px-2 py-2 rounded-xl bg-white dark:bg-darkbg-input border border-coffee-200 dark:border-darkbg-border text-coffee-900 dark:text-coffee-100 text-xs font-semibold focus:ring-2 focus:ring-terracotta/40"
            >
              {COFFEE_PROCESSES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 5. Parámetros Espresso (Condicional) */}
        {editForm.metodo === 'Espresso' && (
          <div className="bg-orange-50/80 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800/40 p-3.5 rounded-2xl space-y-2">
            <span className="text-[11px] font-black uppercase text-orange-900 dark:text-orange-300 flex items-center gap-1.5">
              <Scale className="w-3.5 h-3.5 text-orange-600" />
              <span>{t('espressoSectionTitle')}</span>
            </span>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-bold text-orange-800 dark:text-orange-300 mb-1">
                  {t('espressoCoffeeInLabel')}
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={editForm.cafe_in}
                  onChange={(e) => setEditForm({ ...editForm, cafe_in: e.target.value })}
                  required
                  className="w-full px-2.5 py-1.5 rounded-xl bg-white dark:bg-darkbg-input border border-orange-300 font-mono text-xs font-bold"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-orange-800 dark:text-orange-300 mb-1">
                  {t('espressoCoffeeOutLabel')}
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={editForm.cafe_out}
                  onChange={(e) => setEditForm({ ...editForm, cafe_out: e.target.value })}
                  required
                  className="w-full px-2.5 py-1.5 rounded-xl bg-white dark:bg-darkbg-input border border-orange-300 font-mono text-xs font-bold"
                />
              </div>
            </div>
          </div>
        )}

        {/* 6. País & Temperatura */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs font-bold text-coffee-700 dark:text-coffee-300 uppercase tracking-wider mb-1">
              {t('countryLabel')}
            </label>
            <input
              type="text"
              list="edit-country-list"
              value={editForm.pais}
              onChange={(e) => setEditForm({ ...editForm, pais: e.target.value })}
              required
              className="w-full px-3 py-2.5 rounded-2xl bg-white dark:bg-darkbg-input border border-coffee-200 dark:border-darkbg-border text-coffee-900 dark:text-coffee-100 text-sm font-medium focus:ring-2 focus:ring-terracotta/40"
            />
            <datalist id="edit-country-list">
              {POPULAR_COUNTRIES.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </div>

          <div>
            <label className="block text-xs font-bold text-coffee-700 dark:text-coffee-300 uppercase tracking-wider mb-1 flex items-center gap-1">
              <Thermometer className="w-3.5 h-3.5 text-terracotta" />
              <span>{t('waterTempLabel')}</span>
            </label>
            <input
              type="number"
              value={editForm.temp_agua}
              onChange={(e) => setEditForm({ ...editForm, temp_agua: e.target.value })}
              placeholder="Ej. 93"
              className="w-full px-3 py-2.5 rounded-2xl bg-white dark:bg-darkbg-input border border-coffee-200 dark:border-darkbg-border text-coffee-900 dark:text-coffee-100 text-sm font-mono font-medium focus:ring-2 focus:ring-terracotta/40"
            />
          </div>
        </div>

        {/* 7. Perfil de Sabor */}
        <div>
          <label className="block text-xs font-bold text-coffee-700 dark:text-coffee-300 uppercase tracking-wider mb-1 flex items-center gap-1">
            <Tag className="w-3.5 h-3.5 text-terracotta" />
            <span>{t('flavorProfileLabel')}</span>
          </label>
          <input
            type="text"
            value={editForm.perfil_sabor}
            onChange={(e) => setEditForm({ ...editForm, perfil_sabor: e.target.value })}
            placeholder={t('flavorProfilePlaceholder')}
            className="w-full px-3 py-2.5 rounded-2xl bg-white dark:bg-darkbg-input border border-coffee-200 dark:border-darkbg-border text-coffee-900 dark:text-coffee-100 text-sm focus:ring-2 focus:ring-terracotta/40"
          />
          <div className="flex flex-wrap gap-1 mt-1.5">
            {SUGGESTED_FLAVORS.slice(0, 6).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => addFlavorChip(f)}
                className="text-[10px] px-2 py-0.5 rounded-lg bg-coffee-100/70 hover:bg-coffee-200 dark:bg-darkbg-input text-coffee-600 dark:text-coffee-300 font-medium"
              >
                + {f}
              </button>
            ))}
          </div>
        </div>

        {/* 8. Comentarios */}
        <div>
          <label className="block text-xs font-bold text-coffee-700 dark:text-coffee-300 uppercase tracking-wider mb-1 flex items-center gap-1">
            <MessageSquare className="w-3.5 h-3.5 text-terracotta" />
            <span>{t('commentsLabel')}</span>
          </label>
          <textarea
            rows="2"
            value={editForm.comentario}
            onChange={(e) => setEditForm({ ...editForm, comentario: e.target.value })}
            placeholder={t('commentsPlaceholder')}
            className="w-full px-3 py-2 rounded-2xl bg-white dark:bg-darkbg-input border border-coffee-200 dark:border-darkbg-border text-coffee-900 dark:text-coffee-100 text-sm focus:ring-2 focus:ring-terracotta/40 resize-none"
          />
        </div>

        {/* Botones de acción */}
        <div className="pt-2 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 px-4 rounded-2xl bg-coffee-100 hover:bg-coffee-200 dark:bg-darkbg-input text-coffee-700 dark:text-coffee-300 font-bold text-xs transition-colors"
          >
            {t('cancel')}
          </button>
          <button
            type="submit"
            disabled={isUpdating}
            className="flex-1 py-3 px-4 rounded-2xl bg-terracotta hover:bg-terracotta-dark text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50"
          >
            {isUpdating ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              t('saveChanges')
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default EditGrindModal;

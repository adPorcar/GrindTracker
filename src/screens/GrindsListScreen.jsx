import React, { useState, useMemo } from 'react';
import { Search, Filter, Coffee, RefreshCw, X, AlertCircle, Scale, Thermometer } from 'lucide-react';
import { GrindCard } from '../components/GrindCard';
import { Modal } from '../components/Modal';
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

export const GrindsListScreen = ({
  grinds = [],
  mills = [],
  loading,
  onRefresh,
  onUpdateGrind,
  onDeleteGrind,
  onNavigateNew
}) => {
  const { t } = useLanguage();

  // 4 Top Filters
  const [selectedMill, setSelectedMill] = useState('ALL');
  const [selectedCountry, setSelectedCountry] = useState('ALL');
  const [selectedMethod, setSelectedMethod] = useState('ALL');
  const [selectedProcess, setSelectedProcess] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Editing state
  const [editingGrind, setEditingGrind] = useState(null);
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
    cafe_in: '',
    cafe_out: '',
    grado: 0,
    comentario: ''
  });
  const [isUpdating, setIsUpdating] = useState(false);

  // Dynamic filter lists from data
  const uniqueMills = useMemo(() => {
    const list = Array.from(new Set(grinds.map(g => g.molino).filter(Boolean)));
    return list.sort();
  }, [grinds]);

  const uniqueCountries = useMemo(() => {
    const list = Array.from(new Set(grinds.map(g => g.pais).filter(Boolean)));
    return list.sort();
  }, [grinds]);

  const uniqueMethods = useMemo(() => {
    const list = Array.from(new Set(grinds.map(g => g.metodo).filter(Boolean)));
    return list.sort();
  }, [grinds]);

  const uniqueProcesses = useMemo(() => {
    const list = Array.from(new Set(grinds.map(g => g.proceso).filter(Boolean)));
    return list.sort();
  }, [grinds]);

  // Filtered grinds list based on 4 filters + search
  const filteredGrinds = useMemo(() => {
    return grinds.filter(item => {
      const matchMill = selectedMill === 'ALL' || item.molino === selectedMill;
      const matchCountry = selectedCountry === 'ALL' || item.pais === selectedCountry;
      const matchMethod = selectedMethod === 'ALL' || item.metodo === selectedMethod;
      const matchProcess = selectedProcess === 'ALL' || item.proceso === selectedProcess;

      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        (item.nombre_cafe && item.nombre_cafe.toLowerCase().includes(q)) ||
        (item.tostadero && item.tostadero.toLowerCase().includes(q)) ||
        (item.molino && item.molino.toLowerCase().includes(q)) ||
        (item.pais && item.pais.toLowerCase().includes(q)) ||
        (item.metodo && item.metodo.toLowerCase().includes(q)) ||
        (item.variedad && item.variedad.toLowerCase().includes(q)) ||
        (item.proceso && item.proceso.toLowerCase().includes(q)) ||
        (item.perfil_sabor && item.perfil_sabor.toLowerCase().includes(q)) ||
        (item.comentario && item.comentario.toLowerCase().includes(q));

      return matchMill && matchCountry && matchMethod && matchProcess && matchSearch;
    });
  }, [grinds, selectedMill, selectedCountry, selectedMethod, selectedProcess, searchQuery]);

  const openEditModal = (grind) => {
    setEditingGrind(grind);
    setEditForm({
      molino: grind.molino || (mills[0]?.nombre || ''),
      nombre_cafe: grind.nombre_cafe || '',
      tostadero: grind.tostadero || '',
      metodo: grind.metodo || 'Espresso',
      variedad: grind.variedad || 'Arábica',
      proceso: grind.proceso || 'Lavado',
      pais: grind.pais || '',
      perfil_sabor: grind.perfil_sabor || '',
      temp_agua: grind.temp_agua ? String(grind.temp_agua) : '',
      cafe_in: grind.cafe_in ? String(grind.cafe_in) : '18.0',
      cafe_out: grind.cafe_out ? String(grind.cafe_out) : '36.0',
      grado: parseFloat(grind.grado) || 0,
      comentario: grind.comentario || ''
    });
  };

  const closeEditModal = () => {
    setEditingGrind(null);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingGrind) return;

    if (editForm.metodo === 'Espresso') {
      if (!editForm.cafe_in || !editForm.cafe_out) {
        alert('Para Espresso, los campos Café IN y Café OUT son requeridos.');
        return;
      }
    }

    setIsUpdating(true);
    try {
      await onUpdateGrind({
        id: editingGrind.id,
        ...editForm,
        grado: parseFloat(editForm.grado),
        temp_agua: editForm.temp_agua ? parseFloat(editForm.temp_agua) : null,
        cafe_in: editForm.metodo === 'Espresso' ? parseFloat(editForm.cafe_in) : null,
        cafe_out: editForm.metodo === 'Espresso' ? parseFloat(editForm.cafe_out) : null,
        fecha: editingGrind.fecha
      });
      closeEditModal();
    } finally {
      setIsUpdating(false);
    }
  };

  const clearFilters = () => {
    setSelectedMill('ALL');
    setSelectedCountry('ALL');
    setSelectedMethod('ALL');
    setSelectedProcess('ALL');
    setSearchQuery('');
  };

  const hasActiveFilters =
    selectedMill !== 'ALL' ||
    selectedCountry !== 'ALL' ||
    selectedMethod !== 'ALL' ||
    selectedProcess !== 'ALL' ||
    searchQuery !== '';

  return (
    <div className="max-w-md mx-auto space-y-4 pb-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-coffee-900 dark:text-coffee-100">
            {t('grindsListTitle')}
          </h1>
          <p className="text-xs text-coffee-500 dark:text-coffee-400 mt-0.5">
            {t('grindsListSubtitle', { filtered: filteredGrinds.length, total: grinds.length })}
          </p>
        </div>

        <button
          onClick={onRefresh}
          disabled={loading}
          className="p-2.5 rounded-2xl bg-white dark:bg-darkbg-card border border-coffee-200 dark:border-darkbg-border text-coffee-600 dark:text-coffee-300 hover:text-terracotta transition-colors active:scale-95 shadow-sm"
          aria-label="Refrescar moliendas"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-terracotta' : ''}`} />
        </button>
      </div>

      {/* Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-coffee-400">
          <Search className="w-4 h-4" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t('searchPlaceholder')}
          className="w-full pl-10 pr-10 py-3 rounded-2xl bg-white dark:bg-darkbg-card border border-coffee-200/80 dark:border-darkbg-border text-coffee-900 dark:text-coffee-100 placeholder-coffee-400 text-sm focus:outline-none focus:ring-2 focus:ring-terracotta/40 focus:border-terracotta transition-all shadow-sm"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-coffee-400 hover:text-coffee-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* 4 Dynamic Filters Section: Molino, País, Método, Proceso */}
      <div className="bg-white dark:bg-darkbg-card p-4 rounded-3xl border border-coffee-200/70 dark:border-darkbg-border shadow-soft dark:shadow-dark-soft space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-coffee-800 dark:text-coffee-200 uppercase tracking-wider flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-terracotta" />
            <span>{t('filtersTitle')}</span>
          </span>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-[11px] font-bold text-terracotta hover:underline"
            >
              {t('clearFilters')}
            </button>
          )}
        </div>

        {/* Filter 1: Molino */}
        <div>
          <label className="text-[11px] font-semibold text-coffee-500 dark:text-coffee-400 block mb-1">
            {t('filterByMill')}
          </label>
          <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            <button
              onClick={() => setSelectedMill('ALL')}
              className={`text-xs px-2.5 py-1 rounded-xl whitespace-nowrap font-semibold transition-all ${
                selectedMill === 'ALL'
                  ? 'bg-coffee-800 dark:bg-terracotta text-white shadow-sm'
                  : 'bg-coffee-100/80 dark:bg-darkbg-input text-coffee-600 dark:text-coffee-300 hover:bg-coffee-200'
              }`}
            >
              {t('allOption')} ({grinds.length})
            </button>
            {uniqueMills.map((mill) => (
              <button
                key={mill}
                onClick={() => setSelectedMill(mill)}
                className={`text-xs px-2.5 py-1 rounded-xl whitespace-nowrap font-semibold transition-all ${
                  selectedMill === mill
                    ? 'bg-coffee-800 dark:bg-terracotta text-white shadow-sm'
                    : 'bg-coffee-100/80 dark:bg-darkbg-input text-coffee-600 dark:text-coffee-300 hover:bg-coffee-200'
                }`}
              >
                {mill}
              </button>
            ))}
          </div>
        </div>

        {/* Filter 2: País */}
        <div>
          <label className="text-[11px] font-semibold text-coffee-500 dark:text-coffee-400 block mb-1">
            {t('filterByCountry')}
          </label>
          <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            <button
              onClick={() => setSelectedCountry('ALL')}
              className={`text-xs px-2.5 py-1 rounded-xl whitespace-nowrap font-semibold transition-all ${
                selectedCountry === 'ALL'
                  ? 'bg-coffee-800 dark:bg-terracotta text-white shadow-sm'
                  : 'bg-coffee-100/80 dark:bg-darkbg-input text-coffee-600 dark:text-coffee-300 hover:bg-coffee-200'
              }`}
            >
              {t('allOption')}
            </button>
            {uniqueCountries.map((country) => (
              <button
                key={country}
                onClick={() => setSelectedCountry(country)}
                className={`text-xs px-2.5 py-1 rounded-xl whitespace-nowrap font-semibold transition-all ${
                  selectedCountry === country
                    ? 'bg-coffee-800 dark:bg-terracotta text-white shadow-sm'
                    : 'bg-coffee-100/80 dark:bg-darkbg-input text-coffee-600 dark:text-coffee-300 hover:bg-coffee-200'
                }`}
              >
                {country}
              </button>
            ))}
          </div>
        </div>

        {/* Filter 3: Método */}
        <div>
          <label className="text-[11px] font-semibold text-coffee-500 dark:text-coffee-400 block mb-1">
            {t('filterByMethod')}
          </label>
          <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            <button
              onClick={() => setSelectedMethod('ALL')}
              className={`text-xs px-2.5 py-1 rounded-xl whitespace-nowrap font-semibold transition-all ${
                selectedMethod === 'ALL'
                  ? 'bg-coffee-800 dark:bg-terracotta text-white shadow-sm'
                  : 'bg-coffee-100/80 dark:bg-darkbg-input text-coffee-600 dark:text-coffee-300 hover:bg-coffee-200'
              }`}
            >
              {t('allOption')}
            </button>
            {COFFEE_METHODS.map((method) => {
              const count = grinds.filter(g => g.metodo === method).length;
              if (count === 0 && !uniqueMethods.includes(method)) return null;
              return (
                <button
                  key={method}
                  onClick={() => setSelectedMethod(method)}
                  className={`text-xs px-2.5 py-1 rounded-xl whitespace-nowrap font-semibold transition-all ${
                    selectedMethod === method
                      ? 'bg-coffee-800 dark:bg-terracotta text-white shadow-sm'
                      : 'bg-coffee-100/80 dark:bg-darkbg-input text-coffee-600 dark:text-coffee-300 hover:bg-coffee-200'
                  }`}
                >
                  {method} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* Filter 4: Proceso */}
        <div>
          <label className="text-[11px] font-semibold text-coffee-500 dark:text-coffee-400 block mb-1">
            {t('filterByProcess')}
          </label>
          <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            <button
              onClick={() => setSelectedProcess('ALL')}
              className={`text-xs px-2.5 py-1 rounded-xl whitespace-nowrap font-semibold transition-all ${
                selectedProcess === 'ALL'
                  ? 'bg-coffee-800 dark:bg-terracotta text-white shadow-sm'
                  : 'bg-coffee-100/80 dark:bg-darkbg-input text-coffee-600 dark:text-coffee-300 hover:bg-coffee-200'
              }`}
            >
              {t('allOption')}
            </button>
            {COFFEE_PROCESSES.map((proc) => {
              const count = grinds.filter(g => g.proceso === proc).length;
              if (count === 0 && !uniqueProcesses.includes(proc)) return null;
              return (
                <button
                  key={proc}
                  onClick={() => setSelectedProcess(proc)}
                  className={`text-xs px-2.5 py-1 rounded-xl whitespace-nowrap font-semibold transition-all ${
                    selectedProcess === proc
                      ? 'bg-coffee-800 dark:bg-terracotta text-white shadow-sm'
                      : 'bg-coffee-100/80 dark:bg-darkbg-input text-coffee-600 dark:text-coffee-300 hover:bg-coffee-200'
                  }`}
                >
                  {proc} ({count})
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Grinds Cards List */}
      {filteredGrinds.length > 0 ? (
        <div className="space-y-3.5">
          {filteredGrinds.map((grind) => (
            <GrindCard
              key={grind.id}
              grind={grind}
              onEdit={openEditModal}
              onDelete={onDeleteGrind}
            />
          ))}
        </div>
      ) : (
        <div className="p-8 text-center rounded-4xl bg-white dark:bg-darkbg-card border border-coffee-200/80 dark:border-darkbg-border shadow-soft space-y-3">
          <Coffee className="w-12 h-12 text-coffee-300 dark:text-coffee-600 mx-auto" />
          <h3 className="text-base font-bold text-coffee-900 dark:text-coffee-100">
            {t('noGrindsFound')}
          </h3>
          <p className="text-xs text-coffee-500 dark:text-coffee-400 max-w-[240px] mx-auto">
            {hasActiveFilters ? t('noGrindsFoundDesc') : t('noGrindsYet')}
          </p>
          {hasActiveFilters ? (
            <button
              onClick={clearFilters}
              className="mt-2 text-xs font-bold text-terracotta hover:underline"
            >
              {t('clearFilters')}
            </button>
          ) : (
            <button
              onClick={onNavigateNew}
              className="mt-3 px-4 py-2 rounded-xl bg-terracotta text-white text-xs font-bold shadow-sm"
            >
              {t('registerFirstGrind')}
            </button>
          )}
        </div>
      )}

      {/* Modal / Popup flotante para editar molienda */}
      <Modal
        isOpen={!!editingGrind}
        onClose={closeEditModal}
        title={t('editGrindTitle')}
      >
        <form onSubmit={handleSaveEdit} className="space-y-4">
          {/* Molino */}
          <div>
            <label className="block text-xs font-bold text-coffee-700 dark:text-coffee-300 uppercase tracking-wider mb-1">
              {t('selectMillLabel')}
            </label>
            <select
              value={editForm.molino}
              onChange={(e) => setEditForm({ ...editForm, molino: e.target.value })}
              className="w-full px-4 py-2.5 rounded-2xl bg-white dark:bg-darkbg-input border border-coffee-200 dark:border-darkbg-border text-coffee-900 dark:text-coffee-100 text-sm font-semibold focus:ring-2 focus:ring-terracotta/40"
            >
              {mills.map((m) => (
                <option key={m.id} value={m.nombre}>
                  {m.nombre}
                </option>
              ))}
              {/* Fallback if mill was deleted */}
              {!mills.some(m => m.nombre === editForm.molino) && editForm.molino && (
                <option value={editForm.molino}>{editForm.molino}</option>
              )}
            </select>
          </div>

          {/* Café y Tostadero */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-bold text-coffee-700 dark:text-coffee-300 uppercase tracking-wider mb-1">
                {t('coffeeNameLabel')}
              </label>
              <input
                type="text"
                value={editForm.nombre_cafe}
                onChange={(e) => setEditForm({ ...editForm, nombre_cafe: e.target.value })}
                required
                className="w-full px-3 py-2 rounded-2xl bg-white dark:bg-darkbg-input border border-coffee-200 dark:border-darkbg-border text-coffee-900 dark:text-coffee-100 text-sm font-medium focus:ring-2 focus:ring-terracotta/40"
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
                required
                className="w-full px-3 py-2 rounded-2xl bg-white dark:bg-darkbg-input border border-coffee-200 dark:border-darkbg-border text-coffee-900 dark:text-coffee-100 text-sm font-medium focus:ring-2 focus:ring-terracotta/40"
              />
            </div>
          </div>

          {/* Método, Variedad, Proceso */}
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

          {/* Espresso conditional fields in Modal */}
          {editForm.metodo === 'Espresso' && (
            <div className="bg-orange-50/80 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800/40 p-3 rounded-2xl grid grid-cols-2 gap-2">
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
                  className="w-full px-2 py-1.5 rounded-lg bg-white dark:bg-darkbg-input border border-orange-300 font-mono text-xs"
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
                  className="w-full px-2 py-1.5 rounded-lg bg-white dark:bg-darkbg-input border border-orange-300 font-mono text-xs"
                />
              </div>
            </div>
          )}

          {/* País & Temperatura */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-bold text-coffee-700 dark:text-coffee-300 uppercase tracking-wider mb-1">
                {t('countryLabel')}
              </label>
              <input
                type="text"
                value={editForm.pais}
                onChange={(e) => setEditForm({ ...editForm, pais: e.target.value })}
                required
                className="w-full px-3 py-2 rounded-2xl bg-white dark:bg-darkbg-input border border-coffee-200 dark:border-darkbg-border text-coffee-900 dark:text-coffee-100 text-sm font-medium focus:ring-2 focus:ring-terracotta/40"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-coffee-700 dark:text-coffee-300 uppercase tracking-wider mb-1">
                {t('waterTempLabel')}
              </label>
              <input
                type="number"
                value={editForm.temp_agua}
                onChange={(e) => setEditForm({ ...editForm, temp_agua: e.target.value })}
                className="w-full px-3 py-2 rounded-2xl bg-white dark:bg-darkbg-input border border-coffee-200 dark:border-darkbg-border text-coffee-900 dark:text-coffee-100 text-sm font-mono font-medium focus:ring-2 focus:ring-terracotta/40"
              />
            </div>
          </div>

          {/* Grado */}
          <div>
            <label className="block text-xs font-bold text-coffee-700 dark:text-coffee-300 uppercase tracking-wider mb-1">
              {t('grindSettingLabel')}
            </label>
            <input
              type="number"
              step="any"
              value={editForm.grado}
              onChange={(e) => setEditForm({ ...editForm, grado: e.target.value })}
              required
              className="w-full px-4 py-2.5 rounded-2xl bg-white dark:bg-darkbg-input border border-coffee-200 dark:border-darkbg-border text-coffee-900 dark:text-coffee-100 text-base font-mono font-bold focus:ring-2 focus:ring-terracotta/40"
            />
          </div>

          {/* Perfil de Sabor */}
          <div>
            <label className="block text-xs font-bold text-coffee-700 dark:text-coffee-300 uppercase tracking-wider mb-1">
              {t('flavorProfileLabel')}
            </label>
            <input
              type="text"
              value={editForm.perfil_sabor}
              onChange={(e) => setEditForm({ ...editForm, perfil_sabor: e.target.value })}
              className="w-full px-3 py-2 rounded-2xl bg-white dark:bg-darkbg-input border border-coffee-200 dark:border-darkbg-border text-coffee-900 dark:text-coffee-100 text-sm focus:ring-2 focus:ring-terracotta/40"
            />
          </div>

          {/* Comentarios */}
          <div>
            <label className="block text-xs font-bold text-coffee-700 dark:text-coffee-300 uppercase tracking-wider mb-1">
              {t('commentsLabel')}
            </label>
            <textarea
              rows="2"
              value={editForm.comentario}
              onChange={(e) => setEditForm({ ...editForm, comentario: e.target.value })}
              className="w-full px-3 py-2 rounded-2xl bg-white dark:bg-darkbg-input border border-coffee-200 dark:border-darkbg-border text-coffee-900 dark:text-coffee-100 text-sm focus:ring-2 focus:ring-terracotta/40 resize-none"
            />
          </div>

          <div className="pt-2 flex gap-2">
            <button
              type="button"
              onClick={closeEditModal}
              className="flex-1 py-3 px-4 rounded-2xl bg-coffee-100 hover:bg-coffee-200 dark:bg-darkbg-input text-coffee-700 dark:text-coffee-300 font-bold text-xs transition-colors"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              disabled={isUpdating}
              className="flex-1 py-3 px-4 rounded-2xl bg-terracotta hover:bg-terracotta-dark text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
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
    </div>
  );
};

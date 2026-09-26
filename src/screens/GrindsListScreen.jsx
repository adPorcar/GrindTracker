import React, { useState, useMemo } from 'react';
import { Search, Filter, Coffee, RefreshCw, X, AlertCircle, Scale, Thermometer } from 'lucide-react';
import { GrindCard } from '../components/GrindCard';
import { Modal } from '../components/Modal';
import { EditGrindModal } from '../components/EditGrindModal';
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
  };

  const closeEditModal = () => {
    setEditingGrind(null);
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
      <EditGrindModal
        isOpen={Boolean(editingGrind)}
        onClose={closeEditModal}
        grind={editingGrind}
        mills={mills}
        onSave={onUpdateGrind}
      />
    </div>
  );
};

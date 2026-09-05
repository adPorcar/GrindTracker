import React, { useState, useMemo } from 'react';
import { Search, Filter, Coffee, RefreshCw, X, AlertCircle } from 'lucide-react';
import { GrindCard } from '../components/GrindCard';
import { Modal } from '../components/Modal';

const COFFEE_METHODS = [
  'Espresso',
  'Mokka',
  'Filtro',
  'Aeropress',
  'Prensa Francesa',
  'Cold Brew'
];

export const GrindsListScreen = ({
  grinds,
  loading,
  onRefresh,
  onUpdateGrind,
  onDeleteGrind,
  onNavigateNew
}) => {
  // Filters
  const [selectedMill, setSelectedMill] = useState('ALL');
  const [selectedCountry, setSelectedCountry] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Editing state
  const [editingGrind, setEditingGrind] = useState(null);
  const [editForm, setEditForm] = useState({
    molino: '',
    metodo: 'Espresso',
    pais: '',
    grado: 0,
    comentario: ''
  });
  const [isUpdating, setIsUpdating] = useState(false);

  // Extract unique filter options
  const uniqueMills = useMemo(() => {
    return Array.from(new Set(grinds.map(g => g.molino).filter(Boolean)));
  }, [grinds]);

  const uniqueCountries = useMemo(() => {
    return Array.from(new Set(grinds.map(g => g.pais).filter(Boolean)));
  }, [grinds]);

  // Filtered grinds list
  const filteredGrinds = useMemo(() => {
    return grinds.filter(item => {
      const matchMill = selectedMill === 'ALL' || item.molino === selectedMill;
      const matchCountry = selectedCountry === 'ALL' || item.pais === selectedCountry;
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        (item.molino && item.molino.toLowerCase().includes(q)) ||
        (item.pais && item.pais.toLowerCase().includes(q)) ||
        (item.metodo && item.metodo.toLowerCase().includes(q)) ||
        (item.comentario && item.comentario.toLowerCase().includes(q));

      return matchMill && matchCountry && matchSearch;
    });
  }, [grinds, selectedMill, selectedCountry, searchQuery]);

  const openEditModal = (grind) => {
    setEditingGrind(grind);
    setEditForm({
      molino: grind.molino || '',
      metodo: grind.metodo || 'Espresso',
      pais: grind.pais || '',
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
    setIsUpdating(true);
    try {
      await onUpdateGrind({
        id: editingGrind.id,
        ...editForm,
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
    setSearchQuery('');
  };

  const hasActiveFilters = selectedMill !== 'ALL' || selectedCountry !== 'ALL' || searchQuery !== '';

  return (
    <div className="max-w-md mx-auto space-y-5 pb-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-coffee-900 dark:text-coffee-100">
            Mis Moliendas
          </h1>
          <p className="text-xs text-coffee-500 dark:text-coffee-400 mt-0.5">
            {filteredGrinds.length} de {grinds.length} recetas filtradas
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
          placeholder="Buscar por molino, país, notas..."
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

      {/* Dynamic Filters Section (Molino & País) */}
      <div className="bg-white dark:bg-darkbg-card p-4 rounded-3xl border border-coffee-200/70 dark:border-darkbg-border shadow-soft dark:shadow-dark-soft space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-coffee-700 dark:text-coffee-300 uppercase tracking-wider flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-terracotta" />
            <span>Filtros Dinámicos</span>
          </span>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-[11px] font-bold text-terracotta hover:underline"
            >
              Limpiar filtros
            </button>
          )}
        </div>

        {/* Filter 1: Molino */}
        <div>
          <label className="text-[11px] font-semibold text-coffee-500 dark:text-coffee-400 block mb-1">
            Filtrar por Molino:
          </label>
          <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            <button
              onClick={() => setSelectedMill('ALL')}
              className={`text-xs px-3 py-1.5 rounded-xl whitespace-nowrap font-semibold transition-all ${
                selectedMill === 'ALL'
                  ? 'bg-coffee-800 dark:bg-terracotta text-white shadow-sm'
                  : 'bg-coffee-100/80 dark:bg-darkbg-input text-coffee-600 dark:text-coffee-300 hover:bg-coffee-200'
              }`}
            >
              Todos ({grinds.length})
            </button>
            {uniqueMills.map((mill) => (
              <button
                key={mill}
                onClick={() => setSelectedMill(mill)}
                className={`text-xs px-3 py-1.5 rounded-xl whitespace-nowrap font-semibold transition-all ${
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
            Filtrar por País / Origen:
          </label>
          <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            <button
              onClick={() => setSelectedCountry('ALL')}
              className={`text-xs px-3 py-1.5 rounded-xl whitespace-nowrap font-semibold transition-all ${
                selectedCountry === 'ALL'
                  ? 'bg-coffee-800 dark:bg-terracotta text-white shadow-sm'
                  : 'bg-coffee-100/80 dark:bg-darkbg-input text-coffee-600 dark:text-coffee-300 hover:bg-coffee-200'
              }`}
            >
              Todos
            </button>
            {uniqueCountries.map((country) => (
              <button
                key={country}
                onClick={() => setSelectedCountry(country)}
                className={`text-xs px-3 py-1.5 rounded-xl whitespace-nowrap font-semibold transition-all ${
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
            No se encontraron moliendas
          </h3>
          <p className="text-xs text-coffee-500 dark:text-coffee-400 max-w-[240px] mx-auto">
            {hasActiveFilters
              ? 'Prueba a cambiar o limpiar los filtros seleccionados.'
              : 'Añade tu primera molienda para empezar a calificar tus tazas.'}
          </p>
          {hasActiveFilters ? (
            <button
              onClick={clearFilters}
              className="mt-2 text-xs font-bold text-terracotta hover:underline"
            >
              Restablecer filtros
            </button>
          ) : (
            <button
              onClick={onNavigateNew}
              className="mt-3 px-4 py-2 rounded-xl bg-terracotta text-white text-xs font-bold shadow-sm"
            >
              Nueva Molienda
            </button>
          )}
        </div>
      )}

      {/* Modal / Popup flotante para editar molienda */}
      <Modal
        isOpen={!!editingGrind}
        onClose={closeEditModal}
        title="Editar Molienda"
      >
        <form onSubmit={handleSaveEdit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-coffee-700 dark:text-coffee-300 uppercase tracking-wider mb-1">
              Molino
            </label>
            <input
              type="text"
              value={editForm.molino}
              onChange={(e) => setEditForm({ ...editForm, molino: e.target.value })}
              required
              className="w-full px-4 py-2.5 rounded-2xl bg-white dark:bg-darkbg-input border border-coffee-200 dark:border-darkbg-border text-coffee-900 dark:text-coffee-100 text-sm font-medium focus:ring-2 focus:ring-terracotta/40"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-coffee-700 dark:text-coffee-300 uppercase tracking-wider mb-1">
              Método
            </label>
            <select
              value={editForm.metodo}
              onChange={(e) => setEditForm({ ...editForm, metodo: e.target.value })}
              className="w-full px-4 py-2.5 rounded-2xl bg-white dark:bg-darkbg-input border border-coffee-200 dark:border-darkbg-border text-coffee-900 dark:text-coffee-100 text-sm font-semibold focus:ring-2 focus:ring-terracotta/40"
            >
              {COFFEE_METHODS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-coffee-700 dark:text-coffee-300 uppercase tracking-wider mb-1">
              País / Variedad
            </label>
            <input
              type="text"
              value={editForm.pais}
              onChange={(e) => setEditForm({ ...editForm, pais: e.target.value })}
              required
              className="w-full px-4 py-2.5 rounded-2xl bg-white dark:bg-darkbg-input border border-coffee-200 dark:border-darkbg-border text-coffee-900 dark:text-coffee-100 text-sm font-medium focus:ring-2 focus:ring-terracotta/40"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-coffee-700 dark:text-coffee-300 uppercase tracking-wider mb-1">
              Grado de Molienda (Paso / Clic)
            </label>
            <input
              type="number"
              step="0.1"
              value={editForm.grado}
              onChange={(e) => setEditForm({ ...editForm, grado: parseFloat(e.target.value) })}
              required
              className="w-full px-4 py-2.5 rounded-2xl bg-white dark:bg-darkbg-input border border-coffee-200 dark:border-darkbg-border text-coffee-900 dark:text-coffee-100 text-base font-mono font-bold focus:ring-2 focus:ring-terracotta/40"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-coffee-700 dark:text-coffee-300 uppercase tracking-wider mb-1">
              Comentarios y Notas
            </label>
            <textarea
              rows="3"
              value={editForm.comentario}
              onChange={(e) => setEditForm({ ...editForm, comentario: e.target.value })}
              className="w-full px-4 py-2.5 rounded-2xl bg-white dark:bg-darkbg-input border border-coffee-200 dark:border-darkbg-border text-coffee-900 dark:text-coffee-100 text-sm focus:ring-2 focus:ring-terracotta/40 resize-none"
            />
          </div>

          <div className="pt-2 flex gap-2">
            <button
              type="button"
              onClick={closeEditModal}
              className="flex-1 py-3 px-4 rounded-2xl bg-coffee-100 hover:bg-coffee-200 dark:bg-darkbg-input text-coffee-700 dark:text-coffee-300 font-bold text-xs transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isUpdating}
              className="flex-1 py-3 px-4 rounded-2xl bg-terracotta hover:bg-terracotta-dark text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
            >
              {isUpdating ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                'Guardar Cambios'
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

import React, { useState } from 'react';
import { Sliders, Plus, Edit3, Trash2, CheckCircle2, AlertCircle, Hash, Disc, ArrowRight } from 'lucide-react';
import { Modal } from '../components/Modal';
import { useLanguage } from '../context/LanguageContext';

export const GrindersScreen = ({
  mills,
  loading,
  onAddMill,
  onUpdateMill,
  onDeleteMill,
  onNavigateNewGrind
}) => {
  const { t } = useLanguage();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMill, setEditingMill] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    nombre: '',
    tipo: 'clicks', // 'clicks' | 'dial'
    total_clicks: 40,
    total_numeros: 11,
    pasos_por_numero: 3
  });

  const openAddModal = () => {
    setEditingMill(null);
    setFormData({
      nombre: '',
      tipo: 'clicks',
      total_clicks: 40,
      total_numeros: 11,
      pasos_por_numero: 3
    });
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const openEditModal = (mill) => {
    setEditingMill(mill);
    setFormData({
      nombre: mill.nombre || '',
      tipo: mill.tipo || 'clicks',
      total_clicks: mill.total_clicks || 40,
      total_numeros: mill.total_numeros || 10,
      pasos_por_numero: mill.pasos_por_numero || 3
    });
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingMill(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!formData.nombre.trim()) {
      setErrorMsg(t('errorAllFields'));
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingMill) {
        await onUpdateMill({
          id: editingMill.id,
          ...formData,
          fecha_creacion: editingMill.fecha_creacion
        });
      } else {
        await onAddMill(formData);
      }
      closeModal();
      setSuccessMsg(t('millSavedSuccess'));
      setTimeout(() => setSuccessMsg(''), 2500);
    } catch (err) {
      setErrorMsg(err.message || 'Error al guardar molino');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto space-y-5 pb-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-coffee-900 dark:text-coffee-100 flex items-center gap-2">
            <span>{t('millsTitle')}</span>
          </h1>
          <p className="text-xs text-coffee-500 dark:text-coffee-400 mt-0.5">
            {t('millsSubtitle')}
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-terracotta hover:bg-terracotta-dark text-white text-xs font-bold shadow-soft transition-transform active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>{t('newMillButton')}</span>
        </button>
      </div>

      {/* Success Notification */}
      {successMsg && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 flex items-center gap-2.5 text-xs text-emerald-800 dark:text-emerald-200 animate-in zoom-in-95">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
          <span className="font-semibold">{successMsg}</span>
        </div>
      )}

      {/* Mills Cards List */}
      {mills && mills.length > 0 ? (
        <div className="space-y-3.5">
          {mills.map((mill) => {
            const isDial = mill.tipo === 'dial';
            const totalPositions = isDial
              ? (Number(mill.total_numeros) || 0) * (Number(mill.pasos_por_numero) || 1)
              : Number(mill.total_clicks) || 0;

            return (
              <div
                key={mill.id}
                className="bg-white dark:bg-darkbg-card rounded-3xl p-5 border border-coffee-200/70 dark:border-darkbg-border shadow-soft dark:shadow-dark-soft hover:shadow-soft-lg transition-all"
              >
                {/* Header: Name and Type Badge */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-10 h-10 rounded-2xl bg-coffee-100 dark:bg-darkbg-input text-terracotta flex items-center justify-center flex-shrink-0">
                      {isDial ? (
                        <Disc className="w-5 h-5" />
                      ) : (
                        <Hash className="w-5 h-5" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-base text-coffee-900 dark:text-coffee-100 truncate">
                        {mill.nombre}
                      </h3>
                      <span className="text-[11px] text-coffee-400">
                        {mill.fecha_creacion || t('today')}
                      </span>
                    </div>
                  </div>

                  {/* Badge */}
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-xl text-[11px] font-bold border ${
                      isDial
                        ? 'bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-800/40'
                        : 'bg-coffee-100 text-coffee-800 dark:bg-coffee-950/40 dark:text-coffee-300 border-coffee-200 dark:border-coffee-800/40'
                    }`}
                  >
                    {isDial ? t('millTypeDial') : t('millTypeClicks')}
                  </span>
                </div>

                {/* Configuration Summary Pill Box */}
                <div className="bg-coffee-50/70 dark:bg-darkbg-input/60 rounded-2xl p-3 border border-coffee-200/50 dark:border-darkbg-border/50 grid grid-cols-2 gap-2 text-xs mb-3">
                  {isDial ? (
                    <>
                      <div>
                        <span className="text-coffee-400 block text-[10px] uppercase font-bold">
                          {t('totalNumbersLabel').replace(' *', '')}
                        </span>
                        <span className="font-mono font-bold text-coffee-800 dark:text-coffee-200">
                          {mill.total_numeros} números
                        </span>
                      </div>
                      <div>
                        <span className="text-coffee-400 block text-[10px] uppercase font-bold">
                          {t('stepsPerNumberLabel').replace(' *', '')}
                        </span>
                        <span className="font-mono font-bold text-coffee-800 dark:text-coffee-200">
                          {mill.pasos_por_numero} pasos/núm
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="col-span-2">
                      <span className="text-coffee-400 block text-[10px] uppercase font-bold">
                        {t('totalClicksLabel').replace(' *', '')}
                      </span>
                      <span className="font-mono font-bold text-coffee-800 dark:text-coffee-200">
                        0 - {mill.total_clicks} clicks
                      </span>
                    </div>
                  )}
                </div>

                {/* Footer: Positions and Actions */}
                <div className="flex items-center justify-between pt-2 border-t border-coffee-100 dark:border-darkbg-border/60 text-xs">
                  <span className="text-[11px] font-medium text-coffee-500 dark:text-coffee-400">
                    {t('totalPositions', { count: totalPositions })}
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => openEditModal(mill)}
                      className="p-2 rounded-xl bg-coffee-100/70 hover:bg-coffee-200 dark:bg-darkbg-input dark:hover:bg-darkbg-cardHover text-coffee-700 dark:text-coffee-200 transition-colors"
                      title={t('editMillTitle')}
                      aria-label={t('editMillTitle')}
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm(t('deleteMillConfirm'))) {
                          onDeleteMill(mill.id);
                        }
                      }}
                      className="p-2 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                      title="Eliminar molino"
                      aria-label="Eliminar molino"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-8 text-center rounded-4xl bg-white dark:bg-darkbg-card border border-coffee-200/80 dark:border-darkbg-border shadow-soft space-y-3">
          <Sliders className="w-12 h-12 text-coffee-300 dark:text-coffee-600 mx-auto" />
          <h3 className="text-base font-bold text-coffee-900 dark:text-coffee-100">
            {t('noMillsYet')}
          </h3>
          <p className="text-xs text-coffee-500 dark:text-coffee-400 max-w-[260px] mx-auto">
            Configura tus molinos manuales o eléctricos para calibrar tus grados de molienda con precisión.
          </p>
          <button
            onClick={openAddModal}
            className="mt-3 inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-terracotta text-white text-xs font-bold shadow-soft"
          >
            <Plus className="w-4 h-4" />
            <span>{t('addFirstMill')}</span>
          </button>
        </div>
      )}

      {/* Modal Creación / Edición de Molino */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingMill ? t('editMillTitle') : t('createMillTitle')}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 flex items-start gap-2 text-xs text-red-700 dark:text-red-300">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Nombre del Molino */}
          <div>
            <label className="block text-xs font-bold text-coffee-700 dark:text-coffee-300 uppercase tracking-wider mb-1.5">
              {t('millNameLabel')}
            </label>
            <input
              type="text"
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              placeholder={t('millNamePlaceholder')}
              required
              className="w-full px-4 py-3 rounded-2xl bg-coffee-50/50 dark:bg-darkbg-input border border-coffee-200 dark:border-darkbg-border text-coffee-900 dark:text-coffee-100 text-sm font-medium focus:ring-2 focus:ring-terracotta/40 focus:outline-none"
            />
          </div>

          {/* Tipo de Ajuste: Clicks vs Dial */}
          <div>
            <label className="block text-xs font-bold text-coffee-700 dark:text-coffee-300 uppercase tracking-wider mb-1.5">
              {t('millTypeLabel')}
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, tipo: 'clicks' })}
                className={`py-3 px-3 rounded-2xl text-xs font-bold border transition-all flex items-center justify-center gap-2 ${
                  formData.tipo === 'clicks'
                    ? 'bg-coffee-800 dark:bg-terracotta text-white border-coffee-800 dark:border-terracotta shadow-sm'
                    : 'bg-white dark:bg-darkbg-input text-coffee-600 dark:text-coffee-300 border-coffee-200 dark:border-darkbg-border'
                }`}
              >
                <Hash className="w-4 h-4" />
                <span>{t('millTypeClicks')}</span>
              </button>

              <button
                type="button"
                onClick={() => setFormData({ ...formData, tipo: 'dial' })}
                className={`py-3 px-3 rounded-2xl text-xs font-bold border transition-all flex items-center justify-center gap-2 ${
                  formData.tipo === 'dial'
                    ? 'bg-coffee-800 dark:bg-terracotta text-white border-coffee-800 dark:border-terracotta shadow-sm'
                    : 'bg-white dark:bg-darkbg-input text-coffee-600 dark:text-coffee-300 border-coffee-200 dark:border-darkbg-border'
                }`}
              >
                <Disc className="w-4 h-4" />
                <span>{t('millTypeDial')}</span>
              </button>
            </div>
          </div>

          {/* Campos condicionales según tipo */}
          {formData.tipo === 'clicks' ? (
            <div>
              <label className="block text-xs font-bold text-coffee-700 dark:text-coffee-300 uppercase tracking-wider mb-1">
                {t('totalClicksLabel')}
              </label>
              <input
                type="number"
                min="1"
                max="200"
                value={formData.total_clicks}
                onChange={(e) => setFormData({ ...formData, total_clicks: parseInt(e.target.value) || 0 })}
                required
                className="w-full px-4 py-3 rounded-2xl bg-coffee-50/50 dark:bg-darkbg-input border border-coffee-200 dark:border-darkbg-border text-coffee-900 dark:text-coffee-100 text-base font-mono font-bold focus:ring-2 focus:ring-terracotta/40 focus:outline-none"
              />
              <span className="text-[11px] text-coffee-400 mt-1 block">
                {t('totalClicksHelp')}
              </span>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-coffee-700 dark:text-coffee-300 uppercase tracking-wider mb-1">
                  {t('totalNumbersLabel')}
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={formData.total_numeros}
                  onChange={(e) => setFormData({ ...formData, total_numeros: parseInt(e.target.value) || 0 })}
                  required
                  className="w-full px-4 py-3 rounded-2xl bg-coffee-50/50 dark:bg-darkbg-input border border-coffee-200 dark:border-darkbg-border text-coffee-900 dark:text-coffee-100 text-base font-mono font-bold focus:ring-2 focus:ring-terracotta/40 focus:outline-none"
                />
                <span className="text-[10px] text-coffee-400 mt-1 block">
                  {t('totalNumbersHelp')}
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-coffee-700 dark:text-coffee-300 uppercase tracking-wider mb-1">
                  {t('stepsPerNumberLabel')}
                </label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={formData.pasos_por_numero}
                  onChange={(e) => setFormData({ ...formData, pasos_por_numero: parseInt(e.target.value) || 1 })}
                  required
                  className="w-full px-4 py-3 rounded-2xl bg-coffee-50/50 dark:bg-darkbg-input border border-coffee-200 dark:border-darkbg-border text-coffee-900 dark:text-coffee-100 text-base font-mono font-bold focus:ring-2 focus:ring-terracotta/40 focus:outline-none"
                />
                <span className="text-[10px] text-coffee-400 mt-1 block">
                  {t('stepsPerNumberHelp')}
                </span>
              </div>
            </div>
          )}

          {/* Botones de acción */}
          <div className="pt-3 flex gap-2">
            <button
              type="button"
              onClick={closeModal}
              className="flex-1 py-3.5 px-4 rounded-2xl bg-coffee-100 hover:bg-coffee-200 dark:bg-darkbg-input text-coffee-700 dark:text-coffee-300 font-bold text-xs transition-colors"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-3.5 px-4 rounded-2xl bg-terracotta hover:bg-terracotta-dark text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50"
            >
              {isSubmitting ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                t('saveMill')
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

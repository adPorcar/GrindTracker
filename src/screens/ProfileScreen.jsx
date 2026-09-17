import React, { useState } from 'react';
import { User, KeyRound, LogOut, CheckCircle2, AlertCircle, FileSpreadsheet, ShieldCheck, Smartphone, Languages } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { isConfigured } from '../config';

export const ProfileScreen = () => {
  const { user, updateProfile, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();

  const [newUsername, setNewUsername] = useState(user?.username || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const configured = isConfigured();

  const handleUpdate = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!newUsername.trim()) {
      setErrorMsg(t('errorAllFields'));
      return;
    }

    if (newPassword && newPassword.length < 3) {
      setErrorMsg(t('errorPasswordLength'));
      return;
    }

    if (newPassword && newPassword !== confirmPassword) {
      setErrorMsg(t('errorPasswordMatch'));
      return;
    }

    setIsUpdating(true);
    try {
      const res = await updateProfile(
        newUsername !== user.username ? newUsername : undefined,
        newPassword || undefined
      );

      if (res.success) {
        setSuccessMsg(t('profileUpdatedSuccess'));
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setErrorMsg(res.message || 'Error al actualizar datos');
      }
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="max-w-md mx-auto space-y-5 pb-6 animate-in fade-in duration-200">
      {/* Profile Header Card */}
      <div className="bg-white dark:bg-darkbg-card rounded-4xl p-6 border border-coffee-200/80 dark:border-darkbg-border shadow-soft dark:shadow-dark-soft flex items-center gap-4">
        <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-coffee-800 to-terracotta text-white flex items-center justify-center font-black text-2xl shadow-sm flex-shrink-0">
          {user?.username ? user.username.charAt(0).toUpperCase() : 'B'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <h2 className="text-lg font-black text-coffee-900 dark:text-coffee-100 truncate">
              @{user?.username}
            </h2>
            <ShieldCheck className="w-4 h-4 text-emerald-500 flex-shrink-0" />
          </div>
          <p className="text-xs text-coffee-500 dark:text-coffee-400 truncate">
            {configured ? t('connected') : t('demoMode')}
          </p>
          {user?.user_sheet_id && (
            <div className="mt-1 flex items-center gap-1 text-[11px] text-coffee-400 font-mono truncate">
              <FileSpreadsheet className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">Hoja: {user.user_sheet_id}</span>
            </div>
          )}
        </div>
      </div>

      {/* Language Preferences Selector */}
      <div className="bg-white dark:bg-darkbg-card rounded-4xl p-6 border border-coffee-200/80 dark:border-darkbg-border shadow-soft dark:shadow-dark-soft space-y-3">
        <div>
          <h3 className="text-xs font-bold text-coffee-900 dark:text-coffee-100 uppercase tracking-wider flex items-center gap-2">
            <Languages className="w-4 h-4 text-terracotta" />
            <span>{t('languagePreferencesTitle')}</span>
          </h3>
          <p className="text-xs text-coffee-500 dark:text-coffee-400 mt-0.5">
            {t('languagePreferencesDesc')}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            type="button"
            onClick={() => setLanguage('es')}
            className={`py-3 px-4 rounded-2xl text-xs font-bold transition-all border flex items-center justify-center gap-2 ${
              language === 'es'
                ? 'bg-coffee-800 dark:bg-terracotta text-white border-coffee-800 dark:border-terracotta shadow-xs'
                : 'bg-coffee-50/70 dark:bg-darkbg-input text-coffee-700 dark:text-coffee-300 border-coffee-200 dark:border-darkbg-border'
            }`}
          >
            <span>🇪🇸 {t('spanish')}</span>
          </button>

          <button
            type="button"
            onClick={() => setLanguage('en')}
            className={`py-3 px-4 rounded-2xl text-xs font-bold transition-all border flex items-center justify-center gap-2 ${
              language === 'en'
                ? 'bg-coffee-800 dark:bg-terracotta text-white border-coffee-800 dark:border-terracotta shadow-xs'
                : 'bg-coffee-50/70 dark:bg-darkbg-input text-coffee-700 dark:text-coffee-300 border-coffee-200 dark:border-darkbg-border'
            }`}
          >
            <span>🇬🇧 {t('english')}</span>
          </button>
        </div>
      </div>

      {/* Edit Credentials Form */}
      <div className="bg-white dark:bg-darkbg-card rounded-4xl p-6 border border-coffee-200/80 dark:border-darkbg-border shadow-soft dark:shadow-dark-soft space-y-5">
        <div>
          <h3 className="text-xs font-bold text-coffee-900 dark:text-coffee-100 uppercase tracking-wider flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-terracotta" />
            <span>{t('updateCredentials')}</span>
          </h3>
          <p className="text-xs text-coffee-500 dark:text-coffee-400 mt-0.5">
            {t('updateCredentialsDesc')}
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 flex items-start gap-2.5 text-xs text-red-700 dark:text-red-300">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 flex items-start gap-2.5 text-xs text-emerald-700 dark:text-emerald-300">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleUpdate} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-coffee-700 dark:text-coffee-300 uppercase tracking-wider mb-1.5">
              {t('newUsernameLabel')}
            </label>
            <input
              type="text"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-2xl bg-coffee-50/50 dark:bg-darkbg-input border border-coffee-200 dark:border-darkbg-border text-coffee-900 dark:text-coffee-100 text-sm font-medium focus:ring-2 focus:ring-terracotta/40 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-coffee-700 dark:text-coffee-300 uppercase tracking-wider mb-1.5">
              {t('newPasswordLabel')}
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder={t('newPasswordPlaceholder')}
              className="w-full px-4 py-3 rounded-2xl bg-coffee-50/50 dark:bg-darkbg-input border border-coffee-200 dark:border-darkbg-border text-coffee-900 dark:text-coffee-100 text-sm font-medium focus:ring-2 focus:ring-terracotta/40 focus:outline-none"
            />
          </div>

          {newPassword && (
            <div>
              <label className="block text-xs font-bold text-coffee-700 dark:text-coffee-300 uppercase tracking-wider mb-1.5">
                {t('confirmNewPasswordLabel')}
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder={t('newPasswordPlaceholder')}
                className="w-full px-4 py-3 rounded-2xl bg-coffee-50/50 dark:bg-darkbg-input border border-coffee-200 dark:border-darkbg-border text-coffee-900 dark:text-coffee-100 text-sm font-medium focus:ring-2 focus:ring-terracotta/40 focus:outline-none"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={isUpdating}
            className="w-full py-3.5 px-4 rounded-2xl bg-coffee-800 hover:bg-coffee-900 dark:bg-terracotta dark:hover:bg-terracotta-dark text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50"
          >
            {isUpdating ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              t('saveProfile')
            )}
          </button>
        </form>
      </div>

      {/* Security Architecture & Session Tokens Info */}
      <div className="bg-white dark:bg-darkbg-card rounded-4xl p-6 border border-coffee-200/80 dark:border-darkbg-border shadow-soft dark:shadow-dark-soft space-y-3">
        <h3 className="text-xs font-bold text-coffee-900 dark:text-coffee-100 uppercase tracking-wider flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>{t('securityTitle')}</span>
        </h3>

        <div className="space-y-2 text-xs">
          <div className="p-3 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200/70 dark:border-emerald-900/50 text-emerald-900 dark:text-emerald-300">
            <span className="font-bold block mb-1">
              ✓ {t('sessionTokenActive')}
            </span>
            <p className="text-[11px] text-emerald-800/90 dark:text-emerald-300/90 leading-relaxed">
              {t('sessionTokenDesc')}
            </p>
          </div>

          <div className="flex items-center justify-between p-2.5 rounded-xl bg-coffee-50/60 dark:bg-darkbg-input">
            <span className="text-coffee-600 dark:text-coffee-400 font-medium">Instalación PWA iOS</span>
            <span className="text-coffee-700 dark:text-coffee-300 font-semibold text-[11px]">
              Safari: Compartir → Añadir a inicio
            </span>
          </div>
        </div>
      </div>

      {/* Logout Action */}
      <div className="pt-1">
        <button
          onClick={logout}
          className="w-full py-3.5 px-4 rounded-2xl bg-red-50 hover:bg-red-100 dark:bg-red-950/30 dark:hover:bg-red-950/50 text-red-600 dark:text-red-400 border border-red-200/80 dark:border-red-900/50 font-bold text-xs transition-all flex items-center justify-center gap-2 active:scale-98"
        >
          <LogOut className="w-4 h-4" />
          <span>{t('logoutButton')}</span>
        </button>
      </div>
    </div>
  );
};

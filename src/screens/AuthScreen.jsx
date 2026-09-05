import React, { useState } from 'react';
import { Coffee, Lock, User, ArrowRight, Sparkles, CheckCircle2, AlertCircle, Sun, Moon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { isConfigured } from '../config';

export const AuthScreen = () => {
  const { isDark, toggleTheme } = useTheme();
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [localError, setLocalError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const { login, register, loading, authError, setAuthError } = useAuth();
  const configured = isConfigured();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');
    setSuccessMsg('');
    setAuthError(null);

    if (!username.trim() || !password.trim()) {
      setLocalError('Por favor, completa todos los campos.');
      return;
    }

    if (isRegister) {
      if (password.length < 3) {
        setLocalError('La contraseña debe tener al menos 3 caracteres.');
        return;
      }
      if (password !== confirmPassword) {
        setLocalError('Las contraseñas no coinciden.');
        return;
      }
      const res = await register(username, password);
      if (res.success) {
        setSuccessMsg('¡Usuario y hoja de cálculo creados con éxito!');
      }
    } else {
      await login(username, password);
    }
  };

  const fillDemoCredentials = () => {
    setUsername('barista');
    setPassword('123');
    setIsRegister(false);
  };

  return (
    <div className="min-h-full flex flex-col justify-between px-6 pt-safe pb-safe py-8 max-w-md mx-auto w-full animate-in fade-in duration-300">
      {/* Top Bar for Auth Screen */}
      <div className="flex justify-end w-full mb-4">
        <button
          onClick={toggleTheme}
          aria-label={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
          className="w-9 h-9 rounded-xl flex items-center justify-center bg-coffee-100/80 hover:bg-coffee-200/70 dark:bg-darkbg-card dark:hover:bg-darkbg-cardHover border border-coffee-200/60 dark:border-darkbg-border text-coffee-700 dark:text-coffee-200 transition-all active:scale-95 shadow-sm"
        >
          {isDark ? (
            <Sun className="w-4 h-4 text-amber-300 transition-transform rotate-0 hover:rotate-45" />
          ) : (
            <Moon className="w-4 h-4 text-coffee-600 transition-transform -rotate-12" />
          )}
        </button>
      </div>

      {/* Brand Header */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-tr from-coffee-700 via-coffee-600 to-terracotta text-white shadow-soft-lg mb-4">
          <Coffee className="w-10 h-10" />
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-coffee-900 dark:text-coffee-100">
          Molienda<span className="text-terracotta">Café</span>
        </h1>
        <p className="text-sm text-coffee-600 dark:text-coffee-400 mt-2 font-medium">
          El cuaderno digital de moliendas para apasionados del café
        </p>
      </div>

      {/* Main Card */}
      <div className="bg-white dark:bg-darkbg-card rounded-4xl p-7 border border-coffee-200/80 dark:border-darkbg-border shadow-soft dark:shadow-dark-soft">
        {/* Toggle Login / Register Tabs */}
        <div className="flex bg-coffee-100/70 dark:bg-darkbg-input p-1 rounded-2xl mb-6">
          <button
            type="button"
            onClick={() => {
              setIsRegister(false);
              setLocalError('');
              setAuthError(null);
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
              !isRegister
                ? 'bg-white dark:bg-darkbg-card text-coffee-900 dark:text-coffee-100 shadow-sm'
                : 'text-coffee-500 hover:text-coffee-800 dark:text-coffee-400'
            }`}
          >
            Iniciar Sesión
          </button>
          <button
            type="button"
            onClick={() => {
              setIsRegister(true);
              setLocalError('');
              setAuthError(null);
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
              isRegister
                ? 'bg-white dark:bg-darkbg-card text-coffee-900 dark:text-coffee-100 shadow-sm'
                : 'text-coffee-500 hover:text-coffee-800 dark:text-coffee-400'
            }`}
          >
            Crear Cuenta
          </button>
        </div>

        {/* Error / Success Notifications */}
        {(localError || authError) && (
          <div className="mb-4 p-3 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 flex items-start gap-2.5 text-xs text-red-700 dark:text-red-300">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{localError || authError}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 flex items-start gap-2.5 text-xs text-emerald-700 dark:text-emerald-300">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-coffee-700 dark:text-coffee-300 mb-1.5 uppercase tracking-wider">
              Usuario
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-coffee-400">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Ej. barista_marcos"
                autoCapitalize="none"
                autoCorrect="off"
                required
                className="w-full pl-10 pr-4 py-3 rounded-2xl bg-coffee-50/50 dark:bg-darkbg-input border border-coffee-200 dark:border-darkbg-border text-coffee-900 dark:text-coffee-100 placeholder-coffee-400 text-sm focus:outline-none focus:ring-2 focus:ring-terracotta/40 focus:border-terracotta transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-coffee-700 dark:text-coffee-300 mb-1.5 uppercase tracking-wider">
              Contraseña
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-coffee-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full pl-10 pr-4 py-3 rounded-2xl bg-coffee-50/50 dark:bg-darkbg-input border border-coffee-200 dark:border-darkbg-border text-coffee-900 dark:text-coffee-100 placeholder-coffee-400 text-sm focus:outline-none focus:ring-2 focus:ring-terracotta/40 focus:border-terracotta transition-all"
              />
            </div>
          </div>

          {isRegister && (
            <div>
              <label className="block text-xs font-bold text-coffee-700 dark:text-coffee-300 mb-1.5 uppercase tracking-wider">
                Confirmar Contraseña
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-coffee-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-2xl bg-coffee-50/50 dark:bg-darkbg-input border border-coffee-200 dark:border-darkbg-border text-coffee-900 dark:text-coffee-100 placeholder-coffee-400 text-sm focus:outline-none focus:ring-2 focus:ring-terracotta/40 focus:border-terracotta transition-all"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3.5 px-4 rounded-2xl bg-gradient-to-r from-coffee-700 to-terracotta hover:from-coffee-800 hover:to-terracotta-dark text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 active:scale-98 disabled:opacity-60"
          >
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>{isRegister ? 'Creando hoja y cuenta...' : 'Verificando...'}</span>
              </span>
            ) : (
              <>
                <span>{isRegister ? 'Crear Cuenta y Hoja' : 'Acceder al Cuaderno'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Demo Fast-login helper if not yet configured */}
        {!configured && !isRegister && (
          <div className="mt-6 pt-5 border-t border-coffee-100 dark:border-darkbg-border/60 text-center">
            <p className="text-xs text-coffee-500 dark:text-coffee-400 mb-2">
              ¿Quieres probar la interfaz sin configurar Google Sheets todavía?
            </p>
            <button
              type="button"
              onClick={fillDemoCredentials}
              className="text-xs font-bold text-terracotta dark:text-terracotta-light hover:underline inline-flex items-center gap-1"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Autocompletar usuario Demo (barista / 123)
            </button>
          </div>
        )}
      </div>

      {/* Info note */}
      <div className="mt-6 text-center text-xs text-coffee-500 dark:text-coffee-400">
        {configured ? (
          <span>Conectado a Google Sheets y Google Drive</span>
        ) : (
          <span>Modo Demo activo. Configura <code className="bg-coffee-200/50 dark:bg-darkbg-card px-1 py-0.5 rounded">src/config.js</code> para conectar tu Google Sheet.</span>
        )}
      </div>
    </div>
  );
};

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from './context/AuthContext';
import { api } from './services/api';
import { Navbar } from './components/Navbar';
import { BottomNav } from './components/BottomNav';
import { AuthScreen } from './screens/AuthScreen';
import { HomeScreen } from './screens/HomeScreen';
import { GrindersScreen } from './screens/GrindersScreen';
import { NewGrindScreen } from './screens/NewGrindScreen';
import { GrindsListScreen } from './screens/GrindsListScreen';
import { ProfileScreen } from './screens/ProfileScreen';

export function App() {
  const { user, sessionToken, isAuthenticated, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('home');
  
  // Data states
  const [grinds, setGrinds] = useState([]);
  const [mills, setMills] = useState([]);
  const [loadingGrinds, setLoadingGrinds] = useState(false);
  const [loadingMills, setLoadingMills] = useState(false);

  // Load grinders
  // Load grinders with resilient local-first fallback
  const loadMills = useCallback(async () => {
    if (!user || !user.user_sheet_id) return;
    setLoadingMills(true);
    const cacheKey = 'grind_cached_mills_' + user.user_sheet_id;

    // Load from local storage first for instant display
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        setMills(JSON.parse(cached));
      } catch (e) {
        console.warn('Error parsing cached mills:', e);
      }
    }

    try {
      const res = await api.getGrinders(user.user_sheet_id, user.username, sessionToken);
      if (res.unauthorized) {
        logout();
        return;
      }
      if (res.success && Array.isArray(res.grinders) && res.grinders.length > 0) {
        setMills(res.grinders);
        localStorage.setItem(cacheKey, JSON.stringify(res.grinders));
      } else if (!cached) {
        // No server data and no cache — start with empty list
        setMills([]);
      }
    } catch (err) {
      console.warn('[Grind Tracker] Servidor no disponible o no actualizado para molinos, usando copia local:', err);
    } finally {
      setLoadingMills(false);
    }
  }, [user, sessionToken, logout]);

  // Load grinds
  const loadGrinds = useCallback(async () => {
    if (!user || !user.user_sheet_id) return;
    setLoadingGrinds(true);
    try {
      const res = await api.getGrinds(user.user_sheet_id, user.username, sessionToken);
      if (res.unauthorized) {
        logout();
        return;
      }
      if (res.success && Array.isArray(res.grinds)) {
        setGrinds(res.grinds);
      }
    } catch (err) {
      console.error('[Grind Tracker] Error cargando moliendas:', err);
    } finally {
      setLoadingGrinds(false);
    }
  }, [user, sessionToken, logout]);

  // Load both mills & grinds upon login
  const loadAllData = useCallback(() => {
    loadMills();
    loadGrinds();
  }, [loadMills, loadGrinds]);

  useEffect(() => {
    if (isAuthenticated) {
      loadAllData();
    } else {
      setGrinds([]);
      setMills([]);
      setActiveTab('home');
    }
  }, [isAuthenticated, loadAllData]);

  // Handler: Add new grind
  const handleAddGrind = async (newGrindData) => {
    if (!user) return;
    const res = await api.addGrind(user.user_sheet_id, newGrindData, user.username, sessionToken);
    if (res.unauthorized) {
      logout();
      return;
    }
    if (res.success && res.grind) {
      setGrinds((prev) => [res.grind, ...prev]);
      setTimeout(() => {
        setActiveTab('grinds');
      }, 900);
    }
  };

  // Handler: Update grind
  const handleUpdateGrind = async (updatedData) => {
    if (!user) return;
    const res = await api.updateGrind(user.user_sheet_id, updatedData, user.username, sessionToken);
    if (res.unauthorized) {
      logout();
      return;
    }
    if (res.success) {
      setGrinds((prev) =>
        prev.map((g) => (String(g.id) === String(updatedData.id) ? { ...g, ...updatedData } : g))
      );
    }
  };

  // Handler: Delete grind
  const handleDeleteGrind = async (id) => {
    if (!user) return;
    const res = await api.deleteGrind(user.user_sheet_id, id, user.username, sessionToken);
    if (res.unauthorized) {
      logout();
      return;
    }
    if (res.success) {
      setGrinds((prev) => prev.filter((g) => String(g.id) !== String(id)));
    }
  };

  // Handler: Add mill (resilient local-first)
  const handleAddMill = async (newMillData) => {
    if (!user) return;
    const cacheKey = 'grind_cached_mills_' + user.user_sheet_id;
    const localMill = {
      id: 'mill_' + Date.now(),
      ...newMillData,
      fecha_creacion: new Date().toLocaleDateString('es-ES')
    };

    // 1. Inmediatamente guardar en memoria y en localStorage para que NUNCA se pierda
    setMills((prev) => {
      const updated = [...prev, localMill];
      localStorage.setItem(cacheKey, JSON.stringify(updated));
      return updated;
    });

    // 2. Intentar guardar en Google Sheets en segundo plano
    try {
      const res = await api.addGrinder(user.user_sheet_id, newMillData, user.username, sessionToken);
      if (res.unauthorized) {
        logout();
        return;
      }
      if (res.success && res.grinder) {
        // Actualizar el ID si Google Sheets generó uno específico
        setMills((prev) => {
          const updated = prev.map(m => m.id === localMill.id ? res.grinder : m);
          localStorage.setItem(cacheKey, JSON.stringify(updated));
          return updated;
        });
      }
    } catch (e) {
      console.warn('El molino se guardó en local. Requiere desplegar Code.gs en Google Apps Script para sincronizar con la nube:', e);
    }
  };

  // Handler: Update mill (resilient local-first)
  const handleUpdateMill = async (updatedMillData) => {
    if (!user) return;
    const cacheKey = 'grind_cached_mills_' + user.user_sheet_id;
    
    // Inmediatamente actualizar en memoria y localStorage
    setMills((prev) => {
      const updated = prev.map((m) =>
        String(m.id) === String(updatedMillData.id) ? { ...m, ...updatedMillData } : m
      );
      localStorage.setItem(cacheKey, JSON.stringify(updated));
      return updated;
    });

    try {
      const res = await api.updateGrinder(user.user_sheet_id, updatedMillData, user.username, sessionToken);
      if (res.unauthorized) {
        logout();
      }
    } catch (e) {
      console.warn('Actualizado localmente:', e);
    }
  };

  // Handler: Delete mill (resilient local-first)
  const handleDeleteMill = async (id) => {
    if (!user) return;
    const cacheKey = 'grind_cached_mills_' + user.user_sheet_id;

    // Inmediatamente eliminar de memoria y localStorage
    setMills((prev) => {
      const updated = prev.filter((m) => String(m.id) !== String(id));
      localStorage.setItem(cacheKey, JSON.stringify(updated));
      return updated;
    });

    try {
      await api.deleteGrinder(user.user_sheet_id, id, user.username, sessionToken);
    } catch (e) {
      console.warn('Eliminado localmente:', e);
    }
  };

  // If not logged in, show AuthScreen
  if (!isAuthenticated) {
    return (
      <main className="min-h-full flex flex-col justify-center bg-coffee-50 dark:bg-darkbg-base transition-colors duration-200">
        <AuthScreen />
      </main>
    );
  }

  return (
    <div className="min-h-full flex flex-col bg-coffee-50 dark:bg-darkbg-base text-coffee-900 dark:text-coffee-100 transition-colors duration-200">
      {/* Top Bar */}
      <Navbar />

      {/* Main Content Area with Safe Area Bottom Padding for iOS Mobile TabBar */}
      <main className="flex-1 max-w-md w-full mx-auto px-4 pt-4 pb-safe-nav">
        {activeTab === 'home' && (
          <HomeScreen
            grinds={grinds}
            mills={mills}
            onNavigate={(tab) => setActiveTab(tab)}
            onEditGrind={() => setActiveTab('grinds')}
            onDeleteGrind={handleDeleteGrind}
          />
        )}

        {activeTab === 'mills' && (
          <GrindersScreen
            mills={mills}
            loading={loadingMills}
            onAddMill={handleAddMill}
            onUpdateMill={handleUpdateMill}
            onDeleteMill={handleDeleteMill}
            onNavigateNewGrind={() => setActiveTab('new')}
          />
        )}

        {activeTab === 'new' && (
          <NewGrindScreen
            mills={mills}
            onSave={handleAddGrind}
            onNavigateMills={() => setActiveTab('mills')}
          />
        )}

        {activeTab === 'grinds' && (
          <GrindsListScreen
            grinds={grinds}
            mills={mills}
            loading={loadingGrinds}
            onRefresh={loadAllData}
            onUpdateGrind={handleUpdateGrind}
            onDeleteGrind={handleDeleteGrind}
            onNavigateNew={() => setActiveTab('new')}
          />
        )}

        {activeTab === 'profile' && <ProfileScreen />}
      </main>

      {/* Mobile Bottom Navigation Bar (5 tabs) */}
      <BottomNav
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab)}
      />
    </div>
  );
}

export default App;

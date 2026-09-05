import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from './context/AuthContext';
import { api } from './services/api';
import { Navbar } from './components/Navbar';
import { BottomNav } from './components/BottomNav';
import { AuthScreen } from './screens/AuthScreen';
import { HomeScreen } from './screens/HomeScreen';
import { NewGrindScreen } from './screens/NewGrindScreen';
import { GrindsListScreen } from './screens/GrindsListScreen';
import { ProfileScreen } from './screens/ProfileScreen';

export function App() {
  const { user, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState('home');
  const [grinds, setGrinds] = useState([]);
  const [loadingGrinds, setLoadingGrinds] = useState(false);
  const [editingTarget, setEditingTarget] = useState(null);

  // Fetch grinds when user is authenticated
  const loadGrinds = useCallback(async () => {
    if (!user || !user.user_sheet_id) return;
    setLoadingGrinds(true);
    try {
      const res = await api.getGrinds(user.user_sheet_id);
      if (res.success && Array.isArray(res.grinds)) {
        setGrinds(res.grinds);
      }
    } catch (err) {
      console.error('Error cargando moliendas:', err);
    } finally {
      setLoadingGrinds(false);
    }
  }, [user]);

  useEffect(() => {
    if (isAuthenticated) {
      loadGrinds();
    } else {
      setGrinds([]);
      setActiveTab('home');
    }
  }, [isAuthenticated, loadGrinds]);

  // Handler: Add new grind
  const handleAddGrind = async (newGrindData) => {
    if (!user) return;
    const res = await api.addGrind(user.user_sheet_id, newGrindData);
    if (res.success && res.grind) {
      setGrinds((prev) => [res.grind, ...prev]);
      // Small delay before navigating to grinds list so user sees success confirmation
      setTimeout(() => {
        setActiveTab('grinds');
      }, 900);
    }
  };

  // Handler: Update existing grind
  const handleUpdateGrind = async (updatedData) => {
    if (!user) return;
    const res = await api.updateGrind(user.user_sheet_id, updatedData);
    if (res.success) {
      setGrinds((prev) =>
        prev.map((g) => (String(g.id) === String(updatedData.id) ? { ...g, ...updatedData } : g))
      );
    }
  };

  // Handler: Delete grind
  const handleDeleteGrind = async (id) => {
    if (!window.confirm('¿Seguro que deseas eliminar esta molienda?')) return;
    const res = await api.deleteGrind(user.user_sheet_id, id);
    if (res.success) {
      setGrinds((prev) => prev.filter((g) => String(g.id) !== String(id)));
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

      {/* Main Content Area with Safe Area Bottom Padding for iOS TabBar */}
      <main className="flex-1 max-w-md w-full mx-auto px-4 pt-4 pb-safe-nav">
        {activeTab === 'home' && (
          <HomeScreen
            grinds={grinds}
            onNavigate={(tab) => setActiveTab(tab)}
            onEditGrind={() => setActiveTab('grinds')}
            onDeleteGrind={handleDeleteGrind}
          />
        )}

        {activeTab === 'new' && (
          <NewGrindScreen
            previousGrinds={grinds}
            onSave={handleAddGrind}
            onCancel={() => setActiveTab('home')}
          />
        )}

        {activeTab === 'grinds' && (
          <GrindsListScreen
            grinds={grinds}
            loading={loadingGrinds}
            onRefresh={loadGrinds}
            onUpdateGrind={handleUpdateGrind}
            onDeleteGrind={handleDeleteGrind}
            onNavigateNew={() => setActiveTab('new')}
          />
        )}

        {activeTab === 'profile' && <ProfileScreen />}
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <BottomNav
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab)}
      />
    </div>
  );
}

export default App;

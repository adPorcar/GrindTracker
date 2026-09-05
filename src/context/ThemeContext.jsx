import React, { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('molienda_theme');
    if (saved !== null) {
      return saved === 'dark';
    }
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    const root = document.documentElement;
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    
    if (isDark) {
      root.classList.add('dark');
      localStorage.setItem('molienda_theme', 'dark');
      if (metaTheme) metaTheme.setAttribute('content', '#131110');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('molienda_theme', 'light');
      if (metaTheme) metaTheme.setAttribute('content', '#FDFBF7');
    }
  }, [isDark]);

  const toggleTheme = () => setIsDark(prev => !prev);

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);

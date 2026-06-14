import { useState, useEffect } from 'react';
import { SettingsContext } from './settings-context';

export function SettingsProvider({ children }) {
  const [theme, setThemeState] = useState(() => localStorage.getItem('theme') || 'system');
  const [autoPlayAudio, setAutoPlayAudioState] = useState(() => localStorage.getItem('autoPlayAudio') !== 'false');
  const [jpFontScale, setJpFontScaleState] = useState(() => parseFloat(localStorage.getItem('jpFontScale')) || 1.0);
  const [showRomaji, setShowRomajiState] = useState(() => localStorage.getItem('showRomaji') !== 'false');
  const [language, setLanguageState] = useState(() => localStorage.getItem('language') || 'vi');

  useEffect(() => {
    const root = document.documentElement;

    const applyTheme = (t) => {
      const isDark = t === 'dark' || (t === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
      root.classList.toggle('dark', isDark);
    };

    applyTheme(theme);

    if (theme === 'system') {
      const media = window.matchMedia('(prefers-color-scheme: dark)');
      const handleMediaChange = (e) => {
        root.classList.toggle('dark', e.matches);
      };
      media.addEventListener('change', handleMediaChange);
      return () => media.removeEventListener('change', handleMediaChange);
    }
  }, [theme]);

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--jp-font-scale', `${jpFontScale}`);
  }, [jpFontScale]);

  const setTheme = (val) => {
    setThemeState(val);
    localStorage.setItem('theme', val);
  };

  const setAutoPlayAudio = (val) => {
    setAutoPlayAudioState(val);
    localStorage.setItem('autoPlayAudio', val ? 'true' : 'false');
  };

  const setJpFontScale = (val) => {
    setJpFontScaleState(val);
    localStorage.setItem('jpFontScale', val.toString());
  };

  const setShowRomaji = (val) => {
    setShowRomajiState(val);
    localStorage.setItem('showRomaji', val ? 'true' : 'false');
  };

  const setLanguage = (val) => {
    setLanguageState(val);
    localStorage.setItem('language', val);
  };

  const value = {
    theme,
    setTheme,
    autoPlayAudio,
    setAutoPlayAudio,
    jpFontScale,
    setJpFontScale,
    showRomaji,
    setShowRomaji,
    language,
    setLanguage,
  };

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}


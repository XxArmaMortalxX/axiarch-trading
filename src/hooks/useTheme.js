import { useState, useEffect, useCallback } from 'react';

export function useTheme() {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('axiarch_theme');
    return saved !== 'light';
  });

  useEffect(() => {
    document.body.classList.toggle('light-mode', !isDark);
    localStorage.setItem('axiarch_theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  const toggle = useCallback(() => setIsDark(d => !d), []);

  return { isDark, toggle };
}

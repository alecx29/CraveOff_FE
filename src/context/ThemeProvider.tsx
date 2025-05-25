import React, { createContext, useContext, useState } from 'react';

import DarkTheme from '@/assets/DarkTheme';
import LightTheme from '@/assets/LightTheme';

const ThemeContext = createContext({
  theme: DarkTheme,
  toggleTheme: () => {},
});

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [theme, setTheme] = useState(DarkTheme); // Default to LightTheme

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === LightTheme ? DarkTheme : LightTheme));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook to use the theme context
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

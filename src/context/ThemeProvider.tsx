import React, { createContext, useContext, useState } from 'react';

import DarkTheme from '@/assets/DarkTheme';
import LightTheme from '@/assets/LightTheme';

// Define a common theme type to handle both themes
type Theme = typeof DarkTheme | typeof LightTheme;

const ThemeContext = createContext({
  theme: DarkTheme as Theme,
  toggleTheme: () => {},
});

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [theme, setTheme] = useState<Theme>(DarkTheme); // Default to DarkTheme

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === DarkTheme ? LightTheme : DarkTheme));
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

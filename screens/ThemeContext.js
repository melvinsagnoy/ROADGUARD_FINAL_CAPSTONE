// ThemeContext.js
import React, { createContext, useState, useContext } from 'react';
import { DefaultTheme, DarkTheme } from 'react-native-paper';

const ThemeContext = createContext();

export const ThemeProvider = ({ children, colorScheme }) => {
  const [theme, setTheme] = useState(colorScheme === 'dark' ? DarkTheme : DefaultTheme);

  // Update theme when colorScheme changes
  React.useEffect(() => {
    setTheme(colorScheme === 'dark' ? DarkTheme : DefaultTheme);
  }, [colorScheme]);

  return (
    <ThemeContext.Provider value={{ theme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useThemeContext = () => useContext(ThemeContext);

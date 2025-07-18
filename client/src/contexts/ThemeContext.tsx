import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface ThemeContextType {
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  updateTheme: (colors: { primaryColor: string; secondaryColor: string; fontFamily: string }) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [primaryColor, setPrimaryColor] = useState('#3B82F6');
  const [secondaryColor, setSecondaryColor] = useState('#1F2937');
  const [fontFamily, setFontFamily] = useState('Inter');

  const updateTheme = (colors: { primaryColor: string; secondaryColor: string; fontFamily: string }) => {
    setPrimaryColor(colors.primaryColor);
    setSecondaryColor(colors.secondaryColor);
    setFontFamily(colors.fontFamily);

    // Apply CSS custom properties
    const root = document.documentElement;
    root.style.setProperty('--primary-color', colors.primaryColor);
    root.style.setProperty('--secondary-color', colors.secondaryColor);
    root.style.setProperty('--font-family', colors.fontFamily);
  };

  useEffect(() => {
    // Apply initial theme
    updateTheme({ primaryColor, secondaryColor, fontFamily });
  }, []);

  return (
    <ThemeContext.Provider value={{ primaryColor, secondaryColor, fontFamily, updateTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}; 
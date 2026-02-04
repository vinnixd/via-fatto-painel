import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type SiteTheme = 'theme-01' | 'theme-02';

interface SiteThemeContextType {
  siteTheme: SiteTheme;
  setSiteTheme: (theme: SiteTheme) => void;
  toggleSiteTheme: () => void;
}

const SiteThemeContext = createContext<SiteThemeContextType | undefined>(undefined);

export const SiteThemeProvider = ({ children }: { children: ReactNode }) => {
  const [siteTheme, setSiteTheme] = useState<SiteTheme>(() => {
    const stored = localStorage.getItem('site-theme') as SiteTheme | null;
    return stored || 'theme-02'; // Default to theme-02 (new premium theme)
  });

  useEffect(() => {
    const root = document.documentElement;
    
    // Remove previous theme classes
    root.classList.remove('theme-01', 'theme-02');
    
    // Add current theme class
    root.classList.add(siteTheme);
    
    localStorage.setItem('site-theme', siteTheme);
  }, [siteTheme]);

  const toggleSiteTheme = () => {
    setSiteTheme(prev => prev === 'theme-01' ? 'theme-02' : 'theme-01');
  };

  return (
    <SiteThemeContext.Provider value={{ siteTheme, setSiteTheme, toggleSiteTheme }}>
      {children}
    </SiteThemeContext.Provider>
  );
};

export const useSiteTheme = () => {
  const context = useContext(SiteThemeContext);
  if (!context) {
    throw new Error('useSiteTheme must be used within a SiteThemeProvider');
  }
  return context;
};

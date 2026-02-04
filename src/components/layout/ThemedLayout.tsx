import { ReactNode } from 'react';
import Header from '@/components/layout/Header';
import HeaderTheme02 from '@/components/layout/HeaderTheme02';
import Footer from '@/components/layout/Footer';
import FooterTheme02 from '@/components/layout/FooterTheme02';
import { useSiteTheme } from '@/contexts/SiteThemeContext';

interface ThemedLayoutProps {
  children: ReactNode;
}

const ThemedLayout = ({ children }: ThemedLayoutProps) => {
  const { siteTheme } = useSiteTheme();
  
  const isTheme02 = siteTheme === 'theme-02';

  return (
    <div className={`min-h-screen ${isTheme02 ? 'bg-theme02-deep-black' : 'bg-background'}`}>
      {isTheme02 ? <HeaderTheme02 /> : <Header />}
      <main>
        {children}
      </main>
      {isTheme02 ? <FooterTheme02 /> : <Footer />}
    </div>
  );
};

export default ThemedLayout;

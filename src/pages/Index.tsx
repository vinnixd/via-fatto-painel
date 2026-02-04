import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Home from './Home';
import SEOHead from '@/components/SEOHead';
import { useSiteConfig } from '@/hooks/useSupabaseData';

const Index = () => {
  const { data: siteConfig } = useSiteConfig();
  
  return (
    <div className="min-h-screen bg-background">
      <SEOHead 
        pageKey="home"
        siteConfig={siteConfig}
      />
      <Header />
      <main>
        <Home />
      </main>
      <Footer />
    </div>
  );
};

export default Index;

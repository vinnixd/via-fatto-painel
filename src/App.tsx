import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { useFavicon } from "@/hooks/useFavicon";
import { useBrandColors } from "@/hooks/useBrandColors";
import { useTrackingScripts } from "@/hooks/useTrackingScripts";
import { useAutoPageTracking } from "@/hooks/usePageTracking";
import ScrollToTop from "@/components/ScrollToTop";
import { AppErrorBoundary } from "@/components/AppErrorBoundary";
import FloatingWhatsApp from "@/components/FloatingWhatsApp";
import { DomainRouter } from "@/components/DomainRouter";
import { isAdminSubdomain } from "@/hooks/useAdminRoutes";
import Index from "./pages/Index";
import PropertyPage from "./pages/PropertyPage";
import PropertiesPage from "./pages/PropertiesPage";
import AboutPage from "./pages/AboutPage";
import ContactPage from "./pages/ContactPage";
import FavoritesPage from "./pages/FavoritesPage";
import LocationPage from "./pages/LocationPage";
import NotFound from "./pages/NotFound";

// Admin Pages
import AuthPage from "./pages/admin/AuthPage";
import InviteSignupPage from "./pages/admin/InviteSignupPage";
import DashboardPage from "./pages/admin/DashboardPage";
import PropertiesListPage from "./pages/admin/PropertiesListPage";
import PropertyFormPage from "./pages/admin/PropertyFormPage";
import CategoriesPage from "./pages/admin/CategoriesPage";
import DesignerPage from "./pages/admin/DesignerPage";
import ProfilePage from "./pages/admin/ProfilePage";
import SettingsPage from "./pages/admin/SettingsPage";
import FavoritesListPage from "./pages/admin/FavoritesListPage";
import MessagesPage from "./pages/admin/MessagesPage";
import ExportPage from "./pages/admin/data/ExportPage";
import ImportDataPage from "./pages/admin/data/ImportPage";
import PortaisPage from "./pages/admin/PortaisPage";
import PortalConfigPage from "./pages/admin/PortalConfigPage";
import UsersPage from "./pages/admin/UsersPage";
import PaymentsPage from "./pages/admin/subscriptions/PaymentsPage";
import PlansPage from "./pages/admin/subscriptions/PlansPage";
import InvoicesPage from "./pages/admin/subscriptions/InvoicesPage";
import IntegrationsPage from "./pages/admin/IntegrationsPage";
import ShareTestPage from "./pages/admin/ShareTestPage";

const queryClient = new QueryClient();

// Component to apply favicon, brand colors, tracking scripts, and page tracking
const BrandManager = () => {
  useFavicon();
  useBrandColors();
  useTrackingScripts();
  useAutoPageTracking();
  return null;
};

// Helper para gerar rotas admin
const getAdminRoutes = (prefix: string = '') => [
  { path: `${prefix}/`, element: <DashboardPage /> },
  { path: `${prefix}/login`, element: <AuthPage /> },
  { path: `${prefix}/convite/:token`, element: <InviteSignupPage /> },
  { path: `${prefix}/designer`, element: <DesignerPage /> },
  { path: `${prefix}/imoveis`, element: <PropertiesListPage /> },
  { path: `${prefix}/imoveis/novo`, element: <PropertyFormPage /> },
  { path: `${prefix}/imoveis/:id`, element: <PropertyFormPage /> },
  { path: `${prefix}/categorias`, element: <CategoriesPage /> },
  { path: `${prefix}/perfil`, element: <ProfilePage /> },
  { path: `${prefix}/configuracoes`, element: <SettingsPage /> },
  { path: `${prefix}/favoritos`, element: <FavoritesListPage /> },
  { path: `${prefix}/mensagens`, element: <MessagesPage /> },
  { path: `${prefix}/dados`, element: <ExportPage /> },
  { path: `${prefix}/dados/importar`, element: <ImportDataPage /> },
  { path: `${prefix}/portais`, element: <PortaisPage /> },
  { path: `${prefix}/portais/:portalId`, element: <PortalConfigPage /> },
  { path: `${prefix}/usuarios`, element: <UsersPage /> },
  { path: `${prefix}/assinaturas`, element: <PaymentsPage /> },
  { path: `${prefix}/assinaturas/planos`, element: <PlansPage /> },
  { path: `${prefix}/assinaturas/faturas`, element: <InvoicesPage /> },
  { path: `${prefix}/integracoes`, element: <IntegrationsPage /> },
  { path: `${prefix}/compartilhamento`, element: <ShareTestPage /> },
];

const App = () => {
  const isCleanUrlMode = isAdminSubdomain();
  
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ScrollToTop />
          <BrandManager />
          <AuthProvider>
            <DomainRouter>
              <AppErrorBoundary>
                <Routes>
                  {isCleanUrlMode ? (
                    <>
                      {/* URLs limpas no subdomínio admin */}
                      {getAdminRoutes('').map((route) => (
                        <Route key={route.path} path={route.path} element={route.element} />
                      ))}
                      <Route path="*" element={<NotFound />} />
                    </>
                  ) : (
                    <>
                      {/* Public Routes */}
                      <Route path="/" element={<Index />} />
                      <Route path="/imoveis" element={<PropertiesPage />} />
                      <Route path="/imoveis/localizacao" element={<LocationPage />} />
                      <Route path="/imovel/:slug" element={<PropertyPage />} />
                      <Route path="/sobre" element={<AboutPage />} />
                      <Route path="/contato" element={<ContactPage />} />
                      <Route path="/favoritos" element={<FavoritesPage />} />

                      {/* Admin Routes with /admin prefix */}
                      {getAdminRoutes('/admin').map((route) => (
                        <Route key={route.path} path={route.path} element={route.element} />
                      ))}

                      <Route path="*" element={<NotFound />} />
                    </>
                  )}
                </Routes>
                <FloatingWhatsApp />
              </AppErrorBoundary>
            </DomainRouter>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;

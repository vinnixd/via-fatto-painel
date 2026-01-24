import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { TenantProvider } from "@/contexts/TenantContext";
import { useFavicon } from "@/hooks/useFavicon";
import { useBrandColors } from "@/hooks/useBrandColors";
import { useTrackingScripts } from "@/hooks/useTrackingScripts";
import { useAutoPageTracking } from "@/hooks/usePageTracking";
import ScrollToTop from "@/components/ScrollToTop";
import { AppErrorBoundary } from "@/components/AppErrorBoundary";
import FloatingWhatsApp from "@/components/FloatingWhatsApp";
import { DomainRouter } from "@/components/DomainRouter";
import { TenantGate } from "@/components/tenant/TenantGate";
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
import TenantDomainsPage from "./pages/admin/TenantDomainsPage";
import TenantMembersPage from "./pages/admin/TenantMembersPage";

const queryClient = new QueryClient();

// Component to apply favicon, brand colors, tracking scripts, and page tracking
const BrandManager = () => {
  useFavicon();
  useBrandColors();
  useTrackingScripts();
  useAutoPageTracking();
  return null;
};

// Helper para gerar rotas admin (protegidas pelo TenantGate)
const getAdminRoutes = (prefix: string = '') => [
  { path: `${prefix}/`, element: <TenantGate><DashboardPage /></TenantGate> },
  { path: `${prefix}/login`, element: <AuthPage /> },
  { path: `${prefix}/convite/:token`, element: <InviteSignupPage /> },
  { path: `${prefix}/designer`, element: <TenantGate><DesignerPage /></TenantGate> },
  { path: `${prefix}/imoveis`, element: <TenantGate><PropertiesListPage /></TenantGate> },
  { path: `${prefix}/imoveis/novo`, element: <TenantGate><PropertyFormPage /></TenantGate> },
  { path: `${prefix}/imoveis/:id`, element: <TenantGate><PropertyFormPage /></TenantGate> },
  { path: `${prefix}/categorias`, element: <TenantGate><CategoriesPage /></TenantGate> },
  { path: `${prefix}/perfil`, element: <TenantGate><ProfilePage /></TenantGate> },
  { path: `${prefix}/configuracoes`, element: <TenantGate><SettingsPage /></TenantGate> },
  { path: `${prefix}/favoritos`, element: <TenantGate><FavoritesListPage /></TenantGate> },
  { path: `${prefix}/mensagens`, element: <TenantGate><MessagesPage /></TenantGate> },
  { path: `${prefix}/dados`, element: <TenantGate><ExportPage /></TenantGate> },
  { path: `${prefix}/dados/importar`, element: <TenantGate><ImportDataPage /></TenantGate> },
  { path: `${prefix}/portais`, element: <TenantGate><PortaisPage /></TenantGate> },
  { path: `${prefix}/portais/:portalId`, element: <TenantGate><PortalConfigPage /></TenantGate> },
  { path: `${prefix}/usuarios`, element: <TenantGate><UsersPage /></TenantGate> },
  { path: `${prefix}/assinaturas`, element: <TenantGate><PaymentsPage /></TenantGate> },
  { path: `${prefix}/assinaturas/planos`, element: <TenantGate><PlansPage /></TenantGate> },
  { path: `${prefix}/assinaturas/faturas`, element: <TenantGate><InvoicesPage /></TenantGate> },
  { path: `${prefix}/integracoes`, element: <TenantGate><IntegrationsPage /></TenantGate> },
  { path: `${prefix}/compartilhamento`, element: <TenantGate><ShareTestPage /></TenantGate> },
  { path: `${prefix}/dominios`, element: <TenantGate><TenantDomainsPage /></TenantGate> },
  { path: `${prefix}/membros`, element: <TenantGate><TenantMembersPage /></TenantGate> },
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
            <TenantProvider>
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
            </TenantProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;

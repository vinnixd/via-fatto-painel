import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { TenantProvider } from "@/contexts/TenantContext";
import ScrollToTop from "@/components/ScrollToTop";
import { AppErrorBoundary } from "@/components/AppErrorBoundary";
import { TenantGate } from "@/components/tenant/TenantGate";
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

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ScrollToTop />
          <AuthProvider>
            <TenantProvider>
              <AppErrorBoundary>
                <Routes>
                  {/* Redirect root to admin dashboard */}
                  <Route path="/" element={<Navigate to="/admin" replace />} />
                  
                  {/* Admin Routes */}
                  <Route path="/admin" element={<TenantGate><DashboardPage /></TenantGate>} />
                  <Route path="/admin/login" element={<AuthPage />} />
                  <Route path="/admin/convite/:token" element={<InviteSignupPage />} />
                  <Route path="/admin/designer" element={<TenantGate><DesignerPage /></TenantGate>} />
                  <Route path="/admin/imoveis" element={<TenantGate><PropertiesListPage /></TenantGate>} />
                  <Route path="/admin/imoveis/novo" element={<TenantGate><PropertyFormPage /></TenantGate>} />
                  <Route path="/admin/imoveis/:id" element={<TenantGate><PropertyFormPage /></TenantGate>} />
                  <Route path="/admin/categorias" element={<TenantGate><CategoriesPage /></TenantGate>} />
                  <Route path="/admin/perfil" element={<TenantGate><ProfilePage /></TenantGate>} />
                  <Route path="/admin/configuracoes" element={<TenantGate><SettingsPage /></TenantGate>} />
                  <Route path="/admin/favoritos" element={<TenantGate><FavoritesListPage /></TenantGate>} />
                  <Route path="/admin/mensagens" element={<TenantGate><MessagesPage /></TenantGate>} />
                  <Route path="/admin/dados" element={<TenantGate><ExportPage /></TenantGate>} />
                  <Route path="/admin/dados/importar" element={<TenantGate><ImportDataPage /></TenantGate>} />
                  <Route path="/admin/portais" element={<TenantGate><PortaisPage /></TenantGate>} />
                  <Route path="/admin/portais/:portalId" element={<TenantGate><PortalConfigPage /></TenantGate>} />
                  <Route path="/admin/usuarios" element={<TenantGate><UsersPage /></TenantGate>} />
                  <Route path="/admin/assinaturas" element={<TenantGate><PaymentsPage /></TenantGate>} />
                  <Route path="/admin/assinaturas/planos" element={<TenantGate><PlansPage /></TenantGate>} />
                  <Route path="/admin/assinaturas/faturas" element={<TenantGate><InvoicesPage /></TenantGate>} />
                  <Route path="/admin/integracoes" element={<TenantGate><IntegrationsPage /></TenantGate>} />
                  <Route path="/admin/compartilhamento" element={<TenantGate><ShareTestPage /></TenantGate>} />
                  <Route path="/admin/dominios" element={<TenantGate><TenantDomainsPage /></TenantGate>} />
                  <Route path="/admin/membros" element={<TenantGate><TenantMembersPage /></TenantGate>} />

                  {/* Catch all - redirect to admin */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </AppErrorBoundary>
            </TenantProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { useFavicon } from "@/hooks/useFavicon";
import { useBrandColors } from "@/hooks/useBrandColors";
import ScrollToTop from "@/components/ScrollToTop";
import { AppErrorBoundary } from "@/components/AppErrorBoundary";
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
import ImportPage from "./pages/admin/ImportPage";
import PortaisPage from "./pages/admin/PortaisPage";
import PortalConfigPage from "./pages/admin/PortalConfigPage";
import UsersPage from "./pages/admin/UsersPage";

const queryClient = new QueryClient();

// Component to apply favicon and brand colors
const BrandManager = () => {
  useFavicon();
  useBrandColors();
  return null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ScrollToTop />
        <BrandManager />
        <AuthProvider>
          <AppErrorBoundary>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Index />} />
              <Route path="/imoveis" element={<PropertiesPage />} />
              <Route path="/imoveis/localizacao" element={<LocationPage />} />
              <Route path="/imovel/:slug" element={<PropertyPage />} />
              <Route path="/sobre" element={<AboutPage />} />
              <Route path="/contato" element={<ContactPage />} />
              <Route path="/favoritos" element={<FavoritesPage />} />

              {/* Admin Routes */}
              <Route path="/admin/login" element={<AuthPage />} />
              <Route path="/admin/convite/:token" element={<InviteSignupPage />} />
              <Route path="/admin" element={<DashboardPage />} />
              <Route path="/admin/designer" element={<DesignerPage />} />
              <Route path="/admin/imoveis" element={<PropertiesListPage />} />
              <Route path="/admin/imoveis/novo" element={<PropertyFormPage />} />
              <Route path="/admin/imoveis/:id" element={<PropertyFormPage />} />
              <Route path="/admin/categorias" element={<CategoriesPage />} />
              <Route path="/admin/perfil" element={<ProfilePage />} />
              <Route path="/admin/configuracoes" element={<SettingsPage />} />
              <Route path="/admin/favoritos" element={<FavoritesListPage />} />
              <Route path="/admin/mensagens" element={<MessagesPage />} />
              <Route path="/admin/importar" element={<ImportPage />} />
              <Route path="/admin/portais" element={<PortaisPage />} />
              <Route path="/admin/portais/:portalId" element={<PortalConfigPage />} />
              <Route path="/admin/usuarios" element={<UsersPage />} />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </AppErrorBoundary>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

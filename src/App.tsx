import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { useFavicon } from "@/hooks/useFavicon";
import { useBrandColors } from "@/hooks/useBrandColors";
import { useTrackingScripts } from "@/hooks/useTrackingScripts";
import { useAutoPageTracking } from "@/hooks/usePageTracking";
import ScrollToTop from "@/components/ScrollToTop";
import { AppErrorBoundary } from "@/components/AppErrorBoundary";
import FloatingWhatsApp from "@/components/FloatingWhatsApp";
import ProtectedRoute from "@/components/admin/ProtectedRoute";
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
import ProfilePage from "./pages/admin/ProfilePage";
import FavoritesListPage from "./pages/admin/FavoritesListPage";
import MessagesPage from "./pages/admin/MessagesPage";
import ExportPage from "./pages/admin/data/ExportPage";
import ImportDataPage from "./pages/admin/data/ImportPage";
import UsersPage from "./pages/admin/UsersPage";
import ShareTestPage from "./pages/admin/ShareTestPage";
import SettingsPage from "./pages/admin/settings/SettingsPage";

const queryClient = new QueryClient();

// Component to apply favicon, brand colors, tracking scripts, and page tracking
const BrandManager = () => {
  useFavicon();
  useBrandColors();
  useTrackingScripts();
  useAutoPageTracking();
  return null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
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

                {/* Auth Routes (no protection) */}
                <Route path="/admin/login" element={<AuthPage />} />
                <Route path="/admin/auth" element={<AuthPage />} />
                <Route path="/admin/convite/:token" element={<InviteSignupPage />} />

                {/* Protected Admin Routes */}
                <Route path="/admin" element={
                  <ProtectedRoute pageKey="dashboard">
                    <DashboardPage />
                  </ProtectedRoute>
                } />
                <Route path="/admin/imoveis" element={
                  <ProtectedRoute pageKey="imoveis">
                    <PropertiesListPage />
                  </ProtectedRoute>
                } />
                <Route path="/admin/imoveis/novo" element={
                  <ProtectedRoute pageKey="imoveis" action="create">
                    <PropertyFormPage />
                  </ProtectedRoute>
                } />
                <Route path="/admin/imoveis/:id" element={
                  <ProtectedRoute pageKey="imoveis" action="edit">
                    <PropertyFormPage />
                  </ProtectedRoute>
                } />
                <Route path="/admin/categorias" element={
                  <ProtectedRoute pageKey="categorias">
                    <CategoriesPage />
                  </ProtectedRoute>
                } />
                <Route path="/admin/perfil" element={
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                } />
                <Route path="/admin/configuracoes" element={
                  <ProtectedRoute pageKey="configuracoes">
                    <SettingsPage />
                  </ProtectedRoute>
                } />
                <Route path="/admin/favoritos" element={
                  <ProtectedRoute pageKey="favoritos">
                    <FavoritesListPage />
                  </ProtectedRoute>
                } />
                <Route path="/admin/mensagens" element={
                  <ProtectedRoute pageKey="mensagens">
                    <MessagesPage />
                  </ProtectedRoute>
                } />
                <Route path="/admin/dados" element={
                  <ProtectedRoute pageKey="dados">
                    <ExportPage />
                  </ProtectedRoute>
                } />
                <Route path="/admin/dados/importar" element={
                  <ProtectedRoute pageKey="dados" action="create">
                    <ImportDataPage />
                  </ProtectedRoute>
                } />
                <Route path="/admin/usuarios" element={
                  <ProtectedRoute pageKey="usuarios" requireAdmin>
                    <UsersPage />
                  </ProtectedRoute>
                } />
                <Route path="/admin/compartilhamento" element={
                  <ProtectedRoute>
                    <ShareTestPage />
                  </ProtectedRoute>
                } />

                <Route path="*" element={<NotFound />} />
              </Routes>
              <FloatingWhatsApp />
            </AppErrorBoundary>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;

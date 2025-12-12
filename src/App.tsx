import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { useFavicon } from "@/hooks/useFavicon";
import Index from "./pages/Index";
import PropertyPage from "./pages/PropertyPage";
import PropertiesPage from "./pages/PropertiesPage";
import AboutPage from "./pages/AboutPage";
import ContactPage from "./pages/ContactPage";
import FavoritesPage from "./pages/FavoritesPage";
import NotFound from "./pages/NotFound";

// Admin Pages
import AuthPage from "./pages/admin/AuthPage";
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

const queryClient = new QueryClient();

// Component to apply favicon
const FaviconManager = () => {
  useFavicon();
  return null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <FaviconManager />
        <AuthProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Index />} />
            <Route path="/imoveis" element={<PropertiesPage />} />
            <Route path="/imovel/:slug" element={<PropertyPage />} />
            <Route path="/sobre" element={<AboutPage />} />
            <Route path="/contato" element={<ContactPage />} />
            <Route path="/favoritos" element={<FavoritesPage />} />

            {/* Admin Routes */}
            <Route path="/admin/login" element={<AuthPage />} />
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

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

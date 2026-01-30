import { Routes, Route, Navigate } from "react-router-dom";
import { TenantGate } from "@/components/tenant/TenantGate";
import NotFound from "@/pages/NotFound";

// Admin Pages
import LoginPage from "@/pages/admin/LoginPage";
import CadastroPage from "@/pages/admin/CadastroPage";
import ForgotPasswordPage from "@/pages/admin/ForgotPasswordPage";
import ResetPasswordPage from "@/pages/admin/ResetPasswordPage";
import PendingApprovalPage from "@/pages/admin/PendingApprovalPage";
import InviteSignupPage from "@/pages/admin/InviteSignupPage";
import DashboardPage from "@/pages/admin/DashboardPage";
import PropertiesListPage from "@/pages/admin/PropertiesListPage";
import PropertyFormPage from "@/pages/admin/PropertyFormPage";
import CategoriesPage from "@/pages/admin/CategoriesPage";
import ProfilePage from "@/pages/admin/ProfilePage";
import SettingsPage from "@/pages/admin/SettingsPage";
import FavoritesListPage from "@/pages/admin/FavoritesListPage";
import MessagesPage from "@/pages/admin/MessagesPage";
import ExportPage from "@/pages/admin/data/ExportPage";
import ImportDataPage from "@/pages/admin/data/ImportPage";
import DatabaseExportPage from "@/pages/admin/data/DatabaseExportPage";
import PortalConfigPage from "@/pages/admin/PortalConfigPage";
import UsersPage from "@/pages/admin/UsersPage";
import ShareTestPage from "@/pages/admin/ShareTestPage";
import TenantMembersPage from "@/pages/admin/TenantMembersPage";
import AdminPage from "@/pages/admin/AdminPage";

interface AdminRoutesProps {
  useCleanUrls: boolean;
}

/**
 * Componente que renderiza as rotas do admin
 * @param useCleanUrls - Se true, usa URLs limpas (sem prefixo /admin)
 */
export const AdminRoutes = ({ useCleanUrls }: AdminRoutesProps) => {
  const prefix = useCleanUrls ? "" : "/admin";

  return (
    <Routes>
      {/* Redirect root to /admin when not using clean URLs */}
      {!useCleanUrls && <Route path="/" element={<Navigate to="/admin" replace />} />}
      
      {/* Dashboard */}
      <Route path={useCleanUrls ? "/" : "/admin"} element={<TenantGate><DashboardPage /></TenantGate>} />
      
      {/* Auth */}
      <Route path={`${prefix}/login`} element={<LoginPage />} />
      <Route path={`${prefix}/cadastro`} element={<CadastroPage />} />
      <Route path={`${prefix}/esqueci-senha`} element={<ForgotPasswordPage />} />
      <Route path={`${prefix}/redefinir-senha`} element={<ResetPasswordPage />} />
      <Route path={`${prefix}/aguardando-aprovacao`} element={<PendingApprovalPage />} />
      <Route path={`${prefix}/convite/:token`} element={<InviteSignupPage />} />
      
      {/* Administração - Nova página central com abas */}
      <Route path={`${prefix}/administracao`} element={<TenantGate><AdminPage /></TenantGate>} />
      
      {/* Imóveis */}
      <Route path={`${prefix}/imoveis`} element={<TenantGate><PropertiesListPage /></TenantGate>} />
      <Route path={`${prefix}/imoveis/novo`} element={<TenantGate><PropertyFormPage /></TenantGate>} />
      <Route path={`${prefix}/imoveis/:id`} element={<TenantGate><PropertyFormPage /></TenantGate>} />
      
      {/* Categorias */}
      <Route path={`${prefix}/categorias`} element={<TenantGate><CategoriesPage /></TenantGate>} />
      
      {/* Perfil e Configurações */}
      <Route path={`${prefix}/perfil`} element={<TenantGate><ProfilePage /></TenantGate>} />
      <Route path={`${prefix}/configuracoes`} element={<TenantGate><SettingsPage /></TenantGate>} />
      
      {/* Favoritos e Mensagens */}
      <Route path={`${prefix}/favoritos`} element={<TenantGate><FavoritesListPage /></TenantGate>} />
      <Route path={`${prefix}/mensagens`} element={<TenantGate><MessagesPage /></TenantGate>} />
      
      {/* Dados */}
      <Route path={`${prefix}/dados`} element={<TenantGate><ExportPage /></TenantGate>} />
      <Route path={`${prefix}/dados/importar`} element={<TenantGate><ImportDataPage /></TenantGate>} />
      <Route path={`${prefix}/dados/banco`} element={<TenantGate><DatabaseExportPage /></TenantGate>} />
      
      {/* Portais - Config individual ainda precisa de rota própria */}
      <Route path={`${prefix}/portais/:portalId`} element={<TenantGate><PortalConfigPage /></TenantGate>} />
      
      {/* Usuários */}
      <Route path={`${prefix}/usuarios`} element={<TenantGate><UsersPage /></TenantGate>} />
      
      {/* Compartilhamento */}
      <Route path={`${prefix}/compartilhamento`} element={<TenantGate><ShareTestPage /></TenantGate>} />
      
      {/* Membros */}
      <Route path={`${prefix}/membros`} element={<TenantGate><TenantMembersPage /></TenantGate>} />

      {/* Fallback */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AdminRoutes;

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { TenantProvider } from "@/contexts/TenantContext";
import ScrollToTop from "@/components/ScrollToTop";
import { AppErrorBoundary } from "@/components/AppErrorBoundary";
import { AdminRoutes } from "@/components/AdminRoutes";
import { isAdminSubdomain } from "@/hooks/useAdminRoutes";

const queryClient = new QueryClient();

const App = () => {
  // Determina se deve usar URLs limpas (sem /admin) baseado no subdomínio
  const useCleanUrls = isAdminSubdomain();

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
                <AdminRoutes useCleanUrls={useCleanUrls} />
              </AppErrorBoundary>
            </TenantProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;

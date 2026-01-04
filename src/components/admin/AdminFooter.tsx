import { APP_VERSION } from '@/lib/constants';

const AdminFooter = () => {
  return (
    <footer className="py-4 text-center text-xs text-muted-foreground border-t border-border bg-background">
      © 2026 Zatch System • v{APP_VERSION}
    </footer>
  );
};

export default AdminFooter;

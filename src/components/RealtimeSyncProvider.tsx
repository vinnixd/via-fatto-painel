import { useRealtimeSync } from '@/hooks/useRealtimeSync';

/**
 * Component that enables realtime synchronization
 * Add this to App.tsx to enable automatic sync between admin panel and public site
 */
export const RealtimeSyncProvider = ({ children }: { children: React.ReactNode }) => {
  useRealtimeSync();
  return <>{children}</>;
};

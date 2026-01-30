import { useSiteConfig } from '@/hooks/useSupabaseData';
import { useTenant } from '@/contexts/TenantContext';
import { Building2 } from 'lucide-react';

interface AuthBackgroundProps {
  logoUrl?: string | null;
  tenantName?: string;
}

const AuthBackground = ({ logoUrl, tenantName }: AuthBackgroundProps) => {
  return (
    <div className="absolute inset-0 bg-[#1a1a1a] overflow-hidden flex items-center justify-center">
      {/* Geometric diagonal lines */}
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 1920 1080"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Main diagonal lines */}
        <line x1="0" y1="0" x2="400" y2="1080" stroke="#2a2a2a" strokeWidth="2" />
        <line x1="200" y1="0" x2="600" y2="1080" stroke="#2a2a2a" strokeWidth="2" />
        <line x1="350" y1="0" x2="750" y2="1080" stroke="#2a2a2a" strokeWidth="2" />
        
        <line x1="1400" y1="0" x2="1800" y2="1080" stroke="#2a2a2a" strokeWidth="2" />
        <line x1="1520" y1="0" x2="1920" y2="1080" stroke="#2a2a2a" strokeWidth="2" />
        
        {/* Chevron/V shapes */}
        <path d="M 900 200 L 1100 500 L 900 800" fill="none" stroke="#2a2a2a" strokeWidth="2" />
        <path d="M 950 250 L 1150 550 L 950 850" fill="none" stroke="#252525" strokeWidth="1" />
        
        {/* Bottom left triangle */}
        <path d="M 0 800 L 300 1080 L 0 1080 Z" fill="none" stroke="#2a2a2a" strokeWidth="2" />
        
        {/* Top right accent */}
        <line x1="1600" y1="0" x2="1920" y2="400" stroke="#2a2a2a" strokeWidth="2" />
        <line x1="1700" y1="0" x2="1920" y2="300" stroke="#252525" strokeWidth="1" />
        
        {/* Additional subtle lines */}
        <line x1="100" y1="0" x2="500" y2="1080" stroke="#222222" strokeWidth="1" />
        <line x1="1300" y1="0" x2="1700" y2="1080" stroke="#222222" strokeWidth="1" />
      </svg>

      {/* Logo do tenant */}
      <div className="relative z-10 flex flex-col items-center gap-4">
        {logoUrl ? (
          <img 
            src={logoUrl} 
            alt={tenantName || 'Logo'} 
            className="h-20 w-auto object-contain brightness-0 invert"
          />
        ) : (
          <div className="h-16 w-16 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center">
            <Building2 className="h-8 w-8 text-white" />
          </div>
        )}
        {tenantName && (
          <span className="text-white/60 text-sm font-medium tracking-wide">
            {tenantName}
          </span>
        )}
      </div>
    </div>
  );
};

export default AuthBackground;

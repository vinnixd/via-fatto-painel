import { useEffect } from 'react';
import { useSiteConfig } from '@/hooks/useSupabaseData';

// Convert hex to HSL
function hexToHSL(hex: string): { h: number; s: number; l: number } | null {
  if (!hex) return null;
  
  // Remove # if present
  hex = hex.replace(/^#/, '');
  
  // Parse hex values
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

// Darken a color by reducing lightness
function darkenHSL(hsl: { h: number; s: number; l: number }, amount: number) {
  return {
    h: hsl.h,
    s: hsl.s,
    l: Math.max(0, hsl.l - amount),
  };
}

// Lighten a color by increasing lightness
function lightenHSL(hsl: { h: number; s: number; l: number }, amount: number) {
  return {
    h: hsl.h,
    s: Math.max(0, hsl.s - 40), // Reduce saturation for muted version
    l: Math.min(100, hsl.l + amount),
  };
}

export function useBrandColors() {
  const { data: siteConfig } = useSiteConfig();

  useEffect(() => {
    if (!siteConfig) return;

    const root = document.documentElement;

    // Apply primary color
    if (siteConfig.primary_color) {
      const primaryHSL = hexToHSL(siteConfig.primary_color);
      if (primaryHSL) {
        const hslValue = `${primaryHSL.h} ${primaryHSL.s}% ${primaryHSL.l}%`;
        root.style.setProperty('--primary', hslValue);
        root.style.setProperty('--ring', hslValue);
        root.style.setProperty('--success', hslValue);
        
        // Primary hover (slightly darker)
        const hoverHSL = darkenHSL(primaryHSL, 5);
        root.style.setProperty('--primary-hover', `${hoverHSL.h} ${hoverHSL.s}% ${hoverHSL.l}%`);
        
        // Primary muted (very light version)
        const mutedHSL = lightenHSL(primaryHSL, 55);
        root.style.setProperty('--primary-muted', `${mutedHSL.h} ${mutedHSL.s}% ${mutedHSL.l}%`);
        
        // Accent (use primary for accent too)
        root.style.setProperty('--accent', `${mutedHSL.h} ${mutedHSL.s}% ${mutedHSL.l}%`);
        root.style.setProperty('--accent-foreground', hslValue);
        
        // Gradient
        const gradientLightHSL = { ...primaryHSL, l: Math.min(100, primaryHSL.l + 6) };
        root.style.setProperty(
          '--gradient-primary',
          `linear-gradient(135deg, hsl(${hslValue}), hsl(${gradientLightHSL.h} ${gradientLightHSL.s}% ${gradientLightHSL.l}%))`
        );
      }
    }

    // Apply secondary color (if different from primary)
    if (siteConfig.secondary_color) {
      const secondaryHSL = hexToHSL(siteConfig.secondary_color);
      if (secondaryHSL) {
        // Can use secondary for specific elements if needed
        // For now, secondary is used for buttons/UI elements
      }
    }

    // Apply accent color
    if (siteConfig.accent_color) {
      const accentHSL = hexToHSL(siteConfig.accent_color);
      if (accentHSL) {
        // Accent can be used for specific highlights
        // Already covered by primary-derived accent above
      }
    }
  }, [siteConfig]);
}

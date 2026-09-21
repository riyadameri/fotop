import type React from 'react';

/**
 * Studio Logo utility
 * Priority:
 * 1. User uploaded custom logo in localStorage ('fotop_custom_studio_logo')
 * 2. Static logo placed in assets folder: '/assets/logo.png'
 * 3. Default vector SVG logo: '/fotop-logo.svg'
 */

export const DEFAULT_STUDIO_LOGO = '/fotop-logo.svg';
export const ASSETS_STUDIO_LOGO = '/assets/logo.png';

export function getStudioLogo(): string {
  if (typeof window === 'undefined') return ASSETS_STUDIO_LOGO;
  try {
    const custom = localStorage.getItem('fotop_custom_studio_logo');
    if (custom && custom.trim().length > 0) {
      return custom;
    }
  } catch {
    // ignore
  }
  return ASSETS_STUDIO_LOGO;
}

export function handleLogoError(e: React.SyntheticEvent<HTMLImageElement, Event>) {
  const target = e.currentTarget;
  // If failed loading custom or /assets/logo.png, fallback to default svg
  if (target.src && !target.src.endsWith(DEFAULT_STUDIO_LOGO)) {
    target.src = DEFAULT_STUDIO_LOGO;
  }
}

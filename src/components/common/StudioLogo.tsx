import React, { useState, useEffect } from 'react';
import { FotopLogo } from '../Branding/FotopLogo';
import { getStudioLogo } from '../../utils/logo';

interface StudioLogoProps {
  className?: string;
  alt?: string;
  showGlow?: boolean;
}

export const StudioLogo: React.FC<StudioLogoProps> = ({ 
  className = 'w-full h-full', 
  alt = 'شعار الاستوديو', 
  showGlow = false 
}) => {
  const [currentSrc, setCurrentSrc] = useState<string>(getStudioLogo);
  const [hasError, setHasError] = useState<boolean>(false);

  useEffect(() => {
    const handleUpdate = () => {
      setCurrentSrc(getStudioLogo());
      setHasError(false);
    };
    window.addEventListener('fotop_settings_updated', handleUpdate);
    return () => window.removeEventListener('fotop_settings_updated', handleUpdate);
  }, []);

  if (hasError) {
    return <FotopLogo className={className} showGlow={showGlow} />;
  }

  return (
    <img
      src={currentSrc}
      alt={alt}
      className={`${className} object-contain`}
      onError={() => {
        // If /assets/logo.png is not found or fails, smoothly fallback to FotopLogo SVG
        setHasError(true);
      }}
    />
  );
};

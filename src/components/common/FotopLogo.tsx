import React from 'react';

interface FotopLogoProps {
  className?: string;
  size?: number | string;
  showGlow?: boolean;
  variant?: 'full' | 'icon-only';
  alt?: string;
}

export const FotopLogo: React.FC<FotopLogoProps> = ({
  className = 'w-10 h-10',
  size,
  showGlow = false,
  alt = 'Fotop Studio Logo'
}) => {
  return (
    <div 
      className={`relative inline-flex items-center justify-center select-none shrink-0 ${className}`}
      style={size ? { width: size, height: size } : undefined}
      aria-label={alt}
    >
      {showGlow && (
        <div className="absolute inset-0 rounded-full bg-[#E31C2B]/25 blur-md -z-10" />
      )}
      <svg 
        viewBox="0 0 200 200" 
        className="w-full h-full object-contain"
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Outer Red Ring Gradient */}
          <linearGradient id="fotopRingGrad" x1="15%" y1="10%" x2="85%" y2="90%">
            <stop offset="0%" stopColor="#F02432" />
            <stop offset="50%" stopColor="#E31C2B" />
            <stop offset="100%" stopColor="#B3121E" />
          </linearGradient>

          {/* Lens Dark Sphere Gradient */}
          <radialGradient id="fotopLensPupil" cx="40%" cy="38%" r="62%">
            <stop offset="0%" stopColor="#3A3F4E" />
            <stop offset="25%" stopColor="#1A1C24" />
            <stop offset="85%" stopColor="#08090C" />
            <stop offset="100%" stopColor="#000000" />
          </radialGradient>

          {/* Camera Body Charcoal Gradient */}
          <linearGradient id="fotopBodyDark" x1="20%" y1="20%" x2="80%" y2="80%">
            <stop offset="0%" stopColor="#2D323E" />
            <stop offset="100%" stopColor="#1C1F27" />
          </linearGradient>

          {/* Subtle Outer Drop Shadow */}
          <filter id="fotopSoftShadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="1.5" stdDeviation="2" floodColor="#000000" floodOpacity="0.14" />
          </filter>
        </defs>

        {/* White Circular Disc Base */}
        <circle cx="100" cy="100" r="94" fill="#FFFFFF" />
        
        {/* Outer Red Ring */}
        <circle 
          cx="100" 
          cy="100" 
          r="87.5" 
          stroke="url(#fotopRingGrad)" 
          strokeWidth="11" 
          fill="#FFFFFF" 
          filter="url(#fotopSoftShadow)"
        />

        {/* Inside Emblem Geometry */}
        <g id="fotop-brand-elements">
          {/* 1. Right Side Flash/Aperture Crescent */}
          <path 
            d="M 125 68 C 147 80, 153 116, 127 127" 
            stroke="#21252F" 
            strokeWidth="5" 
            strokeLinecap="round" 
          />

          {/* 2. Red Stylized "F" (Outer Arc & Vertical Stem) */}
          <path 
            d="M 109 52 C 86 42, 57 56, 57 88 L 57 142" 
            stroke="url(#fotopRingGrad)" 
            strokeWidth="11.5" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
          />
          {/* Red "F" Horizontal Arm */}
          <path 
            d="M 57 106 L 80 106" 
            stroke="url(#fotopRingGrad)" 
            strokeWidth="10.5" 
            strokeLinecap="round" 
          />
          {/* Red Circular Dot Below Stem */}
          <circle cx="73" cy="139" r="6" fill="#E31C2B" />

          {/* 3. Dark Camera Body / Stylized "P" Profile */}
          <path 
            d="M 112 68 C 95 58, 73 71, 71 95 L 71 128 L 86 128 L 86 112 L 110 112 C 122 112, 128 102, 128 90 C 128 78, 122 68, 112 68 Z" 
            fill="url(#fotopBodyDark)" 
          />
          
          {/* Center Aperture Cutout */}
          <circle cx="100" cy="98" r="22.5" fill="#FFFFFF" />

          {/* 4. Glossy Central Camera Lens Pupil */}
          <circle cx="100" cy="98" r="16.5" fill="url(#fotopLensPupil)" />

          {/* Specular White Light Reflection */}
          <circle cx="107" cy="92" r="3.7" fill="#FFFFFF" />
          <circle cx="95" cy="103" r="1.4" fill="#FFFFFF" opacity="0.25" />
        </g>
      </svg>
    </div>
  );
};

export default FotopLogo;

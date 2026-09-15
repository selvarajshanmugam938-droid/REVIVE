import React from 'react';

interface ReviveLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showTagline?: boolean;
  showExpansion?: boolean;
  className?: string;
  isDark?: boolean;
  layout?: 'horizontal' | 'vertical';
}

export const ReviveLogo: React.FC<ReviveLogoProps> = ({
  size = 'md',
  showTagline = true,
  showExpansion = false,
  className = '',
  isDark = false,
  layout = 'horizontal'
}) => {
  const iconSizes = {
    xs: 'w-7 h-7',
    sm: 'w-8 h-8 sm:w-9 sm:h-9',
    md: 'w-10 h-10 sm:w-11 sm:h-11',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24'
  };

  const titleSizes = {
    xs: 'text-base font-black',
    sm: 'text-lg font-black',
    md: 'text-xl sm:text-2xl font-black',
    lg: 'text-3xl font-black',
    xl: 'text-4xl sm:text-5xl font-black'
  };

  return (
    <div
      className={`select-none ${
        layout === 'vertical'
          ? 'flex flex-col items-center text-center gap-2'
          : 'flex items-center gap-2.5 sm:gap-3'
      } ${className}`}
    >
      {/* Official Vector Logo Emblem: Stylized 3D R + Medical Cross + Digital Telemetry Streams + Caring Hand */}
      <div className={`relative flex items-center justify-center shrink-0 ${iconSizes[size]}`}>
        <svg
          viewBox="0 0 200 200"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-md"
        >
          <defs>
            {/* Main "R" Gradient - Futuristic Cyan to Deep Marine */}
            <linearGradient id="rGrad" x1="60" y1="30" x2="160" y2="150" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="25%" stopColor="#00f0ff" />
              <stop offset="65%" stopColor="#0ea5e9" />
              <stop offset="100%" stopColor="#0284c7" />
            </linearGradient>

            {/* Specular Highlight along Top Curve of R */}
            <linearGradient id="rHighlight" x1="70" y1="35" x2="150" y2="70" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.85" />
              <stop offset="40%" stopColor="#a5f3fc" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
            </linearGradient>

            {/* Medical Cross Gradient - Luminous Cyan/Teal */}
            <linearGradient id="crossGrad" x1="85" y1="50" x2="85" y2="110" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#67e8f9" />
              <stop offset="50%" stopColor="#00f5ff" />
              <stop offset="100%" stopColor="#0891b2" />
            </linearGradient>

            {/* Caring Hand Gradient - Mint Emerald to Radiant Turquoise */}
            <linearGradient id="handGrad" x1="60" y1="130" x2="135" y2="95" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#d1fae5" stopOpacity="0.9" />
              <stop offset="30%" stopColor="#34d399" />
              <stop offset="70%" stopColor="#06b6d4" />
              <stop offset="100%" stopColor="#0284c7" />
            </linearGradient>

            {/* Data Stream Gradient for Telemetry Lines */}
            <linearGradient id="streamGrad" x1="20" y1="80" x2="85" y2="80" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#00f5ff" stopOpacity="0.2" />
              <stop offset="40%" stopColor="#00f5ff" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#22d3ee" stopOpacity="1" />
            </linearGradient>

            {/* Soft Glow Filter */}
            <filter id="reviveGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3.5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* =============================================================
              1. TELEMETRY SPEED & DATA STREAM LINES (Emanating from Cross)
             ============================================================= */}
          <g opacity="0.95" filter="url(#reviveGlow)">
            {/* Stream 1 - Top subtle line with node */}
            <line x1="50" y1="58" x2="85" y2="58" stroke="url(#streamGrad)" strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="50" cy="58" r="2.8" fill="#00f5ff" />

            {/* Stream 2 - Upper mid with node */}
            <line x1="32" y1="73" x2="85" y2="73" stroke="url(#streamGrad)" strokeWidth="3" strokeLinecap="round" />
            <circle cx="32" cy="73" r="3.5" fill="#00f5ff" />

            {/* Stream 3 - Central primary data pulse into Cross Horizontal Bar */}
            <line x1="22" y1="88" x2="85" y2="88" stroke="url(#streamGrad)" strokeWidth="3.5" strokeLinecap="round" />
            <circle cx="22" cy="88" r="4.2" fill="#67e8f9" />

            {/* Stream 4 - Lower mid with node */}
            <line x1="42" y1="102" x2="85" y2="102" stroke="url(#streamGrad)" strokeWidth="2.8" strokeLinecap="round" />
            <circle cx="42" cy="102" r="3.2" fill="#00f5ff" />

            {/* Stream 5 - Bottom subtle line with node */}
            <line x1="58" y1="114" x2="85" y2="114" stroke="url(#streamGrad)" strokeWidth="2.2" strokeLinecap="round" />
            <circle cx="58" cy="114" r="2.5" fill="#00f5ff" />
          </g>

          {/* =============================================================
              2. THE FUTURISTIC "R" LETTERFORM
             ============================================================= */}
          {/* Main R Body (Top Arch, Bowl, and Tapered Sweeping Leg) */}
          <path
            d="M 68 45 
               C 68 42, 72 38, 80 38 
               L 115 38 
               C 138 38, 155 48, 155 72 
               C 155 88, 142 98, 126 102 
               C 118 104, 114 106, 118 112 
               L 142 142 
               C 148 149, 154 153, 162 153 
               C 154 157, 142 157, 134 149 
               L 106 116 
               C 101 110, 97 108, 90 108 
               L 86 108 
               L 86 64 
               L 112 64 
               C 126 64, 134 70, 134 78 
               C 134 86, 126 92, 112 92 
               L 92 92
               C 86 92, 70 82, 68 45 Z"
            fill="url(#rGrad)"
          />

          {/* R Outer Sweeping Wing & Bevel Highlight */}
          <path
            d="M 72 40 
               L 115 40 
               C 136 40, 152 49, 152 72 
               C 152 86, 140 96, 125 100"
            stroke="url(#rHighlight)"
            strokeWidth="3.5"
            strokeLinecap="round"
          />

          {/* Aerodynamic Lower Wing Flare on the R Leg */}
          <path
            d="M 108 114 
               C 114 122, 130 142, 148 150 
               C 136 148, 122 136, 112 124 Z"
            fill="#38bdf8"
            opacity="0.75"
          />

          {/* =============================================================
              3. THE LUMINOUS MEDICAL CROSS (+)
             ============================================================= */}
          <g filter="url(#reviveGlow)">
            {/* Vertical Beam */}
            <rect
              x="82"
              y="54"
              width="17"
              height="58"
              rx="4.5"
              fill="url(#crossGrad)"
            />
            {/* Horizontal Beam */}
            <rect
              x="66"
              y="73"
              width="49"
              height="17"
              rx="4.5"
              fill="url(#crossGrad)"
            />
            {/* Inner Light Core for 3D Radiance */}
            <rect
              x="85"
              y="56"
              width="11"
              height="54"
              rx="3"
              fill="#cffafe"
              opacity="0.45"
            />
            <rect
              x="68"
              y="76"
              width="45"
              height="11"
              rx="3"
              fill="#cffafe"
              opacity="0.45"
            />
          </g>

          {/* =============================================================
              4. THE CARING HAND SILHOUETTE (Supporting the Base)
             ============================================================= */}
          <path
            d="M 72 126 
               C 76 122, 84 116, 92 118 
               C 97 119, 100 124, 104 126 
               C 114 130, 126 126, 136 114 
               C 130 134, 112 148, 94 148 
               C 84 148, 76 142, 72 136 
               C 70 133, 69 129, 72 126 Z"
            fill="url(#handGrad)"
            filter="url(#reviveGlow)"
          />

          {/* Gentle thumb and palm contour */}
          <path
            d="M 76 124 
               C 82 120, 88 120, 93 123 
               C 99 127, 107 130, 116 128"
            stroke="#a7f3d0"
            strokeWidth="2.2"
            strokeLinecap="round"
            opacity="0.8"
          />
        </svg>
      </div>

      {/* Brand Typography & Official Identity Lockup */}
      <div className={`flex flex-col ${layout === 'vertical' ? 'items-center' : 'items-start'}`}>
        {/* Primary Wordmark "R E V I V E" with Distinct Cyan "V" */}
        <div className="flex items-center tracking-[0.18em] font-sans leading-none">
          <span className={`${titleSizes[size]} ${isDark ? 'text-white' : 'text-slate-900'} transition-colors`}>
            RE
          </span>
          {/* The Glowing Cyan "V" exactly as styled in the user's official identity */}
          <span className={`${titleSizes[size]} text-[#00f0ff] dark:text-[#00f0ff] drop-shadow-[0_0_8px_rgba(0,240,255,0.4)]`}>
            V
          </span>
          <span className={`${titleSizes[size]} ${isDark ? 'text-white' : 'text-slate-900'} transition-colors`}>
            IVE
          </span>
        </div>

        {/* Expansion Motto: REACH • ENABLE • VALUE • IMPACT • VITALIZE • EMPOWER */}
        {showExpansion && (
          <div className="flex items-center gap-1 text-[8px] sm:text-[9px] font-extrabold uppercase tracking-widest text-[#0ea5e9] mt-1.5 flex-wrap justify-center">
            <span>REACH</span>
            <span>•</span>
            <span>ENABLE</span>
            <span>•</span>
            <span>VALUE</span>
            <span>•</span>
            <span>IMPACT</span>
            <span>•</span>
            <span>VITALIZE</span>
            <span>•</span>
            <span>EMPOWER</span>
          </div>
        )}

        {/* Dynamic ECG Heartbeat Waveform + Tagline */}
        {showTagline && (
          <div className={`items-center gap-1.5 mt-0.5 sm:mt-1 ${layout === 'vertical' ? 'flex' : 'hidden sm:flex'} ${isDark ? 'text-teal-300' : 'text-[#0f766e]'}`}>
            {/* Micro ECG Pulse Waveform */}
            <svg
              viewBox="0 0 42 12"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-5 h-2.5 shrink-0"
            >
              <path
                d="M 1 6 L 12 6 L 15 2 L 18 10 L 22 1 L 25 9 L 28 6 L 41 6"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>

            <span className="text-[9px] sm:text-[10px] font-bold tracking-widest uppercase truncate">
              Healthcare, Reimagined
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

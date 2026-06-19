import React from 'react';

// Hash function to deterministically assign mascots and colors if no keywords match
export const getTeamHashCode = (str) => {
  if (!str) return 0;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
};

// Smart mapping for logo types based on team name keywords
export const getMascotForTeam = (teamName) => {
  const name = (teamName || '').toLowerCase();
  
  if (name.includes('hawk') || name.includes('eagle') || name.includes('falcon') || name.includes('bird')) {
    return 'hawk';
  }
  if (name.includes('tiger') || name.includes('cat') || name.includes('leopard') || name.includes('lion') || name.includes('singam') || name.includes('panthera')) {
    // Merge similar roaring feline types or keep separate
    if (name.includes('lion') || name.includes('singam')) return 'lion';
    if (name.includes('panther')) return 'panther';
    return 'tiger';
  }
  if (name.includes('bull') || name.includes('buffalo') || name.includes('bison') || name.includes('ox')) {
    return 'bull';
  }
  if (name.includes('wolf') || name.includes('husky') || name.includes('dog') || name.includes('hound')) {
    return 'wolf';
  }
  if (name.includes('cobra') || name.includes('snake') || name.includes('viper') || name.includes('python')) {
    return 'cobra';
  }
  if (name.includes('shark') || name.includes('orca') || name.includes('fish') || name.includes('dolphin')) {
    return 'shark';
  }
  if (name.includes('smasher') || name.includes('striker') || name.includes('blaster') || name.includes('hit') || name.includes('smash') || name.includes('clash')) {
    return 'smashers';
  }
  if (name.includes('titan') || name.includes('giant') || name.includes('colossus') || name.includes('shield') || name.includes('guard')) {
    return 'titans';
  }
  if (name.includes('king') || name.includes('royal') || name.includes('queen') || name.includes('emperor') || name.includes('crown') || name.includes('prince')) {
    return 'kings';
  }

  // Fallback to deterministic hash list
  const mascots = ['hawk', 'tiger', 'bull', 'lion', 'wolf', 'panther', 'cobra', 'shark', 'smashers', 'titans', 'kings', 'default'];
  const hash = getTeamHashCode(teamName);
  return mascots[hash % mascots.length];
};

const TeamLogo = ({ teamName, themeColor, size = 120, logoUrl, logoSvg }) => {
  if (logoSvg) {
    // Strip XML declaration if present to render inline SVG safely
    const cleanSvg = logoSvg.replace(/<\?xml.*?\?>/i, '');
    return (
      <div 
        style={{ 
          width: size, 
          height: size, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.5))',
          verticalAlign: 'middle'
        }}
        dangerouslySetInnerHTML={{ __html: cleanSvg }} 
      />
    );
  }

  if (logoUrl) {
    return (
      <img 
        src={logoUrl} 
        alt={`${teamName} Logo`} 
        style={{ 
          width: size, 
          height: size, 
          objectFit: 'contain',
          filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.5))',
          display: 'inline-block',
          verticalAlign: 'middle'
        }} 
      />
    );
  }

  const hash = getTeamHashCode(teamName);
  const mascot = getMascotForTeam(teamName);

  // High contrast secondary accent colors
  const contrastColors = ['#00f0ff', '#e0f2fe', '#d4fc34', '#a78bfa', '#fbbf24', '#ff7b00', '#22c55e', '#ec4899'];
  const secondaryColor = contrastColors[hash % contrastColors.length];

  // Sanitize teamName for unique, stable gradient IDs (prevents html2canvas black gradient bugs)
  const cleanTeamName = teamName ? teamName.replace(/[^a-zA-Z0-9]/g, '') : 'default';
  const outerGradId = `outerGrad-${cleanTeamName}`;
  const innerGradId = `innerGrad-${cleanTeamName}`;
  const fireGradId = `fireGrad-${cleanTeamName}`;

  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 120 120" 
      style={{ filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.5))', display: 'inline-block', verticalAlign: 'middle' }}
    >
      <defs>
        {/* Gradient for Outer Shield Border */}
        <linearGradient id={outerGradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={themeColor} />
          <stop offset="40%" stopColor="#1e293b" />
          <stop offset="100%" stopColor="#0f172a" />
        </linearGradient>

        {/* Gradient for Inner Shield Background */}
        <linearGradient id={innerGradId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#1e293b" />
          <stop offset="60%" stopColor="#0f172a" />
          <stop offset="100%" stopColor="#020617" />
        </linearGradient>

        {/* Gradient for Smashers Flame Trail */}
        <linearGradient id={fireGradId} x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#ef4444" stopOpacity="0.8" />
          <stop offset="50%" stopColor="#f97316" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#eab308" />
        </linearGradient>
      </defs>

      {/* Decorative Wing Accents behind shield (IPL style) */}
      <g opacity="0.85" transform="translate(60, 55) scale(0.95)">
        {/* Left Wing */}
        <path d="M -45 -35 Q -70 -25, -55 10 Q -40 30, -35 32 Q -40 10, -42 -10 Z" fill={themeColor} />
        <path d="M -48 -20 Q -65 -12, -52 18 Q -42 32, -38 34 Q -44 15, -45 -2 Z" fill={secondaryColor} />
        {/* Right Wing */}
        <path d="M 45 -35 Q 70 -25, 55 10 Q 40 30, 35 32 Q 40 10, 42 -10 Z" fill={themeColor} />
        <path d="M 48 -20 Q 65 -12, 52 18 Q 42 32, 38 34 Q 44 15, 45 -2 Z" fill={secondaryColor} />
      </g>

      {/* Outer Shield Border */}
      <path 
        d="M 15 10 L 105 10 Q 112 50 100 85 Q 88 110 60 118 Q 32 110 20 85 Q 8 50 15 10 Z" 
        fill={`url(#${outerGradId})`}
        stroke={themeColor}
        strokeWidth="2.5"
      />

      {/* Inner Shield Background */}
      <path 
        d="M 19 14 L 101 14 Q 107 50 96 82 Q 85 105 60 113 Q 35 105 24 82 Q 13 50 19 14 Z" 
        fill={`url(#${innerGradId})`}
        stroke="rgba(255, 255, 255, 0.08)"
        strokeWidth="1.2"
      />

      {/* Mascot Artwork */}
      {mascot === 'hawk' && (
        <g transform="translate(25, 22) scale(0.58)">
          {/* Head Outline & feathers */}
          <path d="M 10 70 L 25 35 Q 35 15, 60 15 Q 85 15, 95 30 L 105 45 C 100 50, 90 48, 85 45 C 80 42, 75 30, 60 30 C 50 30, 45 35, 40 45 C 38 52, 45 55, 52 50 C 60 45, 65 40, 75 42 C 85 44, 90 55, 78 68 C 65 80, 45 85, 30 85 Z" fill={secondaryColor} />
          {/* Beak */}
          <path d="M 85 45 Q 115 50, 110 75 Q 98 80, 78 68 C 85 64, 88 52, 85 45 Z" fill="#eab308" stroke="#78350f" strokeWidth="1.5" />
          {/* Eyebrow */}
          <path d="M 50 28 Q 65 32, 75 25" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" fill="none" />
          {/* Eye */}
          <circle cx="62" cy="36" r="3.5" fill="#fff" />
          <circle cx="63" cy="36" r="1.5" fill="#000" />
          {/* Neck Feather Lines */}
          <path d="M 20 50 L 35 48" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" opacity="0.8" />
          <path d="M 15 65 L 30 62" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" opacity="0.8" />
        </g>
      )}

      {mascot === 'tiger' && (
        <g transform="translate(26, 24) scale(0.58)">
          {/* Base Head */}
          <path d="M 10 30 Q 30 5, 60 5 Q 90 5, 110 30 L 100 80 Q 60 110, 20 80 Z" fill={secondaryColor} />
          {/* Ears */}
          <polygon points="12,32 -2,12 25,20" fill="#0f172a" stroke={secondaryColor} strokeWidth="2" />
          <polygon points="108,32 122,12 95,20" fill="#0f172a" stroke={secondaryColor} strokeWidth="2" />
          {/* Black Stripes */}
          <polygon points="50,5 70,5 60,25" fill="#000" />
          <polygon points="40,5 50,5 48,18" fill="#000" />
          <polygon points="80,5 70,5 72,18" fill="#000" />
          {/* White Cheeks */}
          <path d="M 12 50 Q 35 60, 35 80 Q 20 90, 12 70 Z" fill="#fff" />
          <path d="M 108 50 Q 85 60, 85 80 Q 100 90, 108 70 Z" fill="#fff" />
          {/* Angry Eyes */}
          <polygon points="30,42 48,45 42,52" fill="#eab308" />
          <polygon points="90,42 72,45 78,52" fill="#eab308" />
          <circle cx="39" cy="46" r="2" fill="#000" />
          <circle cx="81" cy="46" r="2" fill="#000" />
          {/* Snout & Roaring Mouth */}
          <path d="M 50 50 Q 60 58, 70 50 L 60 70 Z" fill="#000" />
          <path d="M 45 75 Q 60 85, 75 75 Q 60 92, 45 75 Z" fill="#ef4444" />
          {/* Fangs */}
          <polygon points="46,75 50,83 54,75" fill="#fff" />
          <polygon points="74,75 70,83 66,75" fill="#fff" />
        </g>
      )}

      {mascot === 'bull' && (
        <g transform="translate(25, 22) scale(0.58)">
          {/* Head Body */}
          <path d="M 25 35 L 95 35 L 90 75 Q 80 100, 60 102 Q 40 100, 30 75 Z" fill={secondaryColor} />
          {/* Large Ivory Horns */}
          <path d="M 28 35 C 10 32, -15 15, -12 -10 C -5 -15, 10 -2, 18 25" fill="#fff" stroke="#94a3b8" strokeWidth="2.5" />
          <path d="M 92 35 C 110 32, 135 15, 132 -10 C 125 -15, 110 -2, 102 25" fill="#fff" stroke="#94a3b8" strokeWidth="2.5" />
          {/* Angry Glowing Red Eyes */}
          <polygon points="35,45 52,50 42,55" fill="#ef4444" />
          <polygon points="85,45 68,50 78,55" fill="#ef4444" />
          {/* Nose Ring */}
          <path d="M 45 85 C 45 98, 75 98, 75 85" fill="none" stroke="#eab308" strokeWidth="4.5" strokeLinecap="round" />
          <path d="M 50 72 L 70 72 L 60 82 Z" fill="#1e293b" />
        </g>
      )}

      {mascot === 'lion' && (
        <g transform="translate(25, 22) scale(0.58)">
          {/* Mane Background */}
          <path d="M 60 2 C 20 5, -5 35, 10 75 C 20 95, 45 110, 60 112 C 75 110, 100 95, 110 75 C 125 35, 100 5, 60 2 Z" fill="#ea580c" />
          <path d="M 60 12 C 30 15, 10 40, 22 72 C 30 88, 48 98, 60 100 C 72 98, 90 88, 98 72 C 110 40, 90 15, 60 12 Z" fill="#9a3412" />
          {/* Face (Golden) */}
          <path d="M 35 40 L 85 40 L 75 75 L 60 88 L 45 75 Z" fill={secondaryColor} />
          {/* Brow */}
          <path d="M 40 45 Q 60 52, 80 45" stroke="#000" strokeWidth="3.5" fill="none" />
          {/* Eyes */}
          <polygon points="42,48 54,48 48,54" fill="#fff" />
          <polygon points="78,48 66,48 72,54" fill="#fff" />
          <circle cx="48" cy="50" r="1.5" fill="#000" />
          <circle cx="72" cy="50" r="1.5" fill="#000" />
          {/* Snout */}
          <polygon points="54,64 66,64 60,72" fill="#000" />
          {/* Roaring Fangs */}
          <path d="M 48 78 Q 60 84, 72 78" stroke="#fff" strokeWidth="2.5" fill="none" />
          <polygon points="50,78 53,83 56,78" fill="#fff" />
          <polygon points="70,78 67,83 64,78" fill="#fff" />
        </g>
      )}

      {mascot === 'wolf' && (
        <g transform="translate(25, 23) scale(0.58)">
          {/* Fur Outline */}
          <path d="M 60 5 Q 15 25, 20 70 Q 25 90, 60 108 Q 95 90, 100 70 Q 105 25, 60 5 Z" fill="#475569" />
          {/* Face */}
          <path d="M 60 18 Q 30 32, 35 65 L 45 75 L 60 90 L 75 75 L 85 65 Q 90 32, 60 18 Z" fill={secondaryColor} />
          {/* Ears */}
          <polygon points="20,40 -2,10 32,25" fill="#334155" />
          <polygon points="100,40 122,10 88,25" fill="#334155" />
          {/* Glowing Ice Blue Eyes */}
          <polygon points="40,46 54,44 48,53" fill="#06b6d4" />
          <polygon points="80,46 66,44 72,53" fill="#06b6d4" />
          <circle cx="47" cy="48" r="1" fill="#fff" />
          <circle cx="73" cy="48" r="1" fill="#fff" />
          {/* Nose */}
          <polygon points="53,70 67,70 60,78" fill="#000" />
          <path d="M 52 82 Q 60 88, 68 82" stroke="#000" strokeWidth="2" fill="none" />
        </g>
      )}

      {mascot === 'panther' && (
        <g transform="translate(25, 22) scale(0.58)">
          {/* Dark Panther Head */}
          <path d="M 60 10 C 25 10, 20 40, 20 70 C 20 85, 45 102, 60 105 C 75 102, 100 85, 100 70 C 100 40, 95 10, 60 10 Z" fill="#0f172a" stroke={themeColor} strokeWidth="1.5" />
          {/* Ears */}
          <polygon points="25,25 15,5 38,18" fill="#020617" />
          <polygon points="95,25 105,5 82,18" fill="#020617" />
          {/* Glowing Purple Eyes */}
          <polygon points="36,44 52,44 44,52" fill={secondaryColor} />
          <polygon points="84,44 68,44 76,52" fill={secondaryColor} />
          <circle cx="44" cy="47" r="1.5" fill="#000" />
          <circle cx="76" cy="47" r="1.5" fill="#000" />
          {/* Nose */}
          <polygon points="54,65 66,65 60,73" fill="#020617" />
          <path d="M 48 76 Q 60 82, 72 76" stroke={secondaryColor} strokeWidth="1.5" fill="none" />
        </g>
      )}

      {mascot === 'cobra' && (
        <g transform="translate(25, 20) scale(0.58)">
          {/* Spread Hood */}
          <path d="M 60 5 C 20 5, -8 30, -5 65 C -2 80, 25 85, 40 92 L 60 110 L 80 92 C 95 85, 122 80, 125 65 C 128 30, 100 5, 60 5 Z" fill="#15803d" />
          {/* Golden Pattern */}
          <path d="M 60 12 C 30 12, 12 32, 15 58 C 15 72, 35 75, 45 80 L 60 98 L 75 80 C 85 75, 105 72, 105 58 C 108 32, 90 12, 60 12 Z" fill="#eab308" />
          {/* Cobra Head */}
          <path d="M 45 40 Q 60 28, 75 40 L 68 78 L 52 78 Z" fill={secondaryColor} />
          {/* Red Venom Eyes */}
          <polygon points="48,48 56,52 50,56" fill="#ef4444" />
          <polygon points="72,48 64,52 70,56" fill="#ef4444" />
          {/* Fangs */}
          <polygon points="52,78 54,88 57,78" fill="#fff" />
          <polygon points="68,78 66,88 63,78" fill="#fff" />
        </g>
      )}

      {mascot === 'shark' && (
        <g transform="translate(24, 22) scale(0.58)">
          {/* Water Splash */}
          <path d="M 5 80 Q 60 60, 115 80 C 95 95, 25 95, 5 80 Z" fill="#0ea5e9" />
          {/* Grey Shark Body */}
          <path d="M 60 5 C 40 25, 20 45, 12 70 C 25 80, 50 82, 60 82 C 70 82, 95 80, 108 70 C 100 45, 80 25, 60 5 Z" fill="#475569" />
          {/* Underbelly */}
          <path d="M 60 40 C 50 50, 30 65, 25 78 C 45 82, 75 82, 95 78 C 90 65, 70 50, 60 40 Z" fill="#f8fafc" />
          {/* Open Jaws */}
          <path d="M 35 68 Q 60 52, 85 68 Q 60 92, 35 68 Z" fill="#ef4444" stroke="#000" strokeWidth="2" />
          {/* Sharp Teeth Rows */}
          <polygon points="38,66 43,62 46,67" fill="#fff" />
          <polygon points="46,67 51,61 54,68" fill="#fff" />
          <polygon points="54,68 59,60 62,68" fill="#fff" />
          <polygon points="62,68 67,60 70,68" fill="#fff" />
          <polygon points="70,68 75,61 78,67" fill="#fff" />
          <polygon points="78,67 83,62 86,66" fill="#fff" />
          <polygon points="45,74 50,78 55,73" fill="#fff" />
          <polygon points="55,73 60,79 65,73" fill="#fff" />
          <polygon points="65,73 70,78 75,74" fill="#fff" />
          {/* Eye */}
          <circle cx="60" cy="28" r="3" fill="#000" />
          <circle cx="61" cy="27" r="1" fill="#fff" />
        </g>
      )}

      {mascot === 'smashers' && (
        <g transform="translate(22, 22) scale(0.62)">
          {/* Speed Fire Trail */}
          <path d="M -5 55 Q 35 40, 70 30 Q 55 60, 25 80 Z" fill={`url(#${fireGradId})`} />
          {/* Shuttlecock Skirt */}
          <path d="M 45 32 L 75 12 C 80 10, 85 18, 80 23 L 62 48 L 82 72 C 87 77, 82 85, 77 82 L 45 62 Z" fill="#ffffff" stroke="rgba(0,0,0,0.2)" strokeWidth="1.5" />
          {/* Cork Base */}
          <path d="M 45 32 C 36 32, 28 40, 28 48 C 28 56, 36 64, 45 64 Z" fill="#ef4444" />
          {/* Racket Rim */}
          <path d="M 12 72 L -5 95 M 0 60 C -12 72, -8 92, 10 98 C 28 104, 38 90, 42 78 C 30 78, 18 72, 12 72 Z" fill="none" stroke="#94a3b8" strokeWidth="4.5" />
          {/* Strings */}
          <path d="M 2 74 L 30 92 M 10 68 L 36 84 M -4 82 L 20 98" stroke="rgba(255,255,255,0.4)" strokeWidth="1" />
          <path d="M 24 78 L -4 92 M 32 86 L 6 98 M 18 70 L -10 84" stroke="rgba(255,255,255,0.4)" strokeWidth="1" />
        </g>
      )}

      {mascot === 'titans' && (
        <g transform="translate(25, 22) scale(0.58)">
          {/* Lightning Bolts */}
          <polygon points="5,45 28,45 20,68 45,35 22,35 30,12" fill="#eab308" />
          <polygon points="115,45 92,45 100,68 75,35 98,35 90,12" fill="#eab308" />
          {/* Crimson Plume */}
          <path d="M 60 -5 C 45 -5, 30 8, 30 28 L 90 28 C 90 8, 75 -5, 60 -5 Z" fill="#dc2626" />
          {/* Helmet Mask */}
          <path d="M 35 28 L 85 28 L 80 75 C 75 90, 60 98, 60 98 C 60 98, 45 90, 40 75 Z" fill="#94a3b8" stroke="#475569" strokeWidth="2" />
          {/* Eye Slits */}
          <polygon points="42,42 55,46 55,50 42,46" fill="#000" />
          <polygon points="78,42 65,46 65,50 78,46" fill="#000" />
          {/* Nose Guard */}
          <polygon points="56,40 64,40 60,65" fill="#475569" />
        </g>
      )}

      {mascot === 'kings' && (
        <g transform="translate(25, 25) scale(0.58)">
          {/* Red Cushion */}
          <path d="M 20 60 C 20 40, 100 40, 100 60 Z" fill="#7f1d1d" />
          {/* Crown Peaks */}
          <path d="M 12 75 L 18 42 L 38 58 L 60 22 L 82 58 L 102 42 L 108 75 Z" fill="#eab308" stroke="#ca8a04" strokeWidth="2.5" />
          {/* Rim */}
          <rect x="12" y="72" width="96" height="10" rx="3" fill="#ca8a04" />
          {/* Jewel Details */}
          <circle cx="20" cy="77" r="3" fill="#ef4444" />
          <circle cx="35" cy="77" r="3" fill="#22c55e" />
          <circle cx="60" cy="77" r="3" fill="#3b82f6" />
          <circle cx="85" cy="77" r="3" fill="#22c55e" />
          <circle cx="100" cy="77" r="3" fill="#ef4444" />
          <circle cx="18" cy="38" r="4" fill="#3b82f6" stroke="#ca8a04" strokeWidth="1.5" />
          <circle cx="60" cy="18" r="5" fill="#ef4444" stroke="#ca8a04" strokeWidth="1.5" />
          <circle cx="102" cy="38" r="4" fill="#3b82f6" stroke="#ca8a04" strokeWidth="1.5" />
        </g>
      )}

      {mascot === 'default' && (
        <g transform="translate(25, 23) scale(0.58)">
          {/* Crossed Rackets */}
          <path d="M 5 95 L 115 5 M 0 90 L 10 100" stroke="#ca8a04" strokeWidth="4" strokeLinecap="round" />
          <path d="M 115 95 L 5 5 M 120 90 L 110 100" stroke="#e2e8f0" strokeWidth="4" strokeLinecap="round" />
          {/* Racket Heads */}
          <ellipse cx="95" cy="22" rx="14" ry="18" transform="rotate(25 95 22)" fill="none" stroke="#ca8a04" strokeWidth="4" />
          <ellipse cx="25" cy="22" rx="14" ry="18" transform="rotate(-25 25 22)" fill="none" stroke="#e2e8f0" strokeWidth="4" />
          {/* Golden Shuttlecock */}
          <g transform="translate(42, 28) scale(0.65)">
            <path d="M 10 32 L 40 12 C 45 10, 50 18, 45 23 L 27 48 L 47 72 C 52 77, 47 85, 42 82 L 10 62 Z" fill="#eab308" />
            <path d="M 10 32 C 1 32, -7 40, -7 48 C -7 56, 1 64, 10 64 Z" fill="#ffffff" />
          </g>
        </g>
      )}

      {/* Dynamic Star Indicators at bottom center of shield */}
      <g transform="translate(60, 100)">
        <circle cx="0" cy="0" r="9" fill={themeColor} />
        <polygon 
          points="0,-6 2,-2 6,-2 3,1 4,5 0,3 -4,5 -3,1 -6,-2 -2,-2" 
          fill="#000" 
        />
      </g>
    </svg>
  );
};

export default TeamLogo;

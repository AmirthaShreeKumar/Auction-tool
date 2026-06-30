import React, { forwardRef, useMemo } from 'react';
import TeamLogo from './TeamLogo';

// Helper: Hex color to HSL
const hexToHsl = (hex) => {
  if (!hex) return { h: 0, s: 0, l: 0 };
  hex = hex.replace(/^#/, '');
  if (hex.length === 3) {
    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  }
  let r = parseInt(hex.substring(0, 2), 16) / 255;
  let g = parseInt(hex.substring(2, 4), 16) / 255;
  let b = parseInt(hex.substring(4, 6), 16) / 255;

  let max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;

  if (max === min) {
    h = s = 0;
  } else {
    let d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return { h: h * 360, s: s * 100, l: l * 100 };
};

// Helper: HSL to Hex
const hslToHex = (h, s, l) => {
  s /= 100;
  l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = n => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
};

// Generate dynamic HSL variations based on primary color
const getThemeVariations = (themeColor) => {
  const hsl = hexToHsl(themeColor);
  
  // Advanced: Primary Team color (Hue H)
  const advancedColor = themeColor;
  
  // Intermediate: Hue shifted by 120 degrees (Hue H + 120) for balanced triadic colors
  const intermediateColor = hslToHex((hsl.h + 120) % 360, Math.max(hsl.s, 80), Math.max(hsl.l, 45));
  
  // Beginner: Hue shifted by 240 degrees (Hue H + 240)
  const beginnerColor = hslToHex((hsl.h + 240) % 360, Math.max(hsl.s, 80), Math.max(hsl.l, 45));

  // Accent: lighter/softer tint of the primary team color (Hue H)
  const accentColor = hslToHex(hsl.h, Math.max(hsl.s, 80), Math.min(hsl.l + 15, 80));
  
  // Backdrop: very dark slate with a tint of the theme
  const darkBgColor = hslToHex(hsl.h, Math.min(hsl.s, 20), 5);
  
  return {
    advanced: advancedColor,
    intermediate: intermediateColor,
    beginner: beginnerColor,
    accent: accentColor,
    darkBg: darkBgColor
  };
};

// Vector SVG Icons for Hexagon Badges
const CrownIcon = ({ size = 20, color }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7z" fill={color} fillOpacity="0.25" />
    <path d="M3 20h18" />
  </svg>
);

const StarIcon = ({ size = 20, color }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12,2 15,9 22,9 17,14 19,21 12,17 5,21 7,14 2,9 9,9" fill={color} fillOpacity="0.25" />
  </svg>
);

const TriangleIcon = ({ size = 20, color }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12,4 21,18 3,18" fill={color} fillOpacity="0.25" />
  </svg>
);

// Vector SVG Icons for Bottom Stats Grid
const UsersIcon = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
    <path d="M9 11.75c1.65 0 3-1.35 3-3s-1.35-3-3-3-3 1.35-3 3 1.35 3 3 3zm-3 1.5c-2 0-6 1-6 3v1.5h8v-1.5c0-2-4-3-6-3z" opacity="0.6" />
    <path d="M15 11.75c1.65 0 3-1.35 3-3s-1.35-3-3-3-3 1.35-3 3 1.35 3 3 3zm3 1.5c2 0 6 1 6 3v1.5h-8v-1.5c0-2 4-3 6-3z" opacity="0.6" />
  </svg>
);

const FemaleIcon = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="5" />
    <line x1="12" y1="13" x2="12" y2="21" />
    <line x1="8" y1="17" x2="16" y2="17" />
  </svg>
);

const ShuttlecockMiniIcon = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 120 120" fill="none">
    <path d="M35,30 L85,30 C90,65 75,90 60,95 C45,90 30,65 35,30 Z" stroke="currentColor" strokeWidth="6.5" />
    <path d="M33,48 C50,55 70,55 87,48 M35,68 C50,75 70,75 85,68" stroke="currentColor" strokeWidth="5.5" />
    <path d="M45,95 C45,108 75,108 75,95 Z" fill="currentColor" />
  </svg>
);

const WalletIcon = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="2.5" fill="currentColor" fillOpacity="0.1" />
    <path d="M15 11h7v4h-7z" fill="currentColor" />
    <circle cx="18.5" cy="13" r="1.2" fill="black" />
    <path d="M2 8h20" />
  </svg>
);

// Flying outline shuttlecock speed trail graphic on top-right
const FlyingShuttlecock = ({ color }) => (
  <svg 
    width="90" 
    height="90" 
    viewBox="0 0 100 100" 
    style={{ 
      position: 'absolute', 
      top: '45px', 
      right: '45px', 
      opacity: 0.65,
      zIndex: 10,
      pointerEvents: 'none'
    }}
  >
    {/* Feathers outline */}
    <path 
      d="M55,40 L90,15 C92,20 88,28 82,32 L65,48" 
      stroke={color} 
      strokeWidth="2.8" 
      strokeLinecap="round" 
      fill="none" 
    />
    <path 
      d="M50,45 L80,10 C83,14 78,24 72,28 L58,40" 
      stroke={color} 
      strokeWidth="2.8" 
      strokeLinecap="round" 
      fill="none" 
    />
    {/* Connecting bands */}
    <path d="M64,30 Q74,38 84,24" stroke={color} strokeWidth="2" fill="none" />
    <path d="M52,38 Q62,46 72,32" stroke={color} strokeWidth="2" fill="none" />
    
    {/* Cork base */}
    <path d="M42,52 C36,46 44,38 50,44 Z" fill={color} />
    
    {/* Speed Trails */}
    <line x1="30" y1="64" x2="10" y2="84" stroke={color} strokeWidth="3" strokeLinecap="round" />
    <line x1="42" y1="76" x2="22" y2="96" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
    <line x1="20" y1="54" x2="4" y2="70" stroke={color} strokeWidth="2" strokeLinecap="round" />
  </svg>
);

// Vector Hexagon Badge (upright points, stars, and inner icons)
const HexagonBadge = ({ color, icon }) => {
  return (
    <div style={{ position: 'relative', width: '80px', height: '90px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {/* SVG Hexagon background with glow and double borders */}
      <svg width="80" height="90" viewBox="0 0 80 90" style={{ position: 'absolute', top: 0, left: 0 }}>
        {/* Outer Hexagon border */}
        <polygon 
          points="40,2 78,24 78,66 40,88 2,66 2,24" 
          fill="rgba(5, 8, 15, 0.85)" 
          stroke={color} 
          strokeWidth="3.2"
          strokeLinejoin="round"
          filter={`drop-shadow(0 0 4px ${color}44)`}
        />
        {/* Inner detail border */}
        <polygon 
          points="40,6 74,26 74,64 40,84 6,64 6,26" 
          fill="none" 
          stroke={`${color}22`} 
          strokeWidth="1"
          strokeLinejoin="round"
        />
      </svg>
      
      {/* Overlay Content */}
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', paddingTop: '6px' }}>
        {/* 5 Stars */}
        <div style={{ display: 'flex', gap: '1px', color: color }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <svg key={i} width="5" height="5" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="12,2 15,9 22,9 17,14 19,21 12,17 5,21 7,14 2,9 9,9" />
            </svg>
          ))}
        </div>
        {/* Icon in center */}
        <div style={{ color: color }}>
          {icon}
        </div>
      </div>
    </div>
  );
};

// Tabular Roster Table component to display player list with Wissen ID, Full Name, Gender, and Skill Category
const RosterTable = ({ players, themeColor, vars }) => {
  return (
    <div style={{
      width: '100%',
      background: 'rgba(17, 24, 39, 0.45)',
      backdropFilter: 'blur(10px)',
      border: '1.5px solid rgba(255, 255, 255, 0.06)',
      borderLeft: `5px solid ${themeColor}`,
      borderRadius: '12px',
      padding: '12px 16px',
      boxShadow: '0 8px 30px rgba(0,0,0,0.4)',
      boxSizing: 'border-box',
      marginBottom: '14px',
      minHeight: '390px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: players.length === 0 ? 'center' : 'flex-start'
    }}>
      <table style={{
        width: '100%',
        borderCollapse: 'collapse',
        textAlign: 'left',
        fontFamily: "'Montserrat', sans-serif"
      }}>
        <thead>
          <tr style={{ borderBottom: `2.5px solid ${themeColor}` }}>
            <th style={{ padding: '6px 8px', color: themeColor, fontSize: '0.85rem', fontWeight: '900', letterSpacing: '1px', textTransform: 'uppercase' }}>S.No</th>
            <th style={{ padding: '6px 8px', color: themeColor, fontSize: '0.85rem', fontWeight: '900', letterSpacing: '1px', textTransform: 'uppercase' }}>Wissen ID</th>
            <th style={{ padding: '6px 8px', color: themeColor, fontSize: '0.85rem', fontWeight: '900', letterSpacing: '1px', textTransform: 'uppercase' }}>Full Name</th>
            <th style={{ padding: '6px 8px', color: themeColor, fontSize: '0.85rem', fontWeight: '900', letterSpacing: '1px', textTransform: 'uppercase' }}>Gender</th>
            <th style={{ padding: '6px 8px', color: themeColor, fontSize: '0.85rem', fontWeight: '900', letterSpacing: '1px', textTransform: 'uppercase' }}>Skill Category</th>
          </tr>
        </thead>
        <tbody>
          {players.map((p, idx) => {
            let skillColor = vars.beginner;
            if (p.skillLevel?.toLowerCase() === 'advanced') skillColor = vars.advanced;
            else if (p.skillLevel?.toLowerCase() === 'intermediate') skillColor = vars.intermediate;

            return (
              <tr key={p.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)', backgroundColor: idx % 2 === 0 ? 'rgba(255, 255, 255, 0.01)' : 'transparent' }}>
                <td style={{ padding: '6px 8px', fontSize: '0.9rem', fontWeight: '700', color: 'rgba(255,255,255,0.6)' }}>
                  {String(idx + 1).padStart(2, '0')}
                </td>
                <td style={{ padding: '6px 8px', fontSize: '0.9rem', fontWeight: '700', color: 'white' }}>
                  {p.wissenId}
                </td>
                <td style={{ padding: '6px 8px', fontSize: '0.95rem', fontWeight: '800', color: 'white', textTransform: 'uppercase' }}>
                  {p.fullName}
                </td>
                <td style={{ padding: '6px 8px', fontSize: '0.9rem', color: 'rgba(255,255,255,0.8)' }}>
                  {p.gender}
                </td>
                <td style={{ padding: '6px 8px' }}>
                  <span style={{
                    color: skillColor,
                    fontWeight: '900',
                    fontSize: '0.75rem',
                    letterSpacing: '0.5px',
                    textTransform: 'uppercase',
                    background: `${skillColor}15`,
                    padding: '3px 8px',
                    borderRadius: '4px',
                    border: `1px solid ${skillColor}33`,
                    display: 'inline-block'
                  }}>
                    {p.skillLevel}
                  </span>
                </td>
              </tr>
            );
          })}
          {players.length === 0 && (
            <tr>
              <td colSpan="5" style={{ padding: '40px 8px', textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontStyle: 'italic', fontSize: '0.95rem' }}>
                No drafted players in this team yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

// 4 Individual stats widgets at bottom
const StatCard = ({ icon, label, value, color }) => {
  return (
    <div style={{
      background: 'rgba(17, 24, 39, 0.42)',
      backdropFilter: 'blur(8px)',
      border: '1.5px solid rgba(255, 255, 255, 0.06)',
      borderBottom: `3.2px solid ${color}`,
      borderRadius: '12px',
      padding: '12px 16px',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      flex: 1,
      boxShadow: '0 8px 25px rgba(0,0,0,0.4)'
    }}>
      {/* Icon block with background tint */}
      <div style={{
        width: '36px',
        height: '36px',
        borderRadius: '8px',
        background: `${color}15`,
        color: color,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0
      }}>
        {icon}
      </div>
      {/* Label and Value */}
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <span style={{ 
          fontSize: '0.62rem', 
          fontWeight: '800', 
          color: 'rgba(255,255,255,0.45)', 
          textTransform: 'uppercase', 
          letterSpacing: '0.5px' 
        }}>
          {label}
        </span>
        <span style={{ 
          fontSize: '1.45rem', 
          fontWeight: '900', 
          color: 'white', 
          fontFamily: "'Montserrat', sans-serif",
          lineHeight: 1.1,
          marginTop: '2px'
        }}>
          {value}
        </span>
      </div>
    </div>
  );
};

// Clean vector stadium backdrop featuring curved neon concentric lines and spotlight rays
const StadiumBackdrop = ({ themeColor, teamName, vars }) => {
  const cleanTeamName = teamName ? teamName.replace(/[^a-zA-Z0-9]/g, '') : 'default';
  const bgGradId = `revealBgGrad-${cleanTeamName}`;
  const spotLeftId = `revealSpotLeft-${cleanTeamName}`;
  const spotRightId = `revealSpotRight-${cleanTeamName}`;
  const beamLeftId = `revealBeamLeft-${cleanTeamName}`;
  const beamRightId = `revealBeamRight-${cleanTeamName}`;

  return (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 0,
      pointerEvents: 'none',
      backgroundColor: vars.darkBg,
      overflow: 'hidden'
    }}>
      <svg 
        width="100%" 
        height="100%" 
        viewBox="0 0 800 1000" 
        preserveAspectRatio="none"
        style={{ position: 'absolute', top: 0, left: 0 }}
      >
        <defs>
          {/* Backdrop Radial Gradient - strictly using advanced (primary theme) color for matching theme */}
          <radialGradient id={bgGradId} cx="50%" cy="40%" r="65%">
            <stop offset="0%" stopColor={vars.advanced} stopOpacity="0.16" />
            <stop offset="50%" stopColor={vars.advanced} stopOpacity="0.05" />
            <stop offset="100%" stopColor={vars.darkBg} />
          </radialGradient>

          {/* Dynamic crossing lights */}
          <radialGradient id={spotLeftId} cx="10%" cy="10%" r="45%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.45" />
            <stop offset="30%" stopColor={vars.advanced} stopOpacity="0.15" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
          <radialGradient id={spotRightId} cx="90%" cy="10%" r="45%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.45" />
            <stop offset="30%" stopColor={vars.advanced} stopOpacity="0.15" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>

          <linearGradient id={beamLeftId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.32" />
            <stop offset="50%" stopColor={vars.advanced} stopOpacity="0.1" />
            <stop offset="100%" stopColor="transparent" />
          </linearGradient>
          <linearGradient id={beamRightId} x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.32" />
            <stop offset="50%" stopColor={vars.advanced} stopOpacity="0.1" />
            <stop offset="100%" stopColor="transparent" />
          </linearGradient>
        </defs>

        {/* Backdrop Base */}
        <rect width="800" height="1000" fill={vars.darkBg} />
        <rect width="800" height="1000" fill={`url(#${bgGradId})`} />

        {/* Curved neon rings in background (IPL champion style) */}
        <g stroke={themeColor} fill="none" opacity="0.08">
          <circle cx="400" cy="350" r="300" strokeWidth="4" />
          <circle cx="400" cy="350" r="450" strokeWidth="2" strokeDasharray="10,5" />
          <circle cx="400" cy="350" r="600" strokeWidth="6" />
          <path d="M-100,200 Q400,-100 900,200" strokeWidth="8" />
          <path d="M-100,800 Q400,1100 900,800" strokeWidth="5" />
        </g>

        {/* Dynamic spotlights */}
        <rect width="800" height="1000" fill={`url(#${spotLeftId})`} />
        <rect width="800" height="1000" fill={`url(#${spotRightId})`} />

        {/* Crossing light beams in an X shape */}
        <polygon points="80,-50 800,600 800,800 80,50" fill={`url(#${beamLeftId})`} />
        <polygon points="720,-50 0,600 0,800 720,50" fill={`url(#${beamRightId})`} />

        {/* Translucent Smoke/Clouds - strictly monochrome to the primary color */}
        <g opacity="0.05">
          <circle cx="200" cy="300" r="150" fill={vars.advanced} filter="blur(50px)" />
          <circle cx="600" cy="400" r="160" fill={vars.advanced} filter="blur(60px)" />
          <circle cx="400" cy="700" r="180" fill={vars.advanced} filter="blur(55px)" />
        </g>
      </svg>
    </div>
  );
};

const TeamCardExport = forwardRef(({ team }, ref) => {
  if (!team) return null;

  const themeColor = team.themeColor || '#1d4ed8';
  const vars = getThemeVariations(themeColor);

  // Sort players by skill level (Advanced -> Intermediate -> Beginner)
  const sortedPlayers = useMemo(() => {
    const skillOrder = { advanced: 1, intermediate: 2, beginner: 3 };
    return [...(team.players || [])].sort((a, b) => {
      const orderA = skillOrder[a.skillLevel?.toLowerCase()] || 99;
      const orderB = skillOrder[b.skillLevel?.toLowerCase()] || 99;
      return orderA - orderB;
    });
  }, [team.players]);

  // Split and style massive team name
  const splitTeamNameText = (name) => {
    if (!name) return '';
    const parts = name.split(' ');
    if (parts.length > 1) {
      const cityPart = parts[0].toUpperCase();
      const mascotPart = parts.slice(1).join(' ').toUpperCase();
      
      // Calculate font size dynamically based on length of mascot name to prevent overflow
      let fontSize = '4.5rem';
      if (mascotPart.length > 12) fontSize = '3.0rem';
      else if (mascotPart.length > 9) fontSize = '3.6rem';
      else if (mascotPart.length > 7) fontSize = '4.0rem';

      return (
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
          <span style={{ 
            color: themeColor, 
            fontSize: '1.25rem', 
            fontWeight: '800', 
            letterSpacing: '6px', 
            textTransform: 'uppercase',
            marginBottom: '4px',
            fontFamily: "'Montserrat', sans-serif"
          }}>
            {cityPart}
          </span>
          <h1 style={{ 
            color: '#ffffff',
            fontFamily: "'Montserrat', 'Arial Black', sans-serif",
            fontSize: fontSize,
            fontWeight: 900,
            fontStyle: 'italic',
            textTransform: 'uppercase',
            lineHeight: 0.9,
            letterSpacing: '-1.5px',
            textShadow: `0 0 20px ${themeColor}55, 3px 3px 0px rgba(0,0,0,0.95)`,
            margin: 0
          }}>
            {mascotPart}
          </h1>
        </div>
      );
    }

    return (
      <h1 style={{ 
        color: '#ffffff',
        fontFamily: "'Montserrat', 'Arial Black', sans-serif",
        fontSize: '4.5rem',
        fontWeight: 900,
        fontStyle: 'italic',
        textTransform: 'uppercase',
        lineHeight: 0.9,
        letterSpacing: '-1.5px',
        textShadow: `0 0 20px ${themeColor}55, 3px 3px 0px rgba(0,0,0,0.95)`,
        margin: 0
      }}>
        {name}
      </h1>
    );
  };

  return (
    <div 
      ref={ref}
      style={{
        width: '800px',
        height: '1000px',
        backgroundColor: vars.darkBg,
        color: 'white',
        fontFamily: "'Montserrat', 'Inter', sans-serif",
        padding: '30px 40px 20px 40px',
        position: 'relative',
        overflow: 'hidden',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        border: `3px solid ${themeColor}`,
        boxShadow: '0 25px 60px rgba(0,0,0,0.8)'
      }}
    >
      <StadiumBackdrop themeColor={themeColor} teamName={team.teamName} vars={vars} />
      <FlyingShuttlecock color={themeColor} />

      {/* Top Section - Brand Hero */}
      <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', width: '100%' }}>
        <div style={{ display: 'flex', width: '100%', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
          {/* Logo container: 110px for SVGs/defaults, scaled up to 140px for custom uploaded image logos */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            width: team.logoUrl ? '140px' : '110px', 
            height: team.logoUrl ? '140px' : '110px', 
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <TeamLogo teamName={team.teamName} themeColor={themeColor} size={team.logoUrl ? 140 : 110} logoUrl={team.logoUrl} logoSvg={team.logoSvg} />
          </div>
          
          {/* Massive team name */}
          <div style={{ flex: 1, paddingLeft: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'center', overflow: 'hidden' }}>
            {splitTeamNameText(team.teamName)}
            <p style={{ 
              fontSize: '0.75rem', 
              fontWeight: 800, 
              color: vars.accent, 
              letterSpacing: '5px', 
              textTransform: 'uppercase',
              margin: '8px 0 0 2px',
              fontFamily: "'Montserrat', sans-serif"
            }}>
              Badminton Squad Reveal
            </p>
          </div>
        </div>

        {/* Slanted Championship Owner Banner */}
        <div style={{ display: 'flex', gap: '0px', marginBottom: '12px', transform: 'skewX(-12deg)', alignSelf: 'center' }}>
          <div style={{ 
            backgroundColor: themeColor, 
            padding: '8px 24px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            boxShadow: '0 4px 10px rgba(0,0,0,0.4)',
            border: `1.5px solid ${themeColor}`
          }}>
            <span style={{ 
              transform: 'skewX(12deg)', 
              color: '#000', 
              fontWeight: '900', 
              fontSize: '0.85rem', 
              letterSpacing: '1px',
              fontFamily: "'Montserrat', sans-serif"
            }}>
              TEAM OWNER
            </span>
          </div>
          <div style={{ 
            backgroundColor: 'rgba(5, 8, 15, 0.82)', 
            border: `1.5px solid ${themeColor}`,
            borderLeft: 'none',
            padding: '7px 36px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            boxShadow: '0 4px 10px rgba(0,0,0,0.4)'
          }}>
            <span style={{ 
              transform: 'skewX(12deg)', 
              color: '#ffffff', 
              fontWeight: '800', 
              fontSize: '0.85rem', 
              letterSpacing: '1px',
              fontFamily: "'Montserrat', sans-serif"
            }}>
              {(team.ownerName || 'UNREGISTERED').toUpperCase()}
            </span>
          </div>
        </div>
      </div>

      {/* Roster Players Tabular Grid */}
      <div style={{ width: '100%', margin: '0 auto', position: 'relative', zIndex: 10 }}>
        <RosterTable 
          players={sortedPlayers} 
          themeColor={themeColor} 
          vars={vars} 
        />
      </div>

      {/* Bottom Section - Championship Stats & Slogan */}
      <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', width: '100%', gap: '12px' }}>
        {/* Stats Container (4 individual cards mapping to triadic colors) */}
        <div style={{ display: 'flex', width: '100%', gap: '12px' }}>
          <StatCard 
            icon={<UsersIcon size={20} />} 
            label="Total Players" 
            value={team.totalPlayers || 0} 
            color={vars.advanced} 
          />
          <StatCard 
            icon={<FemaleIcon size={18} />} 
            label="Females" 
            value={team.femalePlayers || 0} 
            color={vars.intermediate} 
          />
          <StatCard 
            icon={<ShuttlecockMiniIcon size={18} />} 
            label="Beginners" 
            value={team.beginnerPlayers || 0} 
            color={vars.beginner} 
          />
          <StatCard 
            icon={<WalletIcon size={18} />} 
            label="Purse Left" 
            value={`₹ ${(team.purseRemaining || 0).toLocaleString()}`} 
            color={vars.intermediate} 
          />
        </div>

        {/* Dynamic Sporty Slogan */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '0px', gap: '4px', paddingBottom: '12px' }}>
          <div style={{ 
            fontFamily: "'Montserrat', sans-serif", 
            fontSize: '1.15rem', 
            fontWeight: '900', 
            fontStyle: 'italic', 
            letterSpacing: '3.5px', 
            color: themeColor,
            textTransform: 'uppercase',
            textShadow: '0 2px 5px rgba(0,0,0,0.8)',
            zIndex: 10
          }}>
            One Team, One Dream!
          </div>
          {/* Three Stars */}
          <div style={{ display: 'flex', gap: '4px', zIndex: 10 }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill={themeColor}>
              <polygon points="12,2 15,9 22,9 17,14 19,21 12,17 5,21 7,14 2,9 9,9" />
            </svg>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="#ffffff" style={{ marginTop: '-2px' }}>
              <polygon points="12,2 15,9 22,9 17,14 19,21 12,17 5,21 7,14 2,9 9,9" />
            </svg>
            <svg width="10" height="10" viewBox="0 0 24 24" fill={themeColor}>
              <polygon points="12,2 15,9 22,9 17,14 19,21 12,17 5,21 7,14 2,9 9,9" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
});

TeamCardExport.displayName = 'TeamCardExport';

export default TeamCardExport;

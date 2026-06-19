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
    h = s = 0; // achromatic
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

// Mini SVG Icons for html2canvas compatibility
const UsersIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
  </svg>
);

const FemaleIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="9" r="6" />
    <line x1="12" y1="15" x2="12" y2="21" />
    <line x1="9" y1="18" x2="15" y2="18" />
  </svg>
);

const ShuttlecockMiniIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <path d="M 6 8 L 18 5 C 19 8, 17 15, 12 18 C 7 15, 5 8, 6 8" />
    <path d="M 12 18 C 10 18, 8 20, 8 21 C 8 22, 10 23, 12 23 C 14 23, 16 22, 16 21 C 16 20, 14 18, 12 18" fill="currentColor" />
    <line x1="8" y1="7" x2="15" y2="15" />
    <line x1="16" y1="6" x2="9" y2="14" />
  </svg>
);

const WalletIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="M12 11h10v4H12z" fill="currentColor" />
    <circle cx="17" cy="13" r="1.5" fill="black" />
  </svg>
);

// Large flying shuttlecock SVG for the header accent (adapted to theme)
const ShuttlecockSpeedIcon = ({ color, size = 80 }) => {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={{ transform: 'rotate(-25deg)', opacity: 0.85 }}>
      {/* Speed lines */}
      <line x1="5" y1="20" x2="40" y2="30" stroke={color} strokeWidth="3" strokeLinecap="round" />
      <line x1="5" y1="50" x2="35" y2="50" stroke={color} strokeWidth="4" strokeLinecap="round" />
      <line x1="5" y1="80" x2="40" y2="70" stroke={color} strokeWidth="3" strokeLinecap="round" />
      
      {/* Shuttlecock skirt/feathers */}
      <path d="M 45 35 L 75 15 C 80 12, 85 20, 80 25 L 60 50 L 80 75 C 85 80, 80 88, 75 85 L 45 65 Z" fill="none" stroke="white" strokeWidth="4" />
      <path d="M 52 40 L 70 30" stroke="white" strokeWidth="2" />
      <path d="M 50 50 L 72 50" stroke="white" strokeWidth="2" />
      <path d="M 52 60 L 70 70" stroke="white" strokeWidth="2" />

      {/* Shuttlecock cork base */}
      <path d="M 45 35 C 38 35, 32 42, 32 50 C 32 58, 38 65, 45 65 Z" fill={color} />
    </svg>
  );
};

// Sports Roster Backdrop (Dark stadium atmosphere with arena floodlights and energy streaks)
const CourtBackground = ({ themeColor, teamName }) => {
  const hsl = hexToHsl(themeColor);
  
  // Dynamic secondary and accent colors derived from themeColor to match and contrast beautifully
  const secondaryColor = hslToHex((hsl.h + 140) % 360, Math.max(hsl.s, 85), Math.max(hsl.l, 50));
  const accentColor = hslToHex((hsl.h + 220) % 360, Math.max(hsl.s, 90), Math.max(hsl.l, 55));
  
  const darkBgColor = hslToHex(hsl.h, Math.min(hsl.s, 25), 6);
  const darkFloorColor = hslToHex(hsl.h, Math.min(hsl.s, 30), 10);

  const cleanTeamName = teamName ? teamName.replace(/[^a-zA-Z0-9]/g, '') : 'default';
  const bgGradId = `bgGrad-${cleanTeamName}`;
  const spotLeftId = `spotLeft-${cleanTeamName}`;
  const spotRightId = `spotRight-${cleanTeamName}`;
  const lightRayLeftId = `lightRayLeft-${cleanTeamName}`;
  const lightRayRightId = `lightRayRight-${cleanTeamName}`;

  return (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 0,
      pointerEvents: 'none',
      backgroundColor: darkBgColor,
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
          {/* Main Background Gradient */}
          <linearGradient id={bgGradId} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={darkBgColor} />
            <stop offset="60%" stopColor={darkFloorColor} />
            <stop offset="100%" stopColor={darkBgColor} />
          </linearGradient>

          {/* Spotlight Glows */}
          <radialGradient id={spotLeftId} cx="15%" cy="15%" r="45%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.4" />
            <stop offset="30%" stopColor={themeColor} stopOpacity="0.15" />
            <stop offset="100%" stopColor="transparent" stopOpacity="0" />
          </radialGradient>
          <radialGradient id={spotRightId} cx="85%" cy="15%" r="45%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.4" />
            <stop offset="30%" stopColor={themeColor} stopOpacity="0.15" />
            <stop offset="100%" stopColor="transparent" stopOpacity="0" />
          </radialGradient>

          {/* Light Beams */}
          <linearGradient id={lightRayLeftId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.25" />
            <stop offset="30%" stopColor={themeColor} stopOpacity="0.08" />
            <stop offset="100%" stopColor="transparent" stopOpacity="0" />
          </linearGradient>
          <linearGradient id={lightRayRightId} x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.25" />
            <stop offset="30%" stopColor={themeColor} stopOpacity="0.08" />
            <stop offset="100%" stopColor="transparent" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Backdrop Rect */}
        <rect width="800" height="1000" fill={`url(#${bgGradId})`} />

        {/* Faint Rotated Shuttlecock Silhouettes (Subtle Badminton References) */}
        <path 
          d="M 50 15 L 75 5 C 78 8, 76 15, 71 18 C 66 15, 64 8, 65 8 M 71 18 C 69 18, 67 20, 67 21 C 67 22, 69 23, 71 23 C 73 23, 75 22, 75 21 C 75 20, 73 18, 71 18"
          fill="none" 
          stroke={themeColor} 
          strokeWidth="1.5" 
          opacity="0.06"
          transform="translate(100, 250) scale(4.5) rotate(-35)" 
        />
        <path 
          d="M 50 15 L 75 5 C 78 8, 76 15, 71 18 C 66 15, 64 8, 65 8 M 71 18 C 69 18, 67 20, 67 21 C 67 22, 69 23, 71 23 C 73 23, 75 22, 75 21 C 75 20, 73 18, 71 18"
          fill="none" 
          stroke={secondaryColor} 
          strokeWidth="1.5" 
          opacity="0.04"
          transform="translate(580, 650) scale(5) rotate(45)" 
        />

        {/* Glowing Spotlights */}
        <rect width="800" height="1000" fill={`url(#${spotLeftId})`} />
        <rect width="800" height="1000" fill={`url(#${spotRightId})`} />

        {/* Floodlight Beams (Angled Rays) */}
        <polygon points="120,50 800,800 800,1000 120,100" fill={`url(#${lightRayLeftId})`} />
        <polygon points="680,50 0,800 0,1000 680,100" fill={`url(#${lightRayRightId})`} />

        {/* Abstract Energy Streaks */}
        <path 
          d="M -50 300 Q 200 450, 400 350 T 850 450" 
          fill="none" 
          stroke={themeColor} 
          strokeWidth="4" 
          opacity="0.12" 
        />
        <path 
          d="M -50 320 Q 200 470, 400 370 T 850 470" 
          fill="none" 
          stroke={secondaryColor} 
          strokeWidth="2" 
          opacity="0.08" 
        />
        
        <path 
          d="M 850 700 Q 600 550, 400 650 T -50 550" 
          fill="none" 
          stroke={accentColor} 
          strokeWidth="3" 
          opacity="0.09" 
        />
        
        {/* Smoke Clouds */}
        <g fill={themeColor} opacity="0.1">
          <circle cx="150" cy="350" r="45" filter="blur(25px)" />
          <circle cx="650" cy="550" r="60" filter="blur(30px)" fill={secondaryColor} />
          <circle cx="300" cy="750" r="50" filter="blur(20px)" fill={accentColor} />
        </g>
        
        {/* Floating Sparks */}
        <g fill="#ffffff" opacity="0.25">
          <circle cx="120" cy="280" r="1.5" />
          <circle cx="280" cy="420" r="1" />
          <circle cx="190" cy="580" r="2" />
          <circle cx="680" cy="380" r="1.5" />
          <circle cx="620" cy="620" r="1" />
          <circle cx="510" cy="740" r="2" />
          <circle cx="340" cy="880" r="1.5" />
        </g>
      </svg>
    </div>
  );
};

// 3D Hexagonal Badge indicating Skill Level
const HexagonBadge = ({ skill, color }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100px', flexShrink: 0 }}>
      {/* 5 Stars */}
      <div style={{ color: color, fontSize: '0.55rem', letterSpacing: '2px', marginBottom: '3px' }}>★★★★★</div>
      
      {/* Hexagon SVG */}
      <svg width="55" height="60" viewBox="0 0 100 110" style={{ filter: `drop-shadow(0 0 6px ${color}44)` }}>
        <polygon 
          points="50,5 95,30 95,80 50,105 5,80 5,30" 
          fill="rgba(5, 8, 12, 0.9)" 
          stroke={color} 
          strokeWidth="4" 
        />
        <polygon 
          points="50,12 88,34 88,76 50,98 12,76 12,34" 
          fill="none" 
          stroke={`${color}55`} 
          strokeWidth="1.5" 
        />
        
        {/* Distinct icon for each tier */}
        {skill.toLowerCase() === 'advanced' && (
          <path 
            d="M 32,70 L 35,46 L 47,56 L 60,38 L 73,56 L 85,46 L 88,70 Z" 
            fill={color} 
          />
        )}
        {skill.toLowerCase() === 'intermediate' && (
          <polygon 
            points="50,30 54,43 68,43 57,51 61,64 50,55 39,64 43,51 32,43 46,43" 
            fill={color} 
          />
        )}
        {skill.toLowerCase() === 'beginner' && (
          <path 
            d="M 40,70 L 60,70 L 50,45 Z" 
            fill={color} 
          />
        )}
      </svg>
      
      {/* Title */}
      <span style={{ 
        color: color, 
        fontSize: '0.7rem', 
        fontWeight: '900', 
        textTransform: 'uppercase', 
        letterSpacing: '1px',
        marginTop: '5px'
      }}>
        {skill}
      </span>
    </div>
  );
};

// Reusable stat card for bottom section
const StatCard = ({ icon, label, value, color }) => {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      background: 'rgba(5, 10, 18, 0.75)',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(255,255,255,0.06)',
      borderBottom: `3px solid ${color}`,
      borderRadius: '8px',
      padding: '12px 16px',
      boxShadow: '0 8px 20px rgba(0,0,0,0.4)',
      flex: 1
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '40px',
        height: '40px',
        borderRadius: '6px',
        background: `${color}15`,
        color: color
      }}>
        {icon}
      </div>
      <div>
        <div style={{ 
          fontSize: '0.62rem', 
          fontWeight: '800', 
          color: 'rgba(255,255,255,0.45)', 
          textTransform: 'uppercase', 
          letterSpacing: '0.8px' 
        }}>
          {label}
        </div>
        <div style={{ 
          fontSize: '1.25rem', 
          fontWeight: '900', 
          color: 'white', 
          fontFamily: "'Montserrat', sans-serif",
          marginTop: '2px'
        }}>
          {value}
        </div>
      </div>
    </div>
  );
};

const RosterPoster = forwardRef(({ team }, ref) => {
  if (!team) return null;

  const themeColor = team.themeColor || '#1d4ed8'; // default primary color
  const hsl = hexToHsl(themeColor);

  // Compute dynamic colors matching the team theme
  const secondaryColor = hslToHex((hsl.h + 140) % 360, Math.max(hsl.s, 85), Math.max(hsl.l, 50));
  const accentColor = hslToHex((hsl.h + 220) % 360, Math.max(hsl.s, 90), Math.max(hsl.l, 55));
  const glowColor = hslToHex(hsl.h, Math.max(hsl.s, 85), Math.max(hsl.l, 60));

  // Sort players by skill level (Advanced -> Intermediate -> Beginner)
  const sortedPlayers = useMemo(() => {
    const skillOrder = { advanced: 1, intermediate: 2, beginner: 3 };
    return [...(team.players || [])].sort((a, b) => {
      const orderA = skillOrder[a.skillLevel?.toLowerCase()] || 99;
      const orderB = skillOrder[b.skillLevel?.toLowerCase()] || 99;
      return orderA - orderB;
    });
  }, [team.players]);

  // Stack/Split Team Name Typography dynamically
  const splitTeamName = (name) => {
    if (!name) return '';
    const parts = name.split(' ');
    if (parts.length > 1) {
      return (
        <>
          <span style={{ color: themeColor }}>{parts[0]}</span>
          <br />
          <span style={{ color: '#ffffff' }}>{parts.slice(1).join(' ')}</span>
        </>
      );
    }
    return <span style={{ color: themeColor }}>{name}</span>;
  };

  // Tabular Roster Table component to display player list with Wissen ID, Full Name, Gender, and Skill Category
  const RosterTable = ({ players }) => {
    return (
      <div style={{
        width: '100%',
        background: 'rgba(5, 10, 18, 0.65)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255, 255, 255, 0.05)',
        borderLeft: `5px solid ${themeColor}`,
        borderRadius: '8px',
        padding: '16px 20px',
        boxShadow: '0 8px 30px rgba(0,0,0,0.4)',
        boxSizing: 'border-box',
        marginBottom: '24px',
        minHeight: '430px',
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
              <th style={{ padding: '10px 8px', color: themeColor, fontSize: '0.85rem', fontWeight: '900', letterSpacing: '1px', textTransform: 'uppercase' }}>S.No</th>
              <th style={{ padding: '10px 8px', color: themeColor, fontSize: '0.85rem', fontWeight: '900', letterSpacing: '1px', textTransform: 'uppercase' }}>Wissen ID</th>
              <th style={{ padding: '10px 8px', color: themeColor, fontSize: '0.85rem', fontWeight: '900', letterSpacing: '1px', textTransform: 'uppercase' }}>Full Name</th>
              <th style={{ padding: '10px 8px', color: themeColor, fontSize: '0.85rem', fontWeight: '900', letterSpacing: '1px', textTransform: 'uppercase' }}>Gender</th>
              <th style={{ padding: '10px 8px', color: themeColor, fontSize: '0.85rem', fontWeight: '900', letterSpacing: '1px', textTransform: 'uppercase' }}>Skill Category</th>
            </tr>
          </thead>
          <tbody>
            {players.map((p, idx) => {
              let skillColor = accentColor;
              if (p.skillLevel?.toLowerCase() === 'advanced') skillColor = themeColor;
              else if (p.skillLevel?.toLowerCase() === 'intermediate') skillColor = secondaryColor;

              return (
                <tr key={p.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)', backgroundColor: idx % 2 === 0 ? 'rgba(255, 255, 255, 0.01)' : 'transparent' }}>
                  <td style={{ padding: '10px 8px', fontSize: '0.9rem', fontWeight: '700', color: 'rgba(255,255,255,0.6)' }}>
                    {String(idx + 1).padStart(2, '0')}
                  </td>
                  <td style={{ padding: '10px 8px', fontSize: '0.9rem', fontWeight: '700', color: 'white' }}>
                    {p.wissenId}
                  </td>
                  <td style={{ padding: '10px 8px', fontSize: '0.95rem', fontWeight: '800', color: 'white', textTransform: 'uppercase' }}>
                    {p.fullName}
                  </td>
                  <td style={{ padding: '10px 8px', fontSize: '0.9rem', color: 'rgba(255,255,255,0.8)' }}>
                    {p.gender}
                  </td>
                  <td style={{ padding: '10px 8px' }}>
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

  return (
    <div 
      ref={ref}
      style={{
        width: '800px',
        height: '1000px',
        backgroundColor: '#020406',
        color: 'white',
        fontFamily: "'Montserrat', 'Inter', sans-serif",
        padding: '45px 45px 35px 45px',
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
      <CourtBackground themeColor={themeColor} teamName={team.teamName} />

      {/* Top Header Section */}
      <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', width: '100%' }}>
        <div style={{ display: 'flex', width: '100%', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          {/* Logo and Stacked Text */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <TeamLogo teamName={team.teamName} themeColor={themeColor} size={120} />
            <div>
              <h1 style={{ 
                fontFamily: "'Montserrat', 'Arial Black', sans-serif", 
                fontSize: '3.2rem', 
                fontWeight: 900,
                textTransform: 'uppercase',
                color: 'white',
                lineHeight: 1.05,
                letterSpacing: '1px',
                textShadow: `0 0 15px ${glowColor}44, 3px 3px 0px rgba(0,0,0,0.85)`
              }}>
                {splitTeamName(team.teamName)}
              </h1>
              <p style={{ 
                fontSize: '0.85rem', 
                fontWeight: 800, 
                color: secondaryColor, 
                letterSpacing: '5px', 
                textTransform: 'uppercase',
                margin: '6px 0 0 0',
                fontFamily: "'Montserrat', sans-serif"
              }}>
                Badminton Team
              </p>
            </div>
          </div>

          {/* Flying Shuttlecock Speed graphic */}
          <div style={{ display: 'flex', alignItems: 'center', marginRight: '10px' }}>
            <ShuttlecockSpeedIcon color={themeColor} size={80} />
          </div>
        </div>

        {/* Slanted Owner Banner */}
        <div style={{ display: 'flex', gap: '4px', marginBottom: '30px', transform: 'skewX(-12deg)', alignSelf: 'center' }}>
          <div style={{ 
            backgroundColor: themeColor, 
            padding: '8px 24px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            boxShadow: '0 4px 10px rgba(0,0,0,0.4)'
          }}>
            <span style={{ 
              transform: 'skewX(12deg)', 
              color: '#000', 
              fontWeight: '900', 
              fontSize: '0.85rem', 
              letterSpacing: '1px' 
            }}>
              TEAM OWNER
            </span>
          </div>
          <div style={{ 
            backgroundColor: 'rgba(5, 10, 18, 0.75)', 
            border: `1.5px solid ${themeColor}`,
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
              letterSpacing: '1.5px' 
            }}>
              {(team.ownerName || 'UNREGISTERED').toUpperCase()}
            </span>
          </div>
        </div>

        {/* Roster Players Tabular Grid */}
        <div style={{ width: '100%', margin: '0 auto' }}>
          <RosterTable 
            players={sortedPlayers} 
          />
        </div>
      </div>

      {/* Bottom Summary Section */}
      <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', width: '100%' }}>
        {/* Stat Cards Row */}
        <div style={{ 
          display: 'flex', 
          width: '100%', 
          gap: '12px'
        }}>
          <StatCard 
            icon={<UsersIcon size={20} />} 
            label="Total Players" 
            value={team.totalPlayers || 0} 
            color={themeColor} 
          />
          <StatCard 
            icon={<FemaleIcon size={18} />} 
            label="Females" 
            value={team.femalePlayers || 0} 
            color={secondaryColor} 
          />
          <StatCard 
            icon={<ShuttlecockMiniIcon size={18} />} 
            label="Beginners" 
            value={team.beginnerPlayers || 0} 
            color={accentColor} 
          />
          <StatCard 
            icon={<WalletIcon size={18} />} 
            label="Purse Left" 
            value={`₹ ${(team.purseRemaining || 0).toLocaleString()}`} 
            color={secondaryColor} 
          />
        </div>

        {/* Bottom Sporty Slogan */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '20px', gap: '4px' }}>
          <div style={{ 
            fontFamily: "'Montserrat', sans-serif", 
            fontSize: '1.1rem', 
            fontWeight: '900', 
            fontStyle: 'italic', 
            letterSpacing: '3px', 
            color: themeColor,
            textTransform: 'uppercase',
            textShadow: '0 2px 4px rgba(0,0,0,0.6)'
          }}>
            One Team, One Dream!
          </div>
          <div style={{ color: secondaryColor, fontSize: '0.65rem', letterSpacing: '5px', opacity: 0.8 }}>★ ★ ★</div>
        </div>
      </div>
    </div>
  );
});

RosterPoster.displayName = 'RosterPoster';

export default RosterPoster;

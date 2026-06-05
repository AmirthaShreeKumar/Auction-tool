import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import { Sparkles, Trophy, Map } from 'lucide-react';

const LandingPage = () => {
  const navigate = useNavigate();
  const { selectCity } = useContext(AppContext);

  const cities = [
    {
      name: 'Bangalore',
      key: 'bangalore',
      code: 'BLR',
      accent: '#00f0ff', // Cyan
      stadium: 'Kanteerava Indoor Stadium',
      desc: 'Silicon Valley Smashers Hub'
    },
    {
      name: 'Mumbai',
      key: 'mumbai',
      code: 'BOM',
      accent: '#d4fc34', // Neon Green
      stadium: 'D.Y. Patil Badminton Arena',
      desc: 'City of Dreams Badminton Hub'
    },
    {
      name: 'Pune',
      key: 'pune',
      code: 'PNQ',
      accent: '#8b5cf6', // Purple
      stadium: 'Shiv Chhatrapati Sports Complex',
      desc: 'Cultural Capital Court Kings'
    }
  ];

  const handleCitySelect = (cityKey) => {
    selectCity(cityKey);
    navigate(`/role/${cityKey}`);
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '40px 20px',
      position: 'relative'
    }}>
      {/* Decorative Shuttlecock SVG Background Element */}
      <div style={{
        position: 'absolute',
        top: '10%',
        opacity: 0.03,
        pointerEvents: 'none',
        zIndex: 0
      }}>
        <svg width="400" height="400" viewBox="0 0 100 100" fill="currentColor">
          <path d="M50,5 C40,25 35,45 35,70 C35,78 40,80 50,80 C60,80 65,78 65,70 C65,45 60,25 50,5 Z" />
          <line x1="35" y1="50" x2="65" y2="50" stroke="currentColor" strokeWidth="2" />
          <line x1="35" y1="65" x2="65" y2="65" stroke="currentColor" strokeWidth="2" />
        </svg>
      </div>

      <div style={{ maxWidth: '800px', width: '100%', textAlign: 'center', zIndex: 1 }}>
        {/* Brand Logo Placeholder */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, rgba(212, 252, 52, 0.2) 0%, rgba(0, 240, 255, 0.2) 100%)',
          border: '2px solid var(--color-primary)',
          width: '80px',
          height: '80px',
          borderRadius: '24px',
          marginBottom: '24px',
          boxShadow: '0 0 30px rgba(212, 252, 52, 0.15)',
          animation: 'pulseGlow 3s infinite'
        }}>
          <Trophy size={40} style={{ color: 'var(--color-primary)' }} />
        </div>

        <h1 style={{
          fontSize: '3rem',
          fontWeight: '900',
          lineHeight: '1.1',
          marginBottom: '16px',
          background: 'linear-gradient(to right, #fff, #9ca3af)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          Wissen Badminton Premier League
        </h1>
        
        <h2 style={{
          fontSize: '1.4rem',
          fontWeight: '600',
          color: 'var(--color-primary)',
          marginBottom: '12px',
          fontFamily: 'var(--font-display)'
        }}>
          AUCTION SYSTEM PORTAL
        </h2>

        <p style={{
          color: 'var(--color-text-muted)',
          fontSize: '1.05rem',
          maxWidth: '560px',
          margin: '0 auto 48px auto',
          lineHeight: '1.6'
        }}>
          Welcome to the official frontend dashboard for managing and viewing player bids, team balances, roster rules, and real-time statistics.
        </p>

        {/* City Selection Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          marginBottom: '24px'
        }}>
          <Map size={18} style={{ color: 'var(--color-primary)' }} />
          <h3 style={{
            fontFamily: 'var(--font-display)',
            textTransform: 'uppercase',
            fontSize: '0.9rem',
            letterSpacing: '0.15em',
            color: 'white'
          }}>
            Select League Location to Proceed
          </h3>
        </div>

        {/* City Cards Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
          gap: '24px',
          marginTop: '12px'
        }}>
          {cities.map((cityObj) => (
            <div
              key={cityObj.key}
              onClick={() => handleCitySelect(cityObj.key)}
              className="glass-panel"
              style={{
                padding: '32px 24px',
                cursor: 'pointer',
                textAlign: 'left',
                display: 'flex',
                flexDirection: 'column',
                height: '240px',
                justifyContent: 'space-between',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              {/* Glow Accent Corner */}
              <div style={{
                position: 'absolute',
                top: '-30px',
                right: '-30px',
                width: '100px',
                height: '100px',
                background: cityObj.accent,
                filter: 'blur(45px)',
                opacity: '0.2',
                borderRadius: '50%'
              }} />

              <div>
                <span style={{
                  fontSize: '0.8rem',
                  fontWeight: '700',
                  color: cityObj.accent,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em'
                }}>
                  {cityObj.code}
                </span>
                
                <h4 style={{
                  fontSize: '1.8rem',
                  fontWeight: '800',
                  color: 'white',
                  marginTop: '8px',
                  marginBottom: '8px'
                }}>
                  {cityObj.name}
                </h4>
                
                <p style={{
                  color: 'var(--color-text-muted)',
                  fontSize: '0.85rem',
                  lineHeight: '1.4'
                }}>
                  {cityObj.desc}
                </p>
              </div>

              <div style={{
                fontSize: '0.75rem',
                color: 'rgba(255, 255, 255, 0.4)',
                borderTop: '1px solid var(--border-color)',
                paddingTop: '12px',
                marginTop: '12px'
              }}>
                Arena: {cityObj.stadium}
              </div>
            </div>
          ))}
        </div>
      </div>

      <footer style={{
        marginTop: '60px',
        fontSize: '0.8rem',
        color: 'var(--color-text-muted)',
        zIndex: 1
      }}>
        Wissen Technology &copy; {new Date().getFullYear()} &bull; Private League Sandbox
      </footer>
    </div>
  );
};

export default LandingPage;

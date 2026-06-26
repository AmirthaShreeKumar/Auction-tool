import React, { useContext } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import { ShieldCheck, UserCheck, ChevronLeft, MapPin } from 'lucide-react';

const RoleSelection = () => {
  const navigate = useNavigate();
  const { city } = useParams();
  const { selectRole, selectCity } = useContext(AppContext);

  const handleRoleSelect = async (role) => {
    selectRole(role);
    if (role === 'admin') {
      navigate(`/login/${city}`);
    } else {
      // Fetch data before navigating so dashboard loads with real data
      await selectCity(city, role);
      navigate(`/dashboard/${city}/guest`);
    }
  };

  const handleBack = () => {
    navigate('/');
  };

  const capitalize = (str) => {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
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
      {/* Back button */}
      <button 
        onClick={handleBack} 
        className="btn btn-secondary"
        style={{
          position: 'absolute',
          top: '40px',
          left: '40px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}
      >
        <ChevronLeft size={16} />
        Back to Cities
      </button>

      <div style={{ maxWidth: '600px', width: '100%', textAlign: 'center' }}>
        {/* City Indicator Badge */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          background: 'rgba(255, 255, 255, 0.04)',
          border: '1px solid var(--border-color)',
          padding: '8px 16px',
          borderRadius: '9999px',
          marginBottom: '20px'
        }}>
          <MapPin size={16} style={{ color: 'var(--color-primary)' }} />
          <span style={{ fontWeight: '600', color: 'white', letterSpacing: '0.05em' }}>
            SELECTED CITY: <span style={{ color: 'var(--color-primary)' }}>{capitalize(city)}</span>
          </span>
        </div>

        <h2 style={{
          fontSize: '2.5rem',
          fontWeight: '800',
          color: 'white',
          marginBottom: '10px'
        }}>
          Choose Your Access Role
        </h2>
        
        <p style={{
          color: 'var(--color-text-muted)',
          fontSize: '1rem',
          marginBottom: '40px'
        }}>
          Please select your authorization level to access the {capitalize(city)} auction board.
        </p>

        {/* Roles Cards Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '24px'
        }}>
          {/* Admin Card */}
          <div
            onClick={() => handleRoleSelect('admin')}
            className="glass-panel"
            style={{
              padding: '40px 24px',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              border: '1px solid var(--border-color)'
            }}
          >
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'rgba(212, 252, 52, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '20px',
              border: '1px solid rgba(212, 252, 52, 0.2)'
            }}>
              <ShieldCheck size={32} style={{ color: 'var(--color-primary)' }} />
            </div>

            <h3 style={{ fontSize: '1.4rem', color: 'white', marginBottom: '8px' }}>
              Administrator
            </h3>
            
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', lineHeight: '1.5', minHeight: '60px' }}>
              Requires authentication. Full write permissions to bid, register teams, and modify players.
            </p>

            <span 
              className="btn btn-primary" 
              style={{ 
                marginTop: '20px', 
                fontSize: '0.8rem', 
                padding: '8px 16px',
                width: '100%' 
              }}
            >
              Sign In
            </span>
          </div>

          {/* Guest Card */}
          <div
            onClick={() => handleRoleSelect('guest')}
            className="glass-panel"
            style={{
              padding: '40px 24px',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              border: '1px solid var(--border-color)'
            }}
          >
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'rgba(0, 240, 255, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '20px',
              border: '1px solid rgba(0, 240, 255, 0.2)'
            }}>
              <UserCheck size={32} style={{ color: 'var(--color-secondary)' }} />
            </div>

            <h3 style={{ fontSize: '1.4rem', color: 'white', marginBottom: '8px' }}>
              Guest Access
            </h3>
            
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', lineHeight: '1.5', minHeight: '60px' }}>
              Public read-only board. Monitor team list, statistics, and live player bid statuses.
            </p>

            <span 
              className="btn btn-secondary" 
              style={{ 
                marginTop: '20px', 
                fontSize: '0.8rem', 
                padding: '8px 16px',
                width: '100%',
                background: 'rgba(0, 240, 255, 0.1)',
                border: '1px solid rgba(0, 240, 255, 0.3)',
                color: 'var(--color-secondary)'
              }}
            >
              Enter Board
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoleSelection;

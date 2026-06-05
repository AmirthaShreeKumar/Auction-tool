import React, { useState, useContext } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import { Lock, User, ChevronLeft, AlertCircle } from 'lucide-react';

const AdminLogin = () => {
  const navigate = useNavigate();
  const { city } = useParams();
  const { selectRole } = useContext(AppContext);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Mock authentication check
    setTimeout(() => {
      if (username.trim().toLowerCase() === 'admin' && password === 'admin123') {
        selectRole('admin');
        navigate(`/dashboard/${city}/admin`);
      } else {
        setError('Invalid username or password. (Hint: admin / admin123)');
        setLoading(false);
      }
    }, 600);
  };

  const handleBack = () => {
    navigate(`/role/${city}`);
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
        Back
      </button>

      <div style={{ maxWidth: '400px', width: '100%' }}>
        <div className="glass-panel" style={{ padding: '40px 30px', border: '1px solid var(--border-color)' }}>
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              background: 'rgba(212, 252, 52, 0.1)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px',
              border: '1px solid rgba(212, 252, 52, 0.2)',
              color: 'var(--color-primary)'
            }}>
              <Lock size={24} />
            </div>
            
            <h2 style={{ fontSize: '1.8rem', color: 'white', marginBottom: '6px' }}>
              Admin Sign In
            </h2>
            
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
              Access {capitalize(city)} Auction Admin Console
            </p>
          </div>

          {error && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#f87171',
              padding: '12px 16px',
              borderRadius: '8px',
              marginBottom: '20px',
              fontSize: '0.85rem'
            }}>
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin}>
            <div className="form-group" style={{ position: 'relative' }}>
              <label className="form-label">Username</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)', display: 'flex' }}>
                  <User size={18} />
                </span>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Enter admin username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  style={{ paddingLeft: '44px' }}
                  required
                />
              </div>
            </div>

            <div className="form-group" style={{ position: 'relative' }}>
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)', display: 'flex' }}>
                  <Lock size={18} />
                </span>
                <input 
                  type="password" 
                  className="form-input" 
                  placeholder="Enter admin password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ paddingLeft: '44px' }}
                  required
                />
              </div>
            </div>

            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ width: '100%', padding: '12px', marginTop: '10px' }}
              disabled={loading}
            >
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>

          {/* Hint section */}
          <div style={{
            marginTop: '24px',
            padding: '12px 16px',
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            fontSize: '0.8rem',
            color: 'var(--color-text-muted)',
            textAlign: 'center'
          }}>
            <span style={{ fontWeight: '600', color: 'var(--color-primary)' }}>Sandbox Credentials:</span>
            <div style={{ marginTop: '4px' }}>
              Username: <code style={{ color: 'white', padding: '2px 4px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px' }}>admin</code>
            </div>
            <div style={{ marginTop: '2px' }}>
              Password: <code style={{ color: 'white', padding: '2px 4px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px' }}>admin123</code>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;

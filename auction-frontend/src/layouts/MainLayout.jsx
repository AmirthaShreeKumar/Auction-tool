import React, { useContext, useEffect } from 'react';
import { Outlet, useParams, useNavigate, NavLink } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import {
  LayoutDashboard,
  Users,
  Trophy,
  Gavel,
  BarChart3,
  LogOut,
  MapPin,
  ShieldAlert,
  RotateCcw,
  Sparkles,
  BookOpen
} from 'lucide-react';

const MainLayout = () => {
  const { city: urlCity, role: urlRole } = useParams();
  const navigate = useNavigate();
  const {
    city,
    role,
    selectCity,
    selectRole,
    logout
  } = useContext(AppContext);

  // Sync route parameters with AppContext
  useEffect(() => {
    if (urlCity && urlCity !== city) {
      selectCity(urlCity);
    }
    if (urlRole && urlRole !== role) {
      selectRole(urlRole);
    }
  }, [urlCity, urlRole, city, role, selectCity, selectRole]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };


  // Capitalize strings
  const formatText = (txt) => {
    if (!txt) return '';
    return txt.charAt(0).toUpperCase() + txt.slice(1);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Top Banner Header */}
      <header className="header-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            background: 'var(--color-primary)',
            color: '#000',
            padding: '8px 12px',
            borderRadius: '8px',
            fontWeight: '800',
            fontFamily: 'var(--font-display)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.9rem'
          }}>
            <Sparkles size={16} />
            WBPL
          </div>
          <div>
            <h1 style={{ fontSize: '1.2rem', fontWeight: '800', color: 'white', margin: 0, lineHeight: 1.1 }}>
              Wissen Badminton Premier League
            </h1>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Auction Management System
            </span>
          </div>
        </div>

        {/* User context and utility actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(255, 255, 255, 0.05)',
              padding: '6px 12px',
              borderRadius: '6px',
              border: '1px solid var(--border-color)',
              fontSize: '0.85rem'
            }}>
              <MapPin size={14} style={{ color: 'var(--color-secondary)' }} />
              <span style={{ fontWeight: '600' }}>{formatText(urlCity)}</span>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: urlRole === 'admin' ? 'rgba(212, 252, 52, 0.1)' : 'rgba(0, 240, 255, 0.1)',
              padding: '6px 12px',
              borderRadius: '6px',
              border: urlRole === 'admin' ? '1px solid rgba(212, 252, 52, 0.2)' : '1px solid rgba(0, 240, 255, 0.2)',
              fontSize: '0.85rem',
              color: urlRole === 'admin' ? 'var(--color-primary)' : 'var(--color-secondary)'
            }}>
              <ShieldAlert size={14} />
              <span style={{ fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {urlRole === 'admin' ? 'Admin' : 'Guest'}
              </span>
            </div>
          </div>


          <button onClick={handleLogout} className="btn btn-danger" style={{ padding: '6px 10px', fontSize: '0.8rem', display: 'flex', gap: '4px' }}>
            <LogOut size={13} />
            Exit
          </button>
        </div>
      </header>

      {/* Main Layout Body */}
      <div className="app-container">
        {/* Navigation Sidebar */}
        <aside className="sidebar">
          <div className="sidebar-title">Menu Navigation</div>
          <nav className="nav-menu">
            <NavLink
              to={`/dashboard/${urlCity}/${urlRole}`}
              end
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <LayoutDashboard size={18} />
              Overview
            </NavLink>

            <NavLink
              to={`/dashboard/${urlCity}/${urlRole}/players`}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <Users size={18} />
              Players Roster
            </NavLink>

            <NavLink
              to={`/dashboard/${urlCity}/${urlRole}/teams`}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <Trophy size={18} />
              Teams List
            </NavLink>

            {urlRole === 'admin' && (
              <NavLink
                to={`/dashboard/${urlCity}/${urlRole}/auction`}
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              >
                <Gavel size={18} />
                Live Auction
              </NavLink>
            )}

            <NavLink
              to={`/dashboard/${urlCity}/${urlRole}/statistics`}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <BarChart3 size={18} />
              Statistics
            </NavLink>
            <NavLink
              to={`/dashboard/${urlCity}/${urlRole}/rules`}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <BookOpen size={18} />
              Bidding Rules
            </NavLink>
          </nav>
        </aside>

        {/* Nested Content Outlet */}
        <main className="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;

import React, { useContext } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import { 
  Users, 
  Trophy, 
  Gavel, 
  PieChart, 
  ShieldCheck, 
  Info,
  DollarSign,
  PlusCircle,
  HelpCircle
} from 'lucide-react';

const Dashboard = () => {
  const { city, role } = useParams();
  const navigate = useNavigate();
  const { 
    players, 
    teams, 
    businessRules,
    activePlayer,
    auctionQueue
  } = useContext(AppContext);

  // Capitalize helpers
  const capitalize = (str) => {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  // Filter lists by selected city
  const cityPlayers = players.filter(p => p.location.toLowerCase() === city.toLowerCase());
  const cityTeams = teams.filter(t => t.location.toLowerCase() === city.toLowerCase());

  // Calculations
  const totalPlayers = cityPlayers.length;
  const totalTeams = cityTeams.length;
  const soldPlayersCount = cityPlayers.filter(p => p.status === 'SOLD').length;
  const unsoldPlayersCount = cityPlayers.filter(p => p.status === 'UNSOLD').length;
  const passedPlayersCount = cityPlayers.filter(p => p.status === 'PASSED').length;

  const totalPurseAllocated = totalTeams * businessRules.purseLimit;
  const totalPurseRemaining = cityTeams.reduce((sum, t) => sum + t.purseRemaining, 0);
  const totalPurseSpent = totalPurseAllocated - totalPurseRemaining;
  const purseUtilizationPercentage = totalPurseAllocated > 0 
    ? Math.round((totalPurseSpent / totalPurseAllocated) * 100) 
    : 0;

  // Determine Auction Status Text
  let auctionStatusText = "Not Started";
  let auctionStatusColor = "var(--color-text-muted)";

  if (soldPlayersCount > 0 && unsoldPlayersCount > 0) {
    auctionStatusText = "In Progress";
    auctionStatusColor = "var(--color-warning)";
  } else if (soldPlayersCount > 0 && unsoldPlayersCount === 0) {
    auctionStatusText = "Completed";
    auctionStatusColor = "var(--color-success)";
  } else if (unsoldPlayersCount > 0 && soldPlayersCount === 0) {
    auctionStatusText = "Ready to Start";
    auctionStatusColor = "var(--color-secondary)";
  }

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h2 className="page-title">{capitalize(city)} Dashboard Overview</h2>
          <p className="page-subtitle">Welcome to the Wissen Badminton Premier League portal for {capitalize(city)} location.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          {role === 'admin' && (
            <Link to={`/dashboard/${city}/${role}/auction`} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Gavel size={16} />
              Go to Auction Board
            </Link>
          )}
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="kpi-grid">
        {/* Card 1: Total Teams */}
        <div className="glass-panel kpi-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span className="kpi-title">Total Teams</span>
            <Trophy size={20} style={{ color: 'var(--color-secondary)' }} />
          </div>
          <span className="kpi-value">{totalTeams}</span>
          <span className="kpi-trend" style={{ color: 'var(--color-text-muted)' }}>
            Registered Franchises
          </span>
        </div>

        {/* Card 2: Total Players */}
        <div className="glass-panel kpi-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span className="kpi-title">Total Players</span>
            <Users size={20} style={{ color: 'var(--color-accent)' }} />
          </div>
          <span className="kpi-value">{totalPlayers}</span>
          <span className="kpi-trend" style={{ color: 'var(--color-text-muted)' }}>
            Registered Draft Pool
          </span>
        </div>

        {/* Card 3: Auction Progress */}
        <div className="glass-panel kpi-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span className="kpi-title">Sold / Unsold</span>
            <PieChart size={20} style={{ color: 'var(--color-success)' }} />
          </div>
          <span className="kpi-value">{soldPlayersCount} <span style={{ fontSize: '1.2rem', color: 'var(--color-text-muted)', fontWeight: 'normal' }}>/ {totalPlayers}</span></span>
          <span className="kpi-trend" style={{ color: 'var(--color-success)' }}>
            {unsoldPlayersCount} remaining, {passedPlayersCount} passed
          </span>
        </div>

        {/* Card 4: Current Status */}
        <div className="glass-panel kpi-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span className="kpi-title">Auction Status</span>
            <Gavel size={20} style={{ color: auctionStatusColor }} />
          </div>
          <span className="kpi-value" style={{ color: auctionStatusColor, fontSize: '1.8rem', marginTop: '4px' }}>
            {auctionStatusText}
          </span>
          <span className="kpi-trend" style={{ color: 'var(--color-text-muted)' }}>
            {activePlayer ? `Next up: ${activePlayer.fullName}` : 'No active player'}
          </span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '30px', marginTop: '10px' }}>
        
        {/* Left Side: Purse Utilization & Live Summary */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          
          {/* Purse Utilization */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1.1rem', color: 'white', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <DollarSign size={18} style={{ color: 'var(--color-primary)' }} />
              Purse Spent Utilization
            </h3>
            
            <div style={{ marginBottom: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '6px' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>Total Purse Pool</span>
                <span style={{ fontWeight: '700', color: 'white' }}>{totalPurseAllocated.toLocaleString()} pts</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '16px' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>Purse Spent</span>
                <span style={{ fontWeight: '700', color: 'var(--color-primary)' }}>{totalPurseSpent.toLocaleString()} pts ({purseUtilizationPercentage}%)</span>
              </div>
            </div>

            {/* Custom Progress Bar */}
            <div style={{ 
              width: '100%', 
              height: '12px', 
              background: 'rgba(255, 255, 255, 0.05)', 
              borderRadius: '9999px',
              overflow: 'hidden',
              border: '1px solid var(--border-color)',
              marginBottom: '20px'
            }}>
              <div style={{ 
                width: `${purseUtilizationPercentage}%`, 
                height: '100%', 
                background: 'linear-gradient(90deg, var(--color-secondary) 0%, var(--color-primary) 100%)',
                borderRadius: '9999px',
                transition: 'width 0.4s ease-out'
              }} />
            </div>

            {/* Teams purse lists */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {cityTeams.map((team) => {
                const spent = businessRules.purseLimit - team.purseRemaining;
                const pct = Math.round((spent / businessRules.purseLimit) * 100);
                return (
                  <div key={team.teamName} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', padding: '6px 0', borderBottom: '1px dashed var(--border-color)' }}>
                    <span style={{ fontWeight: '600' }}>{team.teamName}</span>
                    <span style={{ color: 'var(--color-text-muted)' }}>
                      Spent: <span style={{ color: 'white', fontWeight: '600' }}>{spent.toLocaleString()} pts</span> ({pct}%)
                    </span>
                  </div>
                );
              })}
              {cityTeams.length === 0 && (
                <div style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '10px' }}>
                  No teams registered. Go to Teams page to create one.
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions (Admin Only) */}
          {role === 'admin' && (
            <div className="glass-panel" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '1.1rem', color: 'white', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldCheck size={18} style={{ color: 'var(--color-primary)' }} />
                Administrative Controls
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '20px' }}>
                You have write permissions for this city. Use these shortcuts to speed up configuration:
              </p>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <Link to={`/dashboard/${city}/${role}/players`} className="btn btn-secondary" style={{ padding: '8px 12px', fontSize: '0.8rem', display: 'flex', gap: '4px' }}>
                  <PlusCircle size={14} />
                  Add New Player
                </Link>
                <Link to={`/dashboard/${city}/${role}/teams`} className="btn btn-secondary" style={{ padding: '8px 12px', fontSize: '0.8rem', display: 'flex', gap: '4px' }}>
                  <PlusCircle size={14} />
                  Register Team
                </Link>
              </div>
            </div>
          )}

        </div>

        {/* Right Side: Business Rules & Compliance Guide */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          
          {/* Business Rules Widget */}
          <div className="glass-panel" style={{ padding: '24px', borderLeft: '4px solid var(--color-primary)' }}>
            <h3 style={{ fontSize: '1.1rem', color: 'white', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Info size={18} style={{ color: 'var(--color-primary)' }} />
              League Compliance & Roster Rules
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '700', fontSize: '0.9rem', marginBottom: '4px' }}>
                  <span>Max Roster Size</span>
                  <span style={{ color: 'var(--color-primary)' }}>{businessRules.teamSizeLimit} Players</span>
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                  A franchise cannot purchase more than 10 players total. Roster must lock once full.
                </p>
              </div>

              <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '700', fontSize: '0.9rem', marginBottom: '4px' }}>
                  <span>Purse Cap Limit</span>
                  <span style={{ color: 'var(--color-secondary)' }}>{businessRules.purseLimit.toLocaleString()} Points</span>
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                  Total budget allowed per team. Bidding on a player exceeding this limit is disallowed.
                </p>
              </div>

              <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '700', fontSize: '0.9rem', marginBottom: '4px' }}>
                  <span>Required Key Roles</span>
                  <span style={{ color: 'var(--color-accent)' }}>Min 2 Beginner &amp; 2 Female</span>
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                  Every franchise must contain at least two players with 'Beginner' skill level and two 'Female' gender players to ensure compliance.
                </p>
              </div>

              <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '700', fontSize: '0.9rem', marginBottom: '4px' }}>
                  <span>Bidding Mechanics</span>
                  <span style={{ color: 'white' }}>+500 / +1000 Points Increment</span>
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                  Standard bid increments are +500 and +1000 points. Admins can choose the desired bid raise on behalf of teams.
                </p>
              </div>
            </div>
          </div>



        </div>

      </div>
    </div>
  );
};

export default Dashboard;

import React, { useContext, useState } from 'react';
import { useParams } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import { Trophy, Plus, ShieldAlert, CheckCircle2, AlertTriangle, Eye, X } from 'lucide-react';

const TeamsPage = () => {
  const { city, role } = useParams();
  const { teams, createTeam, businessRules } = useContext(AppContext);

  // Modal States
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  
  // Selected Team for viewing Roster Details
  const [activeRosterTeam, setActiveRosterTeam] = useState(null);

  // Filter teams by active city
  const cityTeams = teams.filter(t => t.location.toLowerCase() === city.toLowerCase());

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!teamName || !ownerName) {
      alert("Please fill in all details.");
      return;
    }

    // Check if team already exists
    if (cityTeams.some(t => t.teamName.toLowerCase() === teamName.toLowerCase())) {
      alert("A team with this name already exists in this city.");
      return;
    }

    createTeam({
      teamName,
      ownerName
    });

    // Reset and Close
    setTeamName('');
    setOwnerName('');
    setShowCreateModal(false);
  };

  const getComplianceStatus = (val, minRequired) => {
    return val >= minRequired ? 'compliance-badge compliance-ok' : 'compliance-badge compliance-warn';
  };

  const getRosterCompliance = (count, maxAllowed) => {
    if (count === maxAllowed) return 'compliance-badge compliance-ok';
    if (count > maxAllowed) return 'compliance-badge compliance-warn';
    return 'compliance-badge'; // Normal
  };

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h2 className="page-title">Franchise Teams</h2>
          <p className="page-subtitle">Rosters and purse tracking for {city.toUpperCase()} location.</p>
        </div>
        {role === 'admin' && (
          <button 
            onClick={() => setShowCreateModal(true)} 
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Plus size={16} />
            Create Team
          </button>
        )}
      </div>

      {/* Teams Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px' }}>
        {cityTeams.map((team) => {
          const isRosterFull = team.totalPlayers === businessRules.teamSizeLimit;
          const isFemaleCompliant = team.femalePlayers >= businessRules.minFemales;
          const isBeginnerCompliant = team.beginnerPlayers >= businessRules.minBeginners;

          return (
            <div key={team.teamName} className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', border: '1px solid var(--border-color)', position: 'relative' }}>
              <div>
                {/* Team header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div>
                    <h3 style={{ fontSize: '1.3rem', color: 'white', fontWeight: '800' }}>{team.teamName}</h3>
                    <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Owner: <strong style={{ color: 'white' }}>{team.ownerName}</strong></span>
                  </div>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--color-primary)'
                  }}>
                    <Trophy size={20} />
                  </div>
                </div>

                {/* Purse Remaining */}
                <div style={{ background: 'rgba(0, 240, 255, 0.03)', border: '1px solid rgba(0, 240, 255, 0.1)', padding: '12px 16px', borderRadius: '8px', marginBottom: '20px' }}>
                  <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-secondary)', fontWeight: '700', letterSpacing: '0.05em' }}>Purse Remaining</div>
                  <div style={{ fontSize: '1.6rem', fontWeight: '800', color: 'white', fontFamily: 'var(--font-display)', marginTop: '2px' }}>
                    {team.purseRemaining.toLocaleString()} <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', fontWeight: 'normal' }}>/ {businessRules.purseLimit.toLocaleString()} pts</span>
                  </div>
                </div>

                {/* Compliance Indicators */}
                <div style={{ marginBottom: '24px' }}>
                  <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-text-muted)', fontWeight: '700', letterSpacing: '0.05em', marginBottom: '10px' }}>Roster Compliance</div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {/* Players Count indicator */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                      <span style={{ color: 'var(--color-text-muted)' }}>Players Count (Max 10):</span>
                      <span className={getRosterCompliance(team.totalPlayers, businessRules.teamSizeLimit)}>
                        {team.totalPlayers === businessRules.teamSizeLimit ? (
                          <CheckCircle2 size={12} style={{ marginRight: '4px', verticalAlign: 'middle', display: 'inline' }} />
                        ) : null}
                        {team.totalPlayers} / 10
                      </span>
                    </div>

                    {/* Female Players Count */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                      <span style={{ color: 'var(--color-text-muted)' }}>Female Players (Min 2):</span>
                      <span className={getComplianceStatus(team.femalePlayers, businessRules.minFemales)}>
                        {isFemaleCompliant ? (
                          <CheckCircle2 size={12} style={{ marginRight: '4px', verticalAlign: 'middle', display: 'inline' }} />
                        ) : (
                          <AlertTriangle size={12} style={{ marginRight: '4px', verticalAlign: 'middle', display: 'inline' }} />
                        )}
                        {team.femalePlayers} / 2
                      </span>
                    </div>

                    {/* Beginner Players Count */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                      <span style={{ color: 'var(--color-text-muted)' }}>Beginner Players (Min 2):</span>
                      <span className={getComplianceStatus(team.beginnerPlayers, businessRules.minBeginners)}>
                        {isBeginnerCompliant ? (
                          <CheckCircle2 size={12} style={{ marginRight: '4px', verticalAlign: 'middle', display: 'inline' }} />
                        ) : (
                          <AlertTriangle size={12} style={{ marginRight: '4px', verticalAlign: 'middle', display: 'inline' }} />
                        )}
                        {team.beginnerPlayers} / 2
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Roster actions */}
              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px', marginTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                  Purchased: <strong style={{ color: 'white' }}>{team.totalPlayers} player{team.totalPlayers !== 1 ? 's' : ''}</strong>
                </span>
                <button 
                  onClick={() => setActiveRosterTeam(team)}
                  className="btn btn-secondary" 
                  style={{ padding: '6px 12px', fontSize: '0.75rem', display: 'flex', gap: '4px' }}
                >
                  <Eye size={12} />
                  View Roster
                </button>
              </div>
            </div>
          );
        })}
        {cityTeams.length === 0 && (
          <div className="glass-panel" style={{ gridColumn: '1 / -1', padding: '40px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
            No teams created for {city.toUpperCase()} location yet. {role === 'admin' ? 'Click "Create Team" above to register a new franchise.' : ''}
          </div>
        )}
      </div>

      {/* Team Roster details modal */}
      {activeRosterTeam && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <div>
                <h3 className="modal-title">{activeRosterTeam.teamName} Roster</h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Owner: {activeRosterTeam.ownerName} &bull; Purse Remaining: {activeRosterTeam.purseRemaining.toLocaleString()} pts</span>
              </div>
              <button className="close-btn" onClick={() => setActiveRosterTeam(null)}>&times;</button>
            </div>

            <div style={{ maxHeight: '400px', overflowY: 'auto', marginTop: '10px' }}>
              <table className="custom-table" style={{ background: 'transparent' }}>
                <thead>
                  <tr>
                    <th>Wissen ID</th>
                    <th>Name</th>
                    <th>Gender</th>
                    <th>Skill</th>
                    <th>Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {activeRosterTeam.players.map((p) => (
                    <tr key={p.id}>
                      <td style={{ fontWeight: '600' }}>{p.wissenId}</td>
                      <td>{p.fullName}</td>
                      <td>{p.gender}</td>
                      <td>{p.skillLevel}</td>
                      <td style={{ fontWeight: '600', color: 'var(--color-primary)' }}>{p.soldPrice?.toLocaleString() || p.basePrice.toLocaleString()} pts</td>
                    </tr>
                  ))}
                  {activeRosterTeam.players.length === 0 && (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', padding: '30px', color: 'var(--color-text-muted)' }}>
                        No players purchased yet during this auction.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button className="btn btn-secondary" onClick={() => setActiveRosterTeam(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Team Modal (Admin Only) */}
      {showCreateModal && role === 'admin' && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Trophy size={20} style={{ color: 'var(--color-primary)' }} />
                Register New Franchise
              </h3>
              <button className="close-btn" onClick={() => setShowCreateModal(false)}>&times;</button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Team Name *</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. Bangalore Smashers" 
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  required 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Owner Name *</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Enter owner full name" 
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  required 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Initial Purse Balance</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={`${businessRules.purseLimit.toLocaleString()} Points`} 
                  disabled 
                  style={{ background: 'rgba(255,255,255,0.02)', color: 'var(--color-text-muted)' }}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Location (City)</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={city.toUpperCase()} 
                  disabled 
                  style={{ background: 'rgba(255,255,255,0.02)', color: 'var(--color-text-muted)' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create Franchise
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamsPage;

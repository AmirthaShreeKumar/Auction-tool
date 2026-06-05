import React, { useContext, useState } from 'react';
import { useParams } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import { Plus, UserPlus, Filter, X, Search } from 'lucide-react';

const PlayersPage = () => {
  const { city, role } = useParams();
  const { players, addPlayer } = useContext(AppContext);

  // States
  const [skillFilter, setSkillFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  
  // Form States for Add Player
  const [wissenId, setWissenId] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [gender, setGender] = useState('Male');
  const [skillLevel, setSkillLevel] = useState('Beginner');
  const [yearsOfExperience, setYearsOfExperience] = useState(1);
  const [basePrice, setBasePrice] = useState(5000);

  // Filter players by City
  const cityPlayers = players.filter(p => p.location.toLowerCase() === city.toLowerCase());

  // Filter players by Skill
  const skilledPlayers = skillFilter === 'All' 
    ? cityPlayers 
    : cityPlayers.filter(p => p.skillLevel.toLowerCase() === skillFilter.toLowerCase());

  // Filter players by Search query (name or wissen ID)
  const filteredPlayers = skilledPlayers.filter(p => 
    p.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.wissenId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!wissenId || !fullName || !email) {
      alert("Please fill out all required fields.");
      return;
    }

    addPlayer({
      wissenId,
      fullName,
      email,
      gender,
      skillLevel,
      yearsOfExperience: parseInt(yearsOfExperience),
      basePrice: parseInt(basePrice),
      location: city // set location automatically
    });

    // Reset Form & Close Modal
    setWissenId('');
    setFullName('');
    setEmail('');
    setGender('Male');
    setSkillLevel('Beginner');
    setYearsOfExperience(1);
    setBasePrice(5000);
    setShowAddModal(false);
  };

  const getStatusPillClass = (status) => {
    switch (status.toLowerCase()) {
      case 'sold': return 'pill pill-sold';
      case 'passed': return 'pill pill-passed';
      default: return 'pill pill-unsold';
    }
  };

  const getSkillPillClass = (skill) => {
    switch (skill.toLowerCase()) {
      case 'beginner': return 'pill pill-skill-beginner';
      case 'intermediate': return 'pill pill-skill-intermediate';
      case 'advanced': return 'pill pill-skill-advanced';
      default: return 'pill';
    }
  };

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h2 className="page-title">Draft Players Pool</h2>
          <p className="page-subtitle">Manage and review badminton players registered in {city.toUpperCase()} draft.</p>
        </div>
        {role === 'admin' && (
          <button 
            onClick={() => setShowAddModal(true)} 
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <UserPlus size={16} />
            Add Player
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel" style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
        
        {/* Search */}
        <div style={{ position: 'relative', width: '100%', maxWidth: '300px' }}>
          <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)', display: 'flex' }}>
            <Search size={16} />
          </span>
          <input 
            type="text" 
            placeholder="Search by name or ID..." 
            className="form-input" 
            style={{ paddingLeft: '38px', paddingRight: '12px', paddingVertical: '8px', fontSize: '0.85rem' }}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Skill Filters */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: '600', textTransform: 'uppercase', marginRight: '6px' }}>
            Filter Skill:
          </span>
          {['All', 'Beginner', 'Intermediate', 'Advanced'].map((lvl) => (
            <button
              key={lvl}
              onClick={() => setSkillFilter(lvl)}
              className="btn"
              style={{
                padding: '6px 12px',
                fontSize: '0.8rem',
                borderRadius: '6px',
                background: skillFilter === lvl ? 'var(--color-primary)' : 'rgba(255, 255, 255, 0.04)',
                color: skillFilter === lvl ? '#000' : 'var(--color-text-main)',
                border: skillFilter === lvl ? 'none' : '1px solid var(--border-color)'
              }}
            >
              {lvl}
            </button>
          ))}
        </div>
      </div>

      {/* Players Table */}
      <div className="custom-table-container">
        <table className="custom-table">
          <thead>
            <tr>
              <th>Wissen ID</th>
              <th>Full Name</th>
              <th>Email</th>
              <th>Gender</th>
              <th>Skill Level</th>
              <th>Experience</th>
              <th>Base Price</th>
              <th>Status</th>
              <th>Team purchased</th>
            </tr>
          </thead>
          <tbody>
            {filteredPlayers.map((player) => (
              <tr key={player.id}>
                <td style={{ fontWeight: '600', color: 'white' }}>{player.wissenId}</td>
                <td>
                  <div style={{ fontWeight: '600' }}>{player.fullName}</div>
                </td>
                <td style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>{player.email}</td>
                <td>{player.gender}</td>
                <td>
                  <span className={getSkillPillClass(player.skillLevel)}>
                    {player.skillLevel}
                  </span>
                </td>
                <td style={{ textAlign: 'center' }}>{player.yearsOfExperience} yr{player.yearsOfExperience > 1 ? 's' : ''}</td>
                <td style={{ fontWeight: '600', color: 'var(--color-secondary)' }}>{player.basePrice.toLocaleString()} pts</td>
                <td>
                  <span className={getStatusPillClass(player.status)}>
                    {player.status}
                  </span>
                </td>
                <td>
                  {player.status === 'sold' ? (
                    <div>
                      <div style={{ fontWeight: '600', color: 'white', fontSize: '0.9rem' }}>{player.soldTeam}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-primary)' }}>@{player.soldPrice.toLocaleString()} pts</div>
                    </div>
                  ) : (
                    <span style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>&mdash;</span>
                  )}
                </td>
              </tr>
            ))}
            {filteredPlayers.length === 0 && (
              <tr>
                <td colSpan="9" style={{ textAlign: 'center', padding: '30px', color: 'var(--color-text-muted)' }}>
                  No players found matching the filter criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add Player Modal (Admin Only) */}
      {showAddModal && role === 'admin' && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '450px' }}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Plus size={20} style={{ color: 'var(--color-primary)' }} />
                Add New Player Draft
              </h3>
              <button className="close-btn" onClick={() => setShowAddModal(false)}>&times;</button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Wissen Employee ID *</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. WIS022" 
                  value={wissenId}
                  onChange={(e) => setWissenId(e.target.value)}
                  required 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Enter full name" 
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email Address *</label>
                <input 
                  type="email" 
                  className="form-input" 
                  placeholder="name@wissen.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required 
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Gender</label>
                  <select 
                    className="form-select"
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Skill Level</label>
                  <select 
                    className="form-select"
                    value={skillLevel}
                    onChange={(e) => setSkillLevel(e.target.value)}
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Experience (Years)</label>
                  <input 
                    type="number" 
                    min="0"
                    max="30"
                    className="form-input" 
                    value={yearsOfExperience}
                    onChange={(e) => setYearsOfExperience(e.target.value)}
                    required 
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Base Price (Points)</label>
                  <input 
                    type="number" 
                    min="1000"
                    step="1000"
                    className="form-input" 
                    value={basePrice}
                    onChange={(e) => setBasePrice(e.target.value)}
                    required 
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Register Player
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlayersPage;

import React, { useContext, useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import { Plus, UserPlus, Filter, X, Search, Upload, Camera, Trash2 } from 'lucide-react';

const PlayersPage = () => {
  const { city, role } = useParams();
  const { players, addPlayer, importPlayersFromExcel, updatePlayer, deletePlayer, clearAllPlayers, uploadPlayerPhoto } = useContext(AppContext);

  const [skillFilter, setSkillFilter]   = useState('All');
  const [searchQuery, setSearchQuery]   = useState('');
  const [showAddModal, setShowAddModal]   = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [editingPlayer, setEditingPlayer] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const [uploadMode, setUploadMode] = useState('manual'); // 'manual' or 'excel'
  const [excelFile, setExcelFile] = useState(null);

  // Dismiss toast on any click anywhere on the page
  useEffect(() => {
    if (!toastMessage) return;
    const dismiss = () => setToastMessage(null);
    document.addEventListener('click', dismiss);
    return () => document.removeEventListener('click', dismiss);
  }, [toastMessage]);

  // Reset modal image error when selected player changes
  const [modalImgError, setModalImgError] = useState(false);
  useEffect(() => {
    setModalImgError(false);
  }, [selectedPlayer?.id]);
  
  // Form States for Add Player
  const [wissenId, setWissenId] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [gender, setGender] = useState('Male');
  const [skillLevel, setSkillLevel] = useState('Beginner');
  const [yearsOfExperience, setYearsOfExperience] = useState(1);
  const [basePrice, setBasePrice] = useState(2000);
  const [matchesPlayed, setMatchesPlayed] = useState('');
  const [matchesWon, setMatchesWon] = useState('');
  const [matchesLost, setMatchesLost] = useState('');
  const [showStats, setShowStats] = useState(false);
  const photoInputRef = useRef(null);

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

  // Handle photo file selection with validation
  const handlePhotoSelect = (file) => {
    if (!file) return;
    
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      setToastMessage({ text: 'Invalid file type. Please upload JPG, PNG, WebP, or GIF.', type: 'error' });
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }
    
    // Validate file size (2MB max)
    if (file.size > 2 * 1024 * 1024) {
      setToastMessage({ text: 'Photo must be under 2MB. Please compress or resize.', type: 'error' });
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }
    
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const clearPhoto = () => {
    setPhotoFile(null);
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoPreview(null);
    if (photoInputRef.current) photoInputRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!wissenId || !fullName || !email) {
      setToastMessage({ text: "Please fill out all required fields.", type: 'error' });
      setTimeout(() => setToastMessage(null), 2000);
      return;
    }

    if (showStats) {
      const played = parseInt(matchesPlayed) || 0;
      const won = parseInt(matchesWon) || 0;
      const lost = parseInt(matchesLost) || 0;
      if (played !== won + lost) {
        setToastMessage({ text: "Total matches played must equal matches won + matches lost.", type: 'error' });
        setTimeout(() => setToastMessage(null), 3000);
        return;
      }
    }

    const payload = {
      wissenId,
      fullName,
      email,
      mobileNumber,
      imageUrl: photoFile ? '' : imageUrl,
      gender,
      skillLevel,
      yearsOfExperience: parseInt(yearsOfExperience),
      basePrice: parseInt(basePrice),
      location: city,
      matchesPlayed: showStats && matchesPlayed !== '' ? parseInt(matchesPlayed) : null,
      matchesWon: showStats && matchesWon !== '' ? parseInt(matchesWon) : null,
      matchesLost: showStats && matchesLost !== '' ? parseInt(matchesLost) : null,
    };

    try {
      let savedPlayer;
      if (editingPlayer) {
        savedPlayer = await updatePlayer(editingPlayer.id, payload);
        // Upload photo after save if one was selected (overwrites imageUrl with Base64 data URI)
        if (photoFile) {
          savedPlayer = await uploadPlayerPhoto(editingPlayer.id, photoFile);
        }
        setToastMessage({ text: `Player ${fullName} updated`, type: 'success' });
        if (selectedPlayer && selectedPlayer.id === editingPlayer.id) {
          setSelectedPlayer({ ...selectedPlayer, ...savedPlayer });
        }
      } else {
        savedPlayer = await addPlayer(payload);
        // Upload photo after create if one was selected
        if (photoFile && savedPlayer?.id) {
          savedPlayer = await uploadPlayerPhoto(savedPlayer.id, photoFile);
        }
        setToastMessage({ text: `Player ${fullName} added to ${city.toUpperCase()} draft`, type: 'success' });
      }

      setTimeout(() => setToastMessage(null), 1500);

      // Reset Form & Close Modal
      resetForm();
      setShowAddModal(false);
      setUploadMode('manual');
      setExcelFile(null);
    } catch (error) {
      setToastMessage({ text: error.message || "Failed to save player", type: 'error' });
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  const handleExcelUpload = async (e) => {
    e.preventDefault();
    if (!excelFile) return;
    try {
      await importPlayersFromExcel(excelFile);
      setToastMessage({ text: "Players imported successfully!", type: 'success' });
      setTimeout(() => setToastMessage(null), 3000);
      resetForm();
      setShowAddModal(false);
    } catch (error) {
      setToastMessage({ text: error.message || "Failed to import players", type: 'error' });
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  const resetForm = () => {
    setWissenId('');
    setFullName('');
    setEmail('');
    setMobileNumber('');
    setImageUrl('');
    clearPhoto();
    setGender('Male');
    setSkillLevel('Beginner');
    setYearsOfExperience(1);
    setBasePrice(2000);
    setMatchesPlayed('');
    setMatchesWon('');
    setMatchesLost('');
    setShowStats(false);
    setEditingPlayer(null);
  };

  const handleEditClick = (player) => {
    setEditingPlayer(player);
    setWissenId(player.wissenId);
    setFullName(player.fullName);
    setEmail(player.email);
    setMobileNumber(player.mobileNumber || '');
    // If existing image is a data URI (uploaded), show blank URL field; image is already stored
    setImageUrl(player.imageUrl && !player.imageUrl.startsWith('data:') ? player.imageUrl : '');
    clearPhoto();
    setGender(player.gender);
    setSkillLevel(player.skillLevel);
    setYearsOfExperience(player.yearsOfExperience);
    setBasePrice(player.basePrice);
    setMatchesPlayed(player.stats ? player.stats.matchesPlayed : '');
    setMatchesWon(player.stats ? player.stats.matchesWon : '');
    setMatchesLost(player.stats ? player.stats.matchesLost : '');
    setShowStats(!!player.stats);
    setShowAddModal(true);
  };

  const handleDeleteClick = async (player) => {
    if (player.status?.toLowerCase() === 'sold') {
      alert(`Cannot delete player ${player.fullName} because they are already sold to ${player.soldTeam}. You must first release them or delete the team.`);
      return;
    }
    if (window.confirm(`Are you sure you want to delete player ${player.fullName}? This cannot be undone.`)) {
      await deletePlayer(player.id, city);
      setToastMessage({ text: `Player ${player.fullName} deleted`, type: 'success' });
      setTimeout(() => setToastMessage(null), 1500);
      setSelectedPlayer(null);
    }
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
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={async () => {
                const count = cityPlayers.length;
                if (count === 0) return;
                if (!window.confirm(`Delete all ${count} players in ${city.toUpperCase()}? This cannot be undone.`)) return;
                try {
                  await clearAllPlayers();
                  setToastMessage({ text: `All ${count} players deleted`, type: 'success' });
                  setTimeout(() => setToastMessage(null), 2000);
                } catch (err) {
                  setToastMessage({ text: err.message || 'Failed to delete players', type: 'error' });
                  setTimeout(() => setToastMessage(null), 3000);
                }
              }}
              className="btn btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ef4444', borderColor: '#ef4444' }}
              disabled={cityPlayers.length === 0}
            >
              Clear All Players
            </button>
            <button
              onClick={() => { resetForm(); setShowAddModal(true); }}
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <UserPlus size={16} />
              Add Player
            </button>
          </div>
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
              <tr 
                key={player.id} 
                onClick={() => setSelectedPlayer(player)} 
                style={{ cursor: 'pointer' }}
                className="hover-row"
              >
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
                <td style={{ textAlign: 'center' }}>{player.yearsOfExperience !== null && player.yearsOfExperience !== undefined ? `${player.yearsOfExperience} yr${player.yearsOfExperience !== 1 ? 's' : ''}` : '-'}</td>
                <td style={{ fontWeight: '600', color: 'var(--color-secondary)' }}>{player.basePrice.toLocaleString()} pts</td>
                <td>
                  <span className={getStatusPillClass(player.status)}>
                    {player.status}
                  </span>
                </td>
                <td>
                  {player.status?.toLowerCase() === 'sold' ? (
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
          <div className="modal-content hide-scrollbar" style={{ maxWidth: '450px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Plus size={20} style={{ color: 'var(--color-primary)' }} />
                {editingPlayer ? 'Edit Player' : 'Add New Player Draft'}
              </h3>
              <button className="close-btn" type="button" onClick={() => { resetForm(); setShowAddModal(false); }}>&times;</button>
            </div>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
              <button 
                type="button" 
                className={`btn ${uploadMode === 'manual' ? 'btn-primary' : 'btn-secondary'}`} 
                onClick={() => setUploadMode('manual')}
                style={{ flex: 1 }}
              >
                Manual Entry
              </button>
              <button 
                type="button" 
                className={`btn ${uploadMode === 'excel' ? 'btn-primary' : 'btn-secondary'}`} 
                onClick={() => setUploadMode('excel')}
                style={{ flex: 1 }}
              >
                Excel Upload
              </button>
            </div>
            
            {uploadMode === 'excel' ? (
              <form onSubmit={handleExcelUpload}>
                <div className="form-group" style={{ marginBottom: '24px' }}>
                  <label className="form-label">Select Excel File (.xlsx)</label>
                  <input 
                    type="file" 
                    accept=".xlsx, .xls"
                    className="form-input" 
                    onChange={(e) => setExcelFile(e.target.files[0])}
                    required
                    style={{ padding: '12px' }}
                  />
                  <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '8px' }}>
                    Upload an Excel file matching the required schema (Email, Wissen ID, Full Name, Gender, Mobile Number, Skill Level, Experience, Image URL).
                  </p>
                </div>
                <div className="modal-actions">
                  <button type="button" className="btn btn-secondary" onClick={() => { resetForm(); setShowAddModal(false); }}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={!excelFile}>Import Players</button>
                </div>
              </form>
            ) : (
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
                  <label className="form-label">Mobile Number</label>
                  <input 
                    type="tel" 
                    className="form-input" 
                    placeholder="Enter mobile number" 
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ opacity: photoFile ? 0.5 : 1 }}>Image URL</label>
                  <input 
                    type="url" 
                    className="form-input" 
                    placeholder="https://..." 
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    disabled={!!photoFile}
                    style={photoFile ? { opacity: 0.4, cursor: 'not-allowed' } : {}}
                  />
                </div>
              </div>

              {/* Photo Upload Section */}
              <div className="form-group" style={{ marginTop: '4px' }}>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Camera size={14} />
                  Upload Photo
                  <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', fontWeight: 400 }}>(overrides URL)</span>
                </label>

                {/* Hidden file input */}
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  style={{ display: 'none' }}
                  onChange={(e) => handlePhotoSelect(e.target.files[0])}
                />

                {!photoFile ? (
                  /* Drop zone / click-to-upload */
                  <div
                    onClick={() => photoInputRef.current?.click()}
                    onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = 'var(--color-primary)'; }}
                    onDragLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-color)'; }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.currentTarget.style.borderColor = 'var(--border-color)';
                      if (e.dataTransfer.files[0]) handlePhotoSelect(e.dataTransfer.files[0]);
                    }}
                    style={{
                      border: '2px dashed var(--border-color)',
                      borderRadius: '10px',
                      padding: '20px',
                      textAlign: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      background: 'rgba(255,255,255,0.02)',
                    }}
                  >
                    <Upload size={24} style={{ color: 'var(--color-text-muted)', marginBottom: '6px' }} />
                    <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                      Click to upload or drag & drop
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: '4px', opacity: 0.7 }}>
                      Max 2MB · JPG, PNG, WebP, GIF
                    </div>
                  </div>
                ) : (
                  /* Preview of selected photo */
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '10px 14px',
                    background: 'rgba(163, 230, 53, 0.08)',
                    border: '1px solid rgba(163, 230, 53, 0.3)',
                    borderRadius: '10px',
                  }}>
                    <img
                      src={photoPreview}
                      alt="Preview"
                      style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '8px',
                        objectFit: 'cover',
                        border: '1px solid var(--border-color)',
                      }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.85rem', color: 'white', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {photoFile.name}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                        {(photoFile.size / 1024).toFixed(0)} KB
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={clearPhoto}
                      style={{
                        background: 'rgba(239, 68, 68, 0.15)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        borderRadius: '6px',
                        padding: '6px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        color: '#ef4444',
                      }}
                      title="Remove photo"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}

                {/* Current image indicator when editing */}
                {editingPlayer && editingPlayer.imageUrl && !photoFile && (
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px', 
                    marginTop: '8px',
                    padding: '6px 10px',
                    background: 'rgba(255,255,255,0.03)',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    color: 'var(--color-text-muted)'
                  }}>
                    <img
                      src={editingPlayer.imageUrl}
                      alt="Current"
                      style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }}
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                    Current photo set · upload new to replace
                  </div>
                )}
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
                    onChange={(e) => {
                      const newSkill = e.target.value;
                      setSkillLevel(newSkill);
                      if (newSkill === 'Beginner') setBasePrice(2000);
                      else if (newSkill === 'Intermediate') setBasePrice(5000);
                      else if (newSkill === 'Advanced') setBasePrice(8000);
                    }}
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
                    className="form-input" 
                    value={basePrice}
                    disabled
                    style={{ background: 'rgba(255,255,255,0.02)', color: 'var(--color-text-muted)' }}
                    required 
                  />
                </div>
              </div>

              <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <input 
                    type="checkbox" 
                    id="statsToggle"
                    checked={showStats}
                    onChange={(e) => setShowStats(e.target.checked)}
                    style={{ cursor: 'pointer' }}
                  />
                  <label htmlFor="statsToggle" style={{ color: 'white', fontSize: '0.9rem', cursor: 'pointer', margin: 0 }}>
                    Include Match Statistics (Optional)
                  </label>
                </div>
                
                {showStats && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                    <div className="form-group">
                      <label className="form-label" style={{ fontSize: '0.75rem' }}>Played</label>
                      <input type="number" min="0" className="form-input" value={matchesPlayed} onChange={(e) => setMatchesPlayed(e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label className="form-label" style={{ fontSize: '0.75rem' }}>Won</label>
                      <input type="number" min="0" className="form-input" value={matchesWon} onChange={(e) => setMatchesWon(e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label className="form-label" style={{ fontSize: '0.75rem' }}>Lost</label>
                      <input type="number" min="0" className="form-input" value={matchesLost} onChange={(e) => setMatchesLost(e.target.value)} />
                    </div>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => { resetForm(); setShowAddModal(false); }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingPlayer ? 'Save Changes' : 'Register Player'}
                </button>
              </div>
            </form>
            )}
          </div>
        </div>
      )}

      {/* Player Stats Modal */}
      {selectedPlayer && (
        <div className="modal-overlay" onClick={() => setSelectedPlayer(null)}>
          <div className="modal-content" style={{ maxWidth: '400px', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 className="modal-title">Player Profile</h3>
              <button className="close-btn" onClick={() => setSelectedPlayer(null)}><X size={24} /></button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
              <div style={{ 
                width: '100px', 
                height: '100px', 
                borderRadius: '50%', 
                overflow: 'hidden', 
                background: 'var(--bg-color)',
                border: '2px solid var(--color-primary)'
              }}>
                {selectedPlayer.imageUrl && !modalImgError ? (
                  <img src={selectedPlayer.imageUrl} alt={selectedPlayer.fullName} onError={() => setModalImgError(true)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', background: '#1e293b' }}>
                    <circle cx="50" cy="35" r="20" fill="#94a3b8" />
                    <path d="M15 85 C 15 65, 30 55, 50 55 C 70 55, 85 65, 85 85 Z" fill="#64748b" />
                  </svg>
                )}
              </div>
              
              <div>
                <h4 style={{ fontSize: '1.4rem', color: 'white', margin: '0 0 4px 0' }}>{selectedPlayer.fullName}</h4>
                <div style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>{selectedPlayer.wissenId}</div>
                <div style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Mobile: {selectedPlayer.mobileNumber || '-'}</div>
              </div>

              <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
                <span className={getSkillPillClass(selectedPlayer.skillLevel)}>{selectedPlayer.skillLevel}</span>
                <span className="pill" style={{ background: 'rgba(255,255,255,0.1)', color: 'white' }}>
                  {selectedPlayer.yearsOfExperience !== null && selectedPlayer.yearsOfExperience !== undefined ? `${selectedPlayer.yearsOfExperience} Yrs Exp` : '- Exp'}
                </span>
              </div>

              <div style={{ width: '100%', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
                <h5 style={{ color: 'white', marginBottom: '12px', fontSize: '1rem' }}>Match Statistics</h5>
                {selectedPlayer.stats ? (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                    <div style={{ background: 'rgba(255,255,255,0.05)', padding: '12px', borderRadius: '8px' }}>
                      <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'white' }}>{selectedPlayer.stats.matchesPlayed || 0}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Played</div>
                    </div>
                    <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '12px', borderRadius: '8px' }}>
                      <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#10b981' }}>{selectedPlayer.stats.matchesWon || 0}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Won</div>
                    </div>
                    <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '12px', borderRadius: '8px' }}>
                      <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#ef4444' }}>{selectedPlayer.stats.matchesLost || 0}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Lost</div>
                    </div>
                  </div>
                ) : (
                  <div style={{ color: 'var(--color-text-muted)', fontStyle: 'italic', padding: '20px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
                    no matches history found
                  </div>
                )}
              </div>

              {role === 'admin' && (
                <div style={{ display: 'flex', gap: '12px', width: '100%', marginTop: '24px' }}>
                  <button onClick={() => { setSelectedPlayer(null); handleEditClick(selectedPlayer); }} className="btn btn-primary" style={{ flex: 1 }}>Edit Player</button>
                  <button onClick={() => handleDeleteClick(selectedPlayer)} className="btn btn-secondary" style={{ flex: 1 }}>Delete</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div 
          style={{
            position: 'fixed', 
            top: '20px', 
            left: '50%', 
            transform: 'translateX(-50%)', 
            zIndex: 9999, 
            background: toastMessage.type === 'error' ? 'var(--color-danger)' : 'var(--color-success)', 
            color: toastMessage.type === 'error' ? 'white' : '#000', 
            padding: '16px 24px', 
            borderRadius: '8px', 
            fontWeight: 'bold', 
            boxShadow: '0 4px 20px rgba(0,0,0,0.5)', 
            cursor: 'pointer',
            animation: 'fadeIn 0.2s ease-out'
          }}
        >
          {toastMessage.text}
        </div>
      )}
    </div>
  );
};

export default PlayersPage;

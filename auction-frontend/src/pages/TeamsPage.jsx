import React, { useContext, useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import { Trophy, Plus, ShieldAlert, CheckCircle2, AlertTriangle, Eye, X, Trash2, Pencil, Download } from 'lucide-react';
import html2canvas from 'html2canvas';
import TeamCardExport from '../components/TeamCardExport';
import TeamLogo from '../components/TeamLogo';

const TeamsPage = () => {
  const { city, role } = useParams();
  const { teams, createTeam, updateTeam, deleteTeam, releasePlayerFromTeam, businessRules } = useContext(AppContext);

  // Modal States
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [themeColor, setThemeColor] = useState('#3b82f6');
  const [editingTeam, setEditingTeam] = useState(null);
  const [logoUrl, setLogoUrl] = useState('');
  const [logoSvg, setLogoSvg] = useState('');
  
  // Selected Team for viewing Roster Details
  const [activeRosterTeam, setActiveRosterTeam] = useState(null);
  const [playerToRelease, setPlayerToRelease] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  // Dismiss toast on any click anywhere on the page
  useEffect(() => {
    if (!toastMessage) return;
    const dismiss = () => setToastMessage(null);
    document.addEventListener('click', dismiss);
    return () => document.removeEventListener('click', dismiss);
  }, [toastMessage]);

  // Filter teams by active city
  const cityTeams = teams.filter(t => t.location.toLowerCase() === city.toLowerCase());

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!teamName || !ownerName) {
      setToastMessage({ text: "Please fill in all details.", type: 'error' });
      setTimeout(() => setToastMessage(null), 2000);
      return;
    }

    // Check if team already exists (skip check if editing the same team)
    if (
      (!editingTeam || editingTeam.teamName.toLowerCase() !== teamName.toLowerCase()) &&
      cityTeams.some(t => t.teamName.toLowerCase() === teamName.toLowerCase())
    ) {
      setToastMessage({ text: "A team with this name already exists in this city.", type: 'error' });
      setTimeout(() => setToastMessage(null), 2000);
      return;
    }

    try {
      if (editingTeam) {
        await updateTeam(editingTeam.id, {
          teamName,
          ownerName,
          themeColor,
          logoUrl,
          logoSvg,
          location: city
        });
        setToastMessage({ text: `Team ${teamName} updated`, type: 'success' });
      } else {
        await createTeam({
          teamName,
          ownerName,
          themeColor,
          logoUrl,
          logoSvg,
          location: city
        });
        setToastMessage({ text: `Team ${teamName} created in ${city.toUpperCase()} location`, type: 'success' });
      }

      setTimeout(() => setToastMessage(null), 1500);

      // Reset and Close
      resetForm();
      setShowCreateModal(false);
    } catch (error) {
      console.error("Failed to submit team:", error);
      setToastMessage({ text: "Failed to save team: " + error.message, type: 'error' });
      // Do not clear or close the modal so they don't lose their inputs
    }
  };


  const resetForm = () => {
    setTeamName('');
    setOwnerName('');
    setThemeColor('#3b82f6');
    setLogoUrl('');
    setLogoSvg('');
    setEditingTeam(null);
  };

  const handleEditClick = (team) => {
    setEditingTeam(team);
    setTeamName(team.teamName);
    setOwnerName(team.ownerName);
    setThemeColor(team.themeColor || '#3b82f6');
    setLogoUrl(team.logoUrl || '');
    setLogoSvg(team.logoSvg || '');
    setShowCreateModal(true);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    console.log(`[Upload] Original File size: ${(file.size / 1024).toFixed(2)} KB, Type: ${file.type}`);

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const img = new Image();
      img.onload = () => {
        const MAX_WIDTH = 150;
        const MAX_HEIGHT = 150;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // Compress image using PNG to keep transparency
        const resizedDataUrl = canvas.toDataURL('image/png');
        
        // Calculate base64 string size in KB roughly
        const base64SizeKB = (resizedDataUrl.length * (3/4)) / 1024;
        console.log(`[Upload] Resized Image to ${width}x${height}. Compressed Base64 size: ${base64SizeKB.toFixed(2)} KB`);

        setLogoUrl(resizedDataUrl);
        setLogoSvg(''); // clear generated if uploading
      };
      img.onerror = (error) => {
        console.error("[Upload] Error loading image into element:", error);
        setToastMessage({ text: "Failed to process the uploaded image file.", type: 'error' });
      };
      img.src = uploadEvent.target.result;
    };
    reader.onerror = (error) => {
      console.error("[Upload] FileReader error:", error);
      setToastMessage({ text: "Failed to read the file.", type: 'error' });
    };
    reader.readAsDataURL(file);
  };



  const handleReleasePlayer = (team, player) => {
    setPlayerToRelease({ team, player });
  };

  const confirmReleasePlayer = async () => {
    if (!playerToRelease) return;
    const { team, player } = playerToRelease;
    try {
      const updatedTeam = await releasePlayerFromTeam(team.id, player.id);
      setActiveRosterTeam(updatedTeam);
      setToastMessage({ text: `${player.fullName} released from ${team.teamName}. Purse refunded.`, type: 'success' });
      setTimeout(() => setToastMessage(null), 2500);
    } catch (error) {
      console.error("Failed to release player:", error);
      setToastMessage({ text: "Failed to release player: " + error.message, type: 'error' });
      setTimeout(() => setToastMessage(null), 3000);
    } finally {
      setPlayerToRelease(null);
    }
  };

  const getComplianceStatus = (val, minRequired) => {
    return val >= minRequired ? 'compliance-badge compliance-ok' : 'compliance-badge compliance-warn';
  };

  const getRosterCompliance = (count, maxAllowed) => {
    if (count === maxAllowed) return 'compliance-badge compliance-ok';
    if (count > maxAllowed) return 'compliance-badge compliance-warn';
    return 'compliance-badge'; // Normal
  };

  const posterRef = useRef(null);

  const handleDeleteTeam = async (team) => {
    if (window.confirm(`WARNING: Deleting team '${team.teamName}' will release all its purchased players back into the UNSOLD draft pool. Are you sure you want to proceed?`)) {
      await deleteTeam(team.id);
      setToastMessage({ text: `Team ${team.teamName} has been deleted and its players released.`, type: 'success' });
      setTimeout(() => setToastMessage(null), 2500);
    }
  };

  const handleDownloadRoster = async (team) => {
    if (!posterRef.current) return;
    try {
      const canvas = await html2canvas(posterRef.current, {
        backgroundColor: '#050a05',
        scale: 2, // High resolution
        logging: false
      });
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `${team.teamName.replace(/\s+/g, '_')}_Roster.png`;
      link.href = dataUrl;
      link.click();
      setToastMessage({ text: 'Roster downloaded successfully!', type: 'success' });
    } catch (error) {
      console.error("Failed to generate image:", error);
      setToastMessage({ text: 'Failed to download roster image.', type: 'error' });
    }
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
            onClick={() => { resetForm(); setShowCreateModal(true); }} 
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
            <div 
              key={team.teamName} 
              className="glass-panel team-card" 
              style={{ 
                '--team-color': team.themeColor || '#1d4ed8',
                padding: '24px', 
                display: 'flex', 
                flexDirection: 'column', 
                justifyContent: 'space-between', 
                border: '1px solid var(--border-color)', 
                position: 'relative',
                transition: 'all 0.3s ease'
              }}
            >
              <div>
                {/* Team header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <h3 style={{ fontSize: '1.4rem', color: team.themeColor || 'white', fontWeight: '800' }}>{team.teamName}</h3>
                      {role === 'admin' && (
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button 
                            onClick={() => handleEditClick(team)}
                            style={{
                              width: '28px',
                              height: '28px',
                              borderRadius: '6px',
                              background: 'rgba(59, 130, 246, 0.1)',
                              border: '1px solid rgba(59, 130, 246, 0.2)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#3b82f6',
                              cursor: 'pointer'
                            }}
                            title="Edit Team"
                          >
                            <Pencil size={14} />
                          </button>
                          <button 
                            onClick={() => handleDeleteTeam(team)}
                            style={{
                              width: '28px',
                              height: '28px',
                              borderRadius: '6px',
                              background: 'rgba(239, 68, 68, 0.1)',
                              border: '1px solid rgba(239, 68, 68, 0.2)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#ef4444',
                              cursor: 'pointer'
                            }}
                            title="Delete Team"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      )}
                    </div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', display: 'block', marginTop: '4px' }}>Owner: <strong style={{ color: 'white' }}>{team.ownerName}</strong></span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <TeamLogo teamName={team.teamName} themeColor={team.themeColor || '#1d4ed8'} size={40} logoUrl={team.logoUrl} logoSvg={team.logoSvg} />
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
          <div className="modal-content" style={{ maxWidth: '1100px', width: '95%', maxHeight: '95vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div className="modal-header" style={{ flexShrink: 0 }}>
              <div>
                <h3 className="modal-title">{activeRosterTeam.teamName} Roster</h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Owner: {activeRosterTeam.ownerName} &bull; Purse Remaining: {activeRosterTeam.purseRemaining.toLocaleString()} pts</span>
              </div>
              <button className="close-btn" onClick={() => setActiveRosterTeam(null)}>&times;</button>
            </div>

            <div style={{ marginTop: '10px', flex: 1, overflowY: 'auto', paddingRight: '4px' }} className="hide-scrollbar">
              {activeRosterTeam.players.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px', color: 'var(--color-text-muted)', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  No players purchased yet during this auction.
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '10px' }}>
                  {activeRosterTeam.players.map((p) => (
                    <div key={p.id} style={{
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '8px',
                      padding: '12px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start'
                    }}>
                      <div>
                        <div style={{ fontSize: '0.95rem', fontWeight: 'bold', color: 'white', marginBottom: '2px' }}>{p.fullName}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '8px' }}>ID: <strong style={{ color: 'white' }}>{p.wissenId}</strong></div>
                        <div style={{ display: 'flex', gap: '6px', fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
                          <span style={{ background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: '4px' }}>{p.gender}</span>
                          <span style={{ background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: '4px' }}>{p.skillLevel}</span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>Cost</div>
                          <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--color-primary)' }}>
                            {p.soldPrice?.toLocaleString() || p.basePrice.toLocaleString()} pts
                          </div>
                        </div>
                        {role === 'admin' && (
                          <button
                            onClick={() => handleReleasePlayer(activeRosterTeam, p)}
                            title="Release player (mark as unsold & refund purse)"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              padding: '6px',
                              borderRadius: '6px',
                              background: 'rgba(239, 68, 68, 0.1)',
                              border: '1px solid rgba(239, 68, 68, 0.3)',
                              color: '#ef4444',
                              cursor: 'pointer',
                              transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = '#ef4444'; e.currentTarget.style.color = 'white'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'; e.currentTarget.style.color = '#ef4444'; }}
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px', gap: '12px', flexShrink: 0 }}>
              <button className="btn btn-primary" onClick={() => handleDownloadRoster(activeRosterTeam)}>
                <Download size={16} /> Download Roster PNG
              </button>
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
          <div className="modal-content hide-scrollbar" style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Trophy size={20} style={{ color: 'var(--color-primary)' }} />
                {editingTeam ? 'Edit Franchise' : 'Register New Franchise'}
              </h3>
              <button className="close-btn" type="button" onClick={() => { resetForm(); setShowCreateModal(false); }}>&times;</button>
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
                <label className="form-label">Theme Color</label>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <input 
                    type="color" 
                    value={themeColor}
                    onChange={(e) => setThemeColor(e.target.value)}
                    style={{
                      width: '40px',
                      height: '40px',
                      padding: '0',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      background: 'none'
                    }}
                  />
                  <span style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Select a color to represent this franchise</span>
                </div>
              </div>

              {/* Logo Section */}
              <div className="form-group" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px', marginTop: '16px' }}>
                <label className="form-label">Team Logo</label>
                
                <div style={{ marginBottom: '12px' }}>
                  <input 
                    type="file"
                    accept="image/png, image/svg+xml, image/jpeg"
                    onChange={handleFileUpload}
                    style={{
                      width: '100%',
                      fontSize: '0.8rem',
                      color: 'var(--color-text-muted)',
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px dashed var(--border-color)',
                      padding: '10px',
                      borderRadius: '6px'
                    }}
                  />
                  <p style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>PNG, SVG, or JPG accepted</p>
                </div>

                {/* Logo Preview box */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', gap: '8px' }}>
                  {logoUrl ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', width: '100%' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-secondary)', fontWeight: 'bold' }}>Uploaded Logo</span>
                      <div style={{ width: '100px', height: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: '6px', overflow: 'hidden' }}>
                        <TeamLogo teamName={teamName} themeColor={themeColor} size={90} logoUrl={logoUrl} logoSvg={logoSvg} />
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', padding: '6px 0', width: '100%' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 'bold' }}>No Custom Logo Selected</span>
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', width: '100%', justifyContent: 'center' }}>
                        <div style={{ width: '60px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: '6px', overflow: 'hidden', opacity: 0.5, flexShrink: 0 }}>
                          <TeamLogo teamName={teamName} themeColor={themeColor} size={55} logoUrl={logoUrl} logoSvg={logoSvg} />
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', lineHeight: '1.3' }}>
                          A <strong>Default Mascot Shield</strong> (preview on left) will be used. Upload a file to customize it.
                        </div>
                      </div>
                    </div>
                  )}
                  {(logoSvg || logoUrl) && (
                    <button
                      type="button"
                      onClick={() => { setLogoSvg(''); setLogoUrl(''); }}
                      className="btn btn-secondary"
                      style={{ fontSize: '0.7rem', padding: '4px 10px', marginTop: '4px', width: '100%', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      Revert to Default Mascot
                    </button>
                  )}
                </div>


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
                <button type="button" className="btn btn-secondary" onClick={() => { resetForm(); setShowCreateModal(false); }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingTeam ? 'Save Changes' : 'Create Franchise'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Player Release Confirmation Modal */}
      {playerToRelease && (
        <div className="modal-overlay" style={{ zIndex: 10000 }}>
          <div className="modal-content" style={{ maxWidth: '400px', textAlign: 'center' }}>
            <h3 className="modal-title" style={{ color: 'var(--color-danger)', marginBottom: '16px' }}>Confirm Release</h3>
            <p style={{ color: 'white', marginBottom: '24px', fontSize: '1.05rem' }}>
              Are you sure you want to release player <strong style={{ color: 'var(--color-primary)' }}>{playerToRelease.player.fullName}</strong>?
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
              <button className="btn btn-secondary" onClick={() => setPlayerToRelease(null)}>Cancel</button>
              <button className="btn btn-primary" style={{ background: 'var(--color-danger)', color: 'white', border: 'none' }} onClick={confirmReleasePlayer}>Yes, Release</button>
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

      {/* Hidden Roster Poster for Download */}
      <div style={{ position: 'absolute', top: '-9999px', left: '-9999px' }}>
        <TeamCardExport ref={posterRef} team={activeRosterTeam || teams[0]} />
      </div>

    </div>
  );
};

export default TeamsPage;

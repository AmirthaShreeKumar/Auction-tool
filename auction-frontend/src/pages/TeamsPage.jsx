import React, { useContext, useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import { Trophy, Plus, ShieldAlert, CheckCircle2, AlertTriangle, Eye, X, Trash2, Pencil, Download } from 'lucide-react';
import html2canvas from 'html2canvas';
import TeamCardExport from '../components/TeamCardExport';
import TeamLogo from '../components/TeamLogo';
import PlayerPhoto from '../components/PlayerPhoto';


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

  const currentActiveTeam = cityTeams.find(t => t.id === activeRosterTeam?.id) || cityTeams[0] || null;

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

      {/* Main Split View Layout */}
      <div style={{ 
        display: 'flex', 
        gap: '24px', 
        marginTop: '20px', 
        alignItems: 'flex-start', 
        flexWrap: 'wrap' 
      }}>
        
        {/* Left Column: Team List Sidebar */}
        <div style={{ 
          flex: '1 1 350px', 
          maxWidth: '420px', 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '12px', 
          maxHeight: 'calc(100vh - 160px)', 
          overflowY: 'auto', 
          paddingRight: '12px' 
        }}>
          {cityTeams.map((team) => {
            const isRosterFull = team.totalPlayers === businessRules.teamSizeLimit;
            const isFemaleCompliant = team.femalePlayers >= businessRules.minFemales;
            const isBeginnerCompliant = team.beginnerPlayers >= businessRules.minBeginners;
            const isSelected = currentActiveTeam?.id === team.id;
            
            const spentPurse = businessRules.purseLimit - team.purseRemaining;
            const spentPct = (spentPurse / businessRules.purseLimit) * 100;
            const advancedCount = team.players ? team.players.filter(p => p.skillLevel?.toLowerCase() === 'advanced').length : 0;

            return (
              <div 
                key={team.id || team.teamName} 
                className="glass-panel team-card" 
                onClick={() => setActiveRosterTeam(team)}
                style={{ 
                  '--team-color': team.themeColor || '#1d4ed8',
                  padding: '16px', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  border: isSelected 
                    ? `2px solid ${team.themeColor || 'var(--color-primary)'}` 
                    : '1px solid var(--border-color)', 
                  boxShadow: isSelected 
                    ? `0 0 15px rgba(255,255,255,0.05)` 
                    : 'none',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  position: 'relative',
                  transition: 'all 0.3s ease'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <TeamLogo teamName={team.teamName} themeColor={team.themeColor || '#1d4ed8'} size={40} logoUrl={team.logoUrl} logoSvg={team.logoSvg} />
                    <div>
                      <h4 style={{ fontSize: '0.95rem', fontWeight: 'bold', color: team.themeColor || 'white', margin: 0 }}>{team.teamName}</h4>
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{team.ownerName}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }} onClick={(e) => e.stopPropagation()}>
                    {(!isFemaleCompliant || !isBeginnerCompliant) && (
                      <AlertTriangle size={14} style={{ color: 'var(--color-warning)' }} title="Roster requirements unmet" />
                    )}
                    {role === 'admin' && (
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button 
                          onClick={() => handleEditClick(team)}
                          style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '4px',
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
                          <Pencil size={12} />
                        </button>
                        <button 
                          onClick={() => handleDeleteTeam(team)}
                          style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '4px',
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
                          <Trash2 size={12} />
                        </button>
                      </div>
                    )}
                    {isSelected ? (
                      <span style={{ color: team.themeColor || 'white', fontWeight: 'bold', fontSize: '0.9rem', marginLeft: '4px' }}>▼</span>
                    ) : (
                      <span style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginLeft: '4px' }}>▶</span>
                    )}
                  </div>
                </div>

                {/* Counts Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', marginTop: '12px' }}>
                  <div style={{ background: 'rgba(255,255,255,0.02)', padding: '6px 4px', borderRadius: '6px', textAlign: 'center', border: '1px solid var(--border-color)' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'white' }}>{team.totalPlayers || 0}/{businessRules.teamSizeLimit}</div>
                    <div style={{ fontSize: '0.6rem', color: 'var(--color-text-muted)' }}>Players</div>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.02)', padding: '6px 4px', borderRadius: '6px', textAlign: 'center', border: '1px solid var(--border-color)' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'white' }}>{team.beginnerPlayers || 0}</div>
                    <div style={{ fontSize: '0.6rem', color: 'var(--color-text-muted)' }}>Beginner</div>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.02)', padding: '6px 4px', borderRadius: '6px', textAlign: 'center', border: '1px solid var(--border-color)' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'white' }}>{team.femalePlayers || 0}</div>
                    <div style={{ fontSize: '0.6rem', color: 'var(--color-text-muted)' }}>Female</div>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.02)', padding: '6px 4px', borderRadius: '6px', textAlign: 'center', border: '1px solid var(--border-color)' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'white' }}>{advancedCount}</div>
                    <div style={{ fontSize: '0.6rem', color: 'var(--color-text-muted)' }}>Advanced</div>
                  </div>
                </div>

                {/* Purse Progress Bar */}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', marginTop: '12px', color: 'var(--color-text-muted)' }}>
                  <span>Purse</span>
                  <span style={{ fontWeight: 'bold', color: 'white' }}>{team.purseRemaining.toLocaleString()} pts</span>
                </div>
                <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.08)', borderRadius: '2px', marginTop: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${100 - spentPct}%`, height: '100%', background: 'var(--color-success)', borderRadius: '2px' }} />
                </div>
              </div>
            );
          })}
          {cityTeams.length === 0 && (
            <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
              No teams created for {city.toUpperCase()} location yet.
            </div>
          )}
        </div>

        {/* Right Column: Selected Team Details Panel */}
        <div style={{ flex: '2 1 600px', minWidth: '350px' }}>
          {currentActiveTeam ? (
            <div className="glass-panel" style={{ padding: '24px', border: '1px solid var(--border-color)', borderRadius: '16px', display: 'flex', flexDirection: 'column' }}>
              
              {/* Logo / Header details */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', marginBottom: '24px', borderBottom: '1px solid var(--border-color)', paddingBottom: '20px' }}>
                <TeamLogo teamName={currentActiveTeam.teamName} themeColor={currentActiveTeam.themeColor || '#1d4ed8'} size={90} logoUrl={currentActiveTeam.logoUrl} logoSvg={currentActiveTeam.logoSvg} />
                <h3 style={{ fontSize: '1.8rem', fontWeight: '800', color: 'white', margin: 0, textTransform: 'uppercase', letterSpacing: '-0.02em' }}>
                  {currentActiveTeam.teamName}
                </h3>
                <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Owner: <strong>{currentActiveTeam.ownerName}</strong></span>
                
                <div style={{ marginTop: '12px', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-text-muted)', fontWeight: '700', letterSpacing: '0.05em' }}>Purse Remaining</div>
                  <div style={{ fontSize: '2.2rem', fontWeight: '900', color: 'var(--color-success)', fontFamily: 'var(--font-display)', marginTop: '2px' }}>
                    {currentActiveTeam.purseRemaining.toLocaleString()} <span style={{ fontSize: '1rem', color: 'var(--color-text-muted)', fontWeight: 'normal' }}>pts</span>
                  </div>
                </div>
              </div>

              {/* Quota Compliance Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                {/* Beginner Quota */}
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: '600' }}>Beginner Quota</span>
                    {currentActiveTeam.beginnerPlayers >= businessRules.minBeginners ? (
                      <span style={{ color: 'var(--color-success)', fontSize: '0.75rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <CheckCircle2 size={12} /> Met
                      </span>
                    ) : (
                      <span style={{ color: 'var(--color-warning)', fontSize: '0.75rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <AlertTriangle size={12} /> Unmet
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '1.4rem', fontWeight: '800', color: 'white' }}>
                    {currentActiveTeam.beginnerPlayers || 0} / {businessRules.minBeginners || 2}
                  </div>
                </div>

                {/* Female Quota */}
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: '600' }}>Female Quota</span>
                    {currentActiveTeam.femalePlayers >= businessRules.minFemales ? (
                      <span style={{ color: 'var(--color-success)', fontSize: '0.75rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <CheckCircle2 size={12} /> Met
                      </span>
                    ) : (
                      <span style={{ color: 'var(--color-warning)', fontSize: '0.75rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <AlertTriangle size={12} /> Unmet
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '1.4rem', fontWeight: '800', color: 'white' }}>
                    {currentActiveTeam.femalePlayers || 0} / {businessRules.minFemales || 2}
                  </div>
                </div>
              </div>

              {/* Roster / Player Cards */}
              <div style={{ flex: 1 }}>
                <h4 style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>
                  Roster Players ({currentActiveTeam.players.length})
                </h4>

                {currentActiveTeam.players.length === 0 ? (
                  <div style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    gap: '12px', 
                    padding: '60px 20px', 
                    background: 'rgba(255,255,255,0.01)', 
                    borderRadius: '12px', 
                    border: '1px dashed var(--border-color)', 
                    color: 'var(--color-text-muted)' 
                  }}>
                    <Eye size={40} style={{ opacity: 0.2 }} />
                    <span>No players acquired yet</span>
                  </div>
                ) : (
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', 
                    gap: '12px', 
                    maxHeight: '40vh', 
                    overflowY: 'auto', 
                    paddingRight: '12px' 
                  }}>
                    {currentActiveTeam.players.map((p) => (
                      <div key={p.id} style={{
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '12px',
                        padding: '12px',
                        display: 'flex',
                        gap: '12px',
                        alignItems: 'center'
                      }}>
                        {/* Player Picture placeholder */}
                        <div style={{
                          width: '50px',
                          height: '50px',
                          borderRadius: '8px',
                          background: '#1e293b',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          overflow: 'hidden',
                          flexShrink: 0
                        }}>
                          <PlayerPhoto playerId={p.id} playerName={p.fullName} size="36px" borderRadius="8px" />
                        </div>

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '0.9rem', fontWeight: 'bold', color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {p.fullName}
                          </div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
                            ID: <strong style={{ color: 'white' }}>{p.wissenId}</strong>
                          </div>
                          <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
                            <span style={{ fontSize: '0.65rem', background: 'rgba(255,255,255,0.05)', color: 'white', padding: '1px 4px', borderRadius: '4px' }}>{p.gender}</span>
                            <span style={{ fontSize: '0.65rem', background: 'rgba(255,255,255,0.05)', color: 'white', padding: '1px 4px', borderRadius: '4px' }}>{p.skillLevel}</span>
                          </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px', flexShrink: 0 }}>
                          <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--color-primary)' }}>
                            {(p.soldPrice || p.basePrice).toLocaleString()} pts
                          </span>
                          {role === 'admin' && (
                            <button
                              onClick={() => handleReleasePlayer(currentActiveTeam, p)}
                              title="Release player (mark as unsold & refund purse)"
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: 'var(--color-danger)',
                                cursor: 'pointer',
                                padding: '4px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
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

              {/* Bottom stats and download button */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', gap: '16px', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                  <span>Total spent: <strong style={{ color: 'white' }}>{(businessRules.purseLimit - currentActiveTeam.purseRemaining).toLocaleString()} pts</strong></span>
                  <span>&bull;</span>
                  <span>Slots: <strong style={{ color: 'white' }}>{currentActiveTeam.totalPlayers} / {businessRules.teamSizeLimit}</strong></span>
                </div>
                <button className="btn btn-primary" onClick={() => handleDownloadRoster(currentActiveTeam)} style={{ padding: '6px 16px', fontSize: '0.8rem' }}>
                  <Download size={14} /> Download Roster PNG
                </button>
              </div>

            </div>
          ) : (
            <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
              No team selected. Click on a team from the list to view details.
            </div>
          )}
        </div>

      </div>

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
        <TeamCardExport ref={posterRef} team={currentActiveTeam || teams[0]} />
      </div>

    </div>
  );
};

export default TeamsPage;

import React, { useContext, useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import { 
  Gavel, 
  User, 
  ArrowRight, 
  TrendingUp, 
  Award, 
  Check, 
  XSquare, 
  Users, 
  Coins,
  PlayCircle,
  SkipForward,
  ArrowLeft
} from 'lucide-react';

const AuctionPage = () => {
  const { city, role } = useParams();
  const { 
    teams,
    players,
    activePlayer, 
    currentBid, 
    highestBidderTeam, 
    auctionQueue, 
    currentAuctionIndex,
    auctionSkillFilter,
    setAuctionSkillFilter,
    auctionGenderFilter,
    setAuctionGenderFilter,
    increaseBid, 
    passPlayer, 
    markSold, 
    nextPlayer,
    revertLastBid,
    reAuction,
    businessRules
  } = useContext(AppContext);

  // Trigger bid flash animation
  const [animateBid, setAnimateBid] = useState(false);
  const [biddingError, setBiddingError] = useState('');
  const [toastMessage, setToastMessage] = useState(null);
  
  // Modal state for selecting team
  const [showTeamModal, setShowTeamModal] = useState(false);

  // Lots selection states (Admin only)
  const [isLotSelected, setIsLotSelected] = useState(false);
  const [selectedGender, setSelectedGender] = useState('Female');
  const [selectedSkill, setSelectedSkill] = useState('Beginner');

  // Helper to count remaining players for filter options
  const getFilteredCount = (skill, gender) => {
    if (!players) return 0;
    return players.filter(p => 
      p.location?.toLowerCase() === city?.toLowerCase() && 
      p.status === 'UNSOLD' && 
      (skill === 'All' || p.skillLevel === skill) &&
      (gender === 'All' || p.gender === gender)
    ).length;
  };

  // Helper to count skipped/passed players for filter options
  const getPassedCount = (skill, gender) => {
    if (!players) return 0;
    return players.filter(p => 
      p.location?.toLowerCase() === city?.toLowerCase() && 
      p.status === 'PASSED' && 
      (skill === 'All' || p.skillLevel === skill) &&
      (gender === 'All' || p.gender === gender)
    ).length;
  };



  useEffect(() => {
    if (currentBid > 0) {
      setAnimateBid(true);
      const timer = setTimeout(() => setAnimateBid(false), 300);
      return () => clearTimeout(timer);
    }
  }, [currentBid]);

  // Dynamically enlarge main-content width on this page to utilize side spaces
  useEffect(() => {
    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
      const originalMaxWidth = mainContent.style.maxWidth;
      const originalWidth = mainContent.style.width;
      const originalPadding = mainContent.style.padding;
      
      mainContent.style.maxWidth = '1800px';
      mainContent.style.width = '96%';
      mainContent.style.padding = '20px 24px';
      
      return () => {
        mainContent.style.maxWidth = originalMaxWidth;
        mainContent.style.width = originalWidth;
        mainContent.style.padding = originalPadding;
      };
    }
  }, []);

  // Reset error when player changes
  const [imgError, setImgError] = useState(false);
  useEffect(() => {
    setBiddingError('');
    setShowTeamModal(false);
    setImgError(false);
  }, [activePlayer]);

  useEffect(() => {
    console.log("[WBPL Debug] toastMessage changed:", toastMessage);
  }, [toastMessage]);

  // Filter teams by city
  const cityTeams = teams.filter(t => t.location.toLowerCase() === city.toLowerCase());

  // Count of skipped/passed players for the current city matching the active filters
  const passedCount = players ? players.filter(p => 
    p.location?.toLowerCase() === city?.toLowerCase() && 
    p.status === 'PASSED' &&
    (auctionSkillFilter === 'All' || p.skillLevel === auctionSkillFilter) &&
    (auctionGenderFilter === 'All' || p.gender === auctionGenderFilter)
  ).length : 0;

  const handleBidSubmit = async (increment = 500) => {
    setBiddingError('');
    const res = await increaseBid(increment);
    if (res && !res.success) {
      setBiddingError(res.message);
    }
  };

  const handleMarkSoldToTeam = async (teamId, teamName) => {
    console.log("[WBPL Debug] handleMarkSoldToTeam called with:", { teamId, teamName });
    setBiddingError('');
    const playerSold = activePlayer?.fullName;
    const amountSold = currentBid;

    console.log("[WBPL Debug] Calling markSold for:", { playerSold, amountSold });
    const res = await markSold(teamId, (errorMsg) => {
      console.log("[WBPL Debug] Background markSold failed:", errorMsg);
      setToastMessage({ text: `Failed to sell ${playerSold}: ${errorMsg}`, type: 'error' });
      setTimeout(() => {
        setToastMessage(null);
      }, 5000);
    });
    console.log("[WBPL Debug] markSold response:", res);

    if (res && !res.success) {
      console.log("[WBPL Debug] markSold failed:", res.message);
      setBiddingError(res.message);
    } else {
      console.log("[WBPL Debug] markSold succeeded, setting toast...");
      setShowTeamModal(false);
      setToastMessage({ text: `${playerSold} sold to ${teamName} for ${amountSold.toLocaleString()} pts`, type: 'success' });
      setTimeout(() => {
        console.log("[WBPL Debug] Timeout reached, clearing toast");
        setToastMessage(null);
      }, 3000);
    }
  };

  const getSkillBadgeColor = (skill) => {
    switch (skill.toLowerCase()) {
      case 'beginner': return '#22d3ee';
      case 'intermediate': return '#fbbf24';
      case 'advanced': return '#a78bfa';
      default: return 'white';
    }
  };

  if (role === 'admin' && !isLotSelected) {
    const unsoldCount = getFilteredCount(selectedSkill, selectedGender);
    const passedCount = getPassedCount(selectedSkill, selectedGender);
    const totalMatchingCount = unsoldCount + passedCount;
    
    return (
      <div>
        {/* Page Header */}
        <div className="page-header" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '8px', marginBottom: '30px' }}>
          <h2 className="page-title" style={{ fontSize: '2.4rem' }}>Configure Auction Lot</h2>
          <p className="page-subtitle" style={{ fontSize: '1.05rem' }}>Select a player category to begin bidding for {city.toUpperCase()} location.</p>
        </div>

        <div className="glass-panel" style={{ padding: '48px', maxWidth: '1600px', margin: '0 auto', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '40px' }}>
          
          {/* Gender Choice Section */}
          <div>
            <h4 style={{ fontSize: '1.25rem', color: 'white', marginBottom: '20px', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <User size={22} style={{ color: 'var(--color-primary)' }} />
              1. Select Gender
            </h4>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px' }}>
              {[
                { label: 'Female', value: 'Female' },
                { label: 'Male', value: 'Male' },
                { label: 'Both Genders', value: 'All' }
              ].map((genderOpt) => {
                const isSelected = selectedGender === genderOpt.value;
                const uCount = getFilteredCount('All', genderOpt.value);
                const pCount = getPassedCount('All', genderOpt.value);
                
                let countText = '';
                if (uCount > 0 && pCount > 0) {
                  countText = `${uCount} Unsold (${pCount} Passed)`;
                } else if (uCount > 0) {
                  countText = `${uCount} Player${uCount !== 1 ? 's' : ''} Unsold`;
                } else if (pCount > 0) {
                  countText = `${pCount} Player${pCount !== 1 ? 's' : ''} Passed`;
                } else {
                  countText = `0 Players`;
                }

                return (
                  <div
                    key={genderOpt.value}
                    onClick={() => {
                      setSelectedGender(genderOpt.value);
                    }}
                    style={{
                      padding: '32px',
                      background: isSelected ? 'rgba(212, 252, 52, 0.05)' : 'rgba(255, 255, 255, 0.01)',
                      border: isSelected ? '2px solid var(--color-primary)' : '1px solid var(--border-color)',
                      boxShadow: isSelected ? '0 0 25px rgba(212, 252, 52, 0.18)' : 'none',
                      borderRadius: '16px',
                      cursor: 'pointer',
                      transition: 'all 0.25s ease',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '16px',
                      position: 'relative'
                    }}
                    onMouseOver={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                      }
                    }}
                    onMouseOut={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.borderColor = 'var(--border-color)';
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.01)';
                      }
                    }}
                  >
                    {isSelected && (
                      <div style={{
                        position: 'absolute',
                        top: '16px',
                        right: '16px',
                        background: 'var(--color-primary)',
                        color: '#05070f',
                        borderRadius: '50%',
                        width: '24px',
                        height: '24px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <Check size={14} strokeWidth={3} fill="none" />
                      </div>
                    )}
                    <span style={{ fontSize: '1.5rem', fontWeight: '800', color: isSelected ? 'var(--color-primary)' : 'white' }}>
                      {genderOpt.label}
                    </span>
                    <span style={{ fontSize: '1rem', color: isSelected ? 'white' : 'var(--color-text-muted)' }}>
                      {countText}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Skill Level Selection Section */}
          <div>
            <h4 style={{ fontSize: '1.25rem', color: 'white', marginBottom: '20px', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Award size={22} style={{ color: 'var(--color-primary)' }} />
              2. Select Skill Level
            </h4>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
              {[
                { label: 'Beginner', value: 'Beginner' },
                { label: 'Intermediate', value: 'Intermediate' },
                { label: 'Advanced', value: 'Advanced' },
                { label: 'All Levels', value: 'All' }
              ].map((skillOpt) => {
                const isSelected = selectedSkill === skillOpt.value;
                const uCount = getFilteredCount(skillOpt.value, selectedGender);
                const pCount = getPassedCount(skillOpt.value, selectedGender);
                
                let countText = '';
                let isWarning = false;
                if (uCount > 0 && pCount > 0) {
                  countText = `${uCount} Unsold (${pCount} Passed)`;
                } else if (uCount > 0) {
                  countText = `${uCount} Unsold`;
                } else if (pCount > 0) {
                  countText = `${pCount} Passed`;
                } else {
                  countText = `0 Players`;
                  isWarning = true;
                }
                
                return (
                  <div
                    key={skillOpt.value}
                    onClick={() => setSelectedSkill(skillOpt.value)}
                    style={{
                      padding: '24px',
                      background: isSelected ? 'rgba(212, 252, 52, 0.05)' : 'rgba(255, 255, 255, 0.01)',
                      border: isSelected ? '2px solid var(--color-primary)' : '1px solid var(--border-color)',
                      boxShadow: isSelected ? '0 0 25px rgba(212, 252, 52, 0.18)' : 'none',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      transition: 'all 0.25s ease',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '10px',
                      position: 'relative'
                    }}
                    onMouseOver={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                      }
                    }}
                    onMouseOut={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.borderColor = 'var(--border-color)';
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.01)';
                      }
                    }}
                  >
                    {isSelected && (
                      <div style={{
                        position: 'absolute',
                        top: '12px',
                        right: '12px',
                        background: 'var(--color-primary)',
                        color: '#05070f',
                        borderRadius: '50%',
                        width: '20px',
                        height: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <Check size={12} strokeWidth={3} fill="none" />
                      </div>
                    )}
                    <span style={{ 
                      fontSize: '1.15rem', 
                      fontWeight: '700', 
                      color: isSelected ? 'var(--color-primary)' : 'white',
                      textTransform: 'uppercase' 
                    }}>
                      {skillOpt.label}
                    </span>
                    <span style={{ 
                      fontSize: '0.9rem', 
                      color: isWarning ? 'var(--color-danger)' : isSelected ? 'white' : 'var(--color-text-muted)',
                      fontWeight: isWarning ? '600' : 'normal'
                    }}>
                      {countText}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action Footer */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', marginTop: '16px', borderTop: '1px solid var(--border-color)', paddingTop: '32px' }}>
            {(() => {
              const canStart = totalMatchingCount > 0;
              let buttonText = `Start Auction Lot (${unsoldCount} Player${unsoldCount !== 1 ? 's' : ''})`;
              if (unsoldCount === 0 && passedCount > 0) {
                buttonText = `Enter Lot for Re-Auction (${passedCount} Passed)`;
              }
              
              return (
                <>
                  <button
                    onClick={() => {
                      setAuctionGenderFilter(selectedGender);
                      setAuctionSkillFilter(selectedSkill);
                      setIsLotSelected(true);
                    }}
                    className="btn btn-primary"
                    disabled={!canStart}
                    style={{
                      padding: '18px 48px',
                      fontSize: '1.25rem',
                      minWidth: '320px',
                      borderRadius: '12px'
                    }}
                  >
                    <PlayCircle size={22} />
                    {buttonText}
                  </button>
                  {!canStart && (
                    <span style={{ color: 'var(--color-danger)', fontSize: '0.95rem', fontWeight: '600' }}>
                      No players available (unsold or passed) in this combination. Please select another lot.
                    </span>
                  )}
                </>
              );
            })()}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Page Header */}
      <div className="page-header" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '16px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {role === 'admin' && (
              <button
                onClick={() => setIsLotSelected(false)}
                className="btn btn-secondary"
                style={{ padding: '8px 12px', fontSize: '0.85rem', display: 'flex', gap: '6px', alignItems: 'center' }}
              >
                <ArrowLeft size={16} />
                Change Lot
              </button>
            )}
            <div>
              <h2 className="page-title">Live Auction Board</h2>
              <p className="page-subtitle">Interactive player draft system for {city.toUpperCase()} location.</p>
            </div>
          </div>
          
          {/* Read-only Badges */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{
              fontSize: '0.8rem',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--border-color)',
              color: 'var(--color-text-muted)',
              padding: '6px 12px',
              borderRadius: '8px',
              fontWeight: '600'
            }}>
              Gender: <strong style={{ color: 'white' }}>{auctionGenderFilter === 'All' ? 'All Genders' : auctionGenderFilter}</strong>
            </span>
            <span style={{
              fontSize: '0.8rem',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--border-color)',
              color: 'var(--color-text-muted)',
              padding: '6px 12px',
              borderRadius: '8px',
              fontWeight: '600'
            }}>
              Skill: <strong style={{ color: 'white' }}>{auctionSkillFilter === 'All' ? 'All Levels' : auctionSkillFilter}</strong>
            </span>
            <span style={{
              fontSize: '0.8rem',
              background: 'rgba(212, 252, 52, 0.08)',
              border: '1px solid rgba(212, 252, 52, 0.2)',
              color: 'var(--color-primary)',
              padding: '6px 12px',
              borderRadius: '8px',
              fontWeight: '700'
            }}>
              Remaining: {getFilteredCount(auctionSkillFilter, auctionGenderFilter)}
            </span>
          </div>
        </div>
      </div>

      <div style={{ 
        display: 'flex', 
        flexDirection: 'row', 
        flexWrap: 'wrap', 
        gap: '24px', 
        alignItems: 'flex-start',
        marginTop: '12px'
      }}>
        
        {/* Left Column: Main Auction Player Frame */}
        <div style={{ flex: '1.1 1 50%', minWidth: '550px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {activePlayer ? (
            <div className="glass-panel" style={{ 
              padding: '36px', 
              border: '1px solid var(--border-color)', 
              boxShadow: '0 15px 40px rgba(0,0,0,0.5)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              
              {/* Corner Watermark */}
              <Gavel size={200} style={{ 
                position: 'absolute', 
                bottom: '-20px', 
                right: '-20px', 
                opacity: 0.03, 
                color: 'white',
                transform: 'rotate(-25deg)'
              }} />
 
              {/* Player Information Frame */}
              <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap' }}>
                
                {/* Player Profile Photo */}
                <div style={{ 
                  width: '180px', 
                  height: '180px', 
                  borderRadius: '24px', 
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.08) 100%)',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: getSkillBadgeColor(activePlayer.skillLevel),
                  boxShadow: '0 0 20px rgba(255,255,255,0.02)',
                  overflow: 'hidden'
                }}>
                  {activePlayer.imageUrl && !imgError ? (
                    <img src={activePlayer.imageUrl} alt={activePlayer.fullName} onError={() => setImgError(true)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', background: '#1e293b' }}>
                      <circle cx="50" cy="35" r="20" fill="#94a3b8" />
                      <path d="M15 85 C 15 65, 30 55, 50 55 C 70 55, 85 65, 85 85 Z" fill="#64748b" />
                    </svg>
                  )}
                </div>
 
                {/* Player details */}
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                    <span style={{ 
                      fontSize: '0.9rem', 
                      background: 'rgba(255,255,255,0.06)', 
                      padding: '4px 12px', 
                      borderRadius: '4px',
                      color: 'white',
                      fontWeight: '700'
                    }}>{activePlayer.wissenId}</span>
                    <span style={{ 
                      fontSize: '0.9rem', 
                      background: 'rgba(255,255,255,0.05)', 
                      color: getSkillBadgeColor(activePlayer.skillLevel),
                      border: `1px solid ${getSkillBadgeColor(activePlayer.skillLevel)}33`,
                      padding: '3px 12px', 
                      borderRadius: '4px',
                      fontWeight: '700',
                      textTransform: 'uppercase'
                    }}>{activePlayer.skillLevel}</span>
                  </div>
 
                  <h3 style={{ fontSize: '2.8rem', fontWeight: '800', color: 'white', marginTop: '8px', lineHeight: '1.1' }}>
                    {activePlayer.fullName}
                  </h3>
 
                  <div style={{ display: 'flex', gap: '20px', marginTop: '12px', color: 'var(--color-text-muted)', fontSize: '1rem', flexWrap: 'wrap' }}>
                    <span>Gender: <strong style={{ color: 'white' }}>{activePlayer.gender}</strong></span>
                    <span>&bull;</span>
                    <span>Experience: <strong style={{ color: 'white' }}>{activePlayer.yearsOfExperience !== null && activePlayer.yearsOfExperience !== undefined && activePlayer.yearsOfExperience !== '' ? `${activePlayer.yearsOfExperience} Year${String(activePlayer.yearsOfExperience) !== '1' ? 's' : ''}` : '-'}</strong></span>
                    <span>&bull;</span>
                    <span>Email: <strong style={{ color: 'white' }}>{activePlayer.email}</strong></span>
                  </div>
 
                  {activePlayer.stats && (
                    <div style={{ display: 'flex', gap: '20px', marginTop: '12px', background: 'rgba(255,255,255,0.02)', padding: '10px 16px', borderRadius: '8px', border: '1px solid var(--border-color)', width: 'fit-content' }}>
                      <div><span style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Matches Played</span><div style={{ fontWeight: '700', fontSize: '1.2rem', color: 'white' }}>{activePlayer.stats.matchesPlayed}</div></div>
                      <div><span style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Won</span><div style={{ fontWeight: '700', fontSize: '1.2rem', color: 'var(--color-success)' }}>{activePlayer.stats.matchesWon}</div></div>
                      <div><span style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Lost</span><div style={{ fontWeight: '700', fontSize: '1.2rem', color: 'var(--color-danger)' }}>{activePlayer.stats.matchesLost}</div></div>
                    </div>
                  )}
                </div>
              </div>
 
              {/* Bidding Grid */}
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', 
                gap: '20px', 
                marginTop: '24px',
                paddingTop: '20px',
                borderTop: '1px solid var(--border-color)'
              }}>
                {/* Base price card */}
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px 20px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                  <span style={{ fontSize: '0.9rem', textTransform: 'uppercase', color: 'var(--color-text-muted)', fontWeight: '600' }}>Base Price</span>
                  <div style={{ fontSize: '2rem', fontWeight: '800', color: 'white', marginTop: '4px' }}>
                    {activePlayer.basePrice.toLocaleString()} <span style={{ fontSize: '1rem', color: 'var(--color-text-muted)', fontWeight: 'normal' }}>pts</span>
                  </div>
                </div>
 
                {/* Current Bid Display */}
                <div className={animateBid ? 'animate-bid' : ''} style={{ 
                  background: 'rgba(212, 252, 52, 0.04)', 
                  padding: '16px 20px', 
                  borderRadius: '12px', 
                  border: '1px solid rgba(212, 252, 52, 0.25)',
                  transition: 'all 0.1s ease'
                }}>
                  <span style={{ fontSize: '0.9rem', textTransform: 'uppercase', color: 'var(--color-primary)', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <TrendingUp size={14} />
                    Current Bid
                  </span>
                  <div style={{ fontSize: '2.6rem', fontWeight: '900', color: 'var(--color-primary)', marginTop: '2px', fontFamily: 'var(--font-display)' }}>
                    {currentBid.toLocaleString()} <span style={{ fontSize: '1.1rem', color: 'var(--color-text-muted)', fontWeight: 'normal' }}>pts</span>
                  </div>
                </div>
              </div>
 
              {/* Bidding Error Message */}
              {biddingError && (
                <div style={{ marginTop: '20px', padding: '12px 16px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444', borderRadius: '8px', fontSize: '0.85rem' }}>
                  {biddingError}
                </div>
              )}
 
              {/* Action Buttons (Admin Only) */}
              {role === 'admin' ? (
                <div style={{ marginTop: '24px' }}>
                  <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
                    <button
                      onClick={() => handleBidSubmit(500)}
                      className="btn btn-secondary"
                      style={{
                        flex: 1,
                        padding: '14px 20px',
                        fontSize: '1.25rem',
                        background: 'rgba(212, 252, 52, 0.1)',
                        borderColor: 'var(--color-primary)',
                        color: 'var(--color-primary)',
                        fontWeight: '700'
                      }}
                    >
                      + 500
                    </button>
                    <button
                      onClick={() => handleBidSubmit(1000)}
                      className="btn btn-secondary"
                      style={{
                        flex: 1,
                        padding: '14px 20px',
                        fontSize: '1.25rem',
                        background: 'rgba(139, 92, 246, 0.1)',
                        borderColor: 'rgba(139,92,246,0.5)',
                        color: '#a78bfa',
                        fontWeight: '700'
                      }}
                    >
                      + 1000
                    </button>
                  </div>
 
                  {/* Direct Controls */}
                  <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                    <button 
                      onClick={() => setShowTeamModal(true)} 
                      className="btn btn-primary"
                      disabled={currentBid < activePlayer.basePrice}
                      style={{ flex: '2 1 auto', minWidth: '180px', padding: '12px 24px', fontSize: '1.1rem' }}
                    >
                      <Check size={20} />
                      Mark Sold
                    </button>
                    
                    <button 
                      onClick={revertLastBid} 
                      className="btn btn-secondary"
                      style={{ flex: '1 1 auto', minWidth: '110px', padding: '12px 20px', fontSize: '1.1rem', borderColor: 'rgba(251, 191, 36, 0.4)', color: '#fbbf24' }}
                    >
                      ↩ Revert
                    </button>
 
                    <button 
                      onClick={passPlayer} 
                      className="btn btn-danger"
                      style={{ flex: '1 1 auto', minWidth: '110px', padding: '12px 20px', fontSize: '1.1rem' }}
                    >
                      <SkipForward size={20} />
                      Skip
                    </button>
                  </div>
                </div>
              ) : (
                /* Guest View - Read Only Notice */
                <div style={{ 
                  marginTop: '40px', 
                  padding: '16px', 
                  background: 'rgba(0, 240, 255, 0.02)', 
                  border: '1px solid rgba(0, 240, 255, 0.1)', 
                  borderRadius: '12px',
                  textAlign: 'center',
                  fontSize: '0.9rem',
                  color: 'var(--color-secondary)'
                }}>
                  Public Guest View. Bidding screen updates automatically as decisions are finalized by administrators.
                </div>
              )}
            </div>
          ) : (
            /* Finished/Empty Auction Screen */
            <div className="glass-panel" style={{ padding: '80px 40px', textAlign: 'center' }}>
              <div style={{
                width: '72px',
                height: '72px',
                borderRadius: '50%',
                background: 'rgba(16, 185, 129, 0.1)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-success)',
                marginBottom: '20px'
              }}>
                <Check size={40} />
              </div>
              <h3 style={{ fontSize: '1.8rem', color: 'white', marginBottom: '8px' }}>Auction Complete</h3>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem', maxWidth: '400px', margin: '0 auto 24px auto' }}>
                All registered draft players for the {city.toUpperCase()} league location matching the current filters have been auctioned or passed.
              </p>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                <Link to={`/dashboard/${city}/${role}/statistics`} className="btn btn-secondary" style={{ fontSize: '0.85rem' }}>
                  View Final Stats
                </Link>
                <Link to={`/dashboard/${city}/${role}/teams`} className="btn btn-secondary" style={{ fontSize: '0.85rem' }}>
                  View Rosters
                </Link>
                {role === 'admin' && passedCount > 0 && (
                  <button 
                    onClick={reAuction} 
                    className="btn btn-primary" 
                    style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    🔄 Re-Auction Passed Players ({passedCount})
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
        
        {/* Right Column: Team Roster Status Table */}
        <div style={{ flex: '0.9 1 45%', minWidth: '500px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="glass-panel" style={{ padding: '24px 30px', display: 'flex', flexDirection: 'column' }}>
            <h4 style={{ fontSize: '1.2rem', color: 'white', marginBottom: '14px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Users size={20} style={{ color: 'var(--color-primary)' }} />
              Team Roster Status ({cityTeams.length})
            </h4>
            <div className="custom-table-container" style={{ margin: 0, border: 'none', background: 'transparent' }}>
              <table className="custom-table" style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th style={{ padding: '12px 14px', fontSize: '0.88rem' }}>Team</th>
                    <th style={{ padding: '12px 14px', fontSize: '0.88rem', textAlign: 'right' }}>Purse</th>
                    <th style={{ padding: '12px 14px', fontSize: '0.88rem', textAlign: 'center' }}>Female</th>
                    <th style={{ padding: '12px 14px', fontSize: '0.88rem', textAlign: 'center' }}>Beginner</th>
                    <th style={{ padding: '12px 14px', fontSize: '0.88rem', textAlign: 'center' }}>Players</th>
                  </tr>
                </thead>
                <tbody>
                  {cityTeams.map((t) => {
                    const femaleCount = t.femalePlayers || 0;
                    const totalCount = t.totalPlayers || 0;
                    const beginnerCount = t.beginnerPlayers || 0;
                    const minFemales = businessRules.minFemales || 2;
                    const minBeginners = businessRules.minBeginners || 2;
                    const maxPlayers = businessRules.teamSizeLimit || 10;
 
                    const femaleRemaining = Math.max(0, minFemales - femaleCount);
                    const beginnerRemaining = Math.max(0, minBeginners - beginnerCount);
 
                    const requiresFemales = femaleCount < minFemales;
                    const requiresBeginners = beginnerCount < minBeginners;
 
                    const spentPurse = businessRules.purseLimit - t.purseRemaining;
                    const spentPct = (spentPurse / businessRules.purseLimit) * 100;
                    const isPurseCritical = t.purseRemaining <= 15000;
                    const isPurseWarning = t.purseRemaining > 15000 && t.purseRemaining <= 30000;
 
                    return (
                      <tr key={t.id || t.teamName}>
                        <td style={{ padding: '10px 14px', fontSize: '0.92rem', fontWeight: '700', color: t.themeColor || 'white', whiteSpace: 'nowrap' }}>
                          {t.teamName}
                        </td>
                        <td style={{ 
                          padding: '10px 14px', 
                          fontSize: '0.92rem', 
                          textAlign: 'right', 
                          fontWeight: '700',
                          color: isPurseCritical ? 'var(--color-danger)' : isPurseWarning ? 'var(--color-warning)' : 'var(--color-success)'
                        }}>
                          {t.purseRemaining.toLocaleString()}
                        </td>
                        <td style={{ padding: '10px 14px', fontSize: '0.92rem', textAlign: 'center' }}>
                          <span style={{ 
                            fontWeight: '700', 
                            color: requiresFemales ? 'var(--color-warning)' : 'var(--color-success)',
                            background: requiresFemales ? 'rgba(245, 158, 11, 0.08)' : 'rgba(16, 185, 129, 0.08)',
                            padding: '3px 10px',
                            borderRadius: '12px',
                            border: requiresFemales ? '1px solid rgba(245, 158, 11, 0.2)' : '1px solid rgba(16, 185, 129, 0.2)',
                            fontSize: '0.85rem'
                          }}>
                            {femaleCount}
                          </span>
                        </td>
                        <td style={{ padding: '10px 14px', fontSize: '0.92rem', textAlign: 'center' }}>
                          <span style={{ 
                            fontWeight: '700', 
                            color: requiresBeginners ? 'var(--color-warning)' : 'var(--color-success)',
                            background: requiresBeginners ? 'rgba(245, 158, 11, 0.08)' : 'rgba(16, 185, 129, 0.08)',
                            padding: '3px 10px',
                            borderRadius: '12px',
                            border: requiresBeginners ? '1px solid rgba(245, 158, 11, 0.2)' : '1px solid rgba(16, 185, 129, 0.2)',
                            fontSize: '0.85rem'
                          }}>
                            {beginnerCount}
                          </span>
                        </td>
                        <td style={{ padding: '10px 14px', fontSize: '0.92rem', textAlign: 'center', fontWeight: '600' }}>
                          <span style={{ color: totalCount === maxPlayers ? 'var(--color-success)' : 'white' }}>
                            {totalCount}/{maxPlayers}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                  {cityTeams.length === 0 && (
                    <tr>
                      <td colSpan="5" style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem', textAlign: 'center', padding: '20px' }}>
                        No teams registered for this city yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>

      {/* Select Team Modal */}
      {showTeamModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '1100px', width: '95%', display: 'flex', flexDirection: 'column' }}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Check size={20} style={{ color: 'var(--color-success)' }} />
                Select Team to Mark as Sold
              </h3>
              <button className="close-btn" onClick={() => setShowTeamModal(false)}>&times;</button>
            </div>
            
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '20px' }}>
              Final Price: <strong style={{ color: 'var(--color-primary)' }}>{currentBid.toLocaleString()} pts</strong>
            </p>

            <div className="hide-scrollbar" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '12px', maxHeight: '75vh', overflowY: 'auto', paddingRight: '4px' }}>
              {cityTeams.map((t) => {
                const canAfford = t.purseRemaining >= currentBid;
                const hasSpace = t.totalPlayers < businessRules.teamSizeLimit;

                // --- Compliance-aware eligibility ---
                // After buying this player, check if remaining slots can still satisfy min requirements
                const maxPlayers = businessRules.teamSizeLimit || 10;
                const minFemales = businessRules.minFemales || 2;
                const minBeginners = businessRules.minBeginners || 2;

                const isPlayerFemale = activePlayer?.gender === 'Female';
                const isPlayerBeginner = activePlayer?.skillLevel === 'Beginner';

                const newTotal = (t.totalPlayers || 0) + 1;
                const newFemales = (t.femalePlayers || 0) + (isPlayerFemale ? 1 : 0);
                const newBeginners = (t.beginnerPlayers || 0) + (isPlayerBeginner ? 1 : 0);
                const slotsLeftAfter = maxPlayers - newTotal;

                const femalesStillNeeded = Math.max(0, minFemales - newFemales);
                const beginnersStillNeeded = Math.max(0, minBeginners - newBeginners);

                // A female beginner can satisfy both quotas, so use max (not sum)
                const mandatorySlotsNeeded = Math.max(femalesStillNeeded, beginnersStillNeeded);
                const complianceFeasible = slotsLeftAfter >= mandatorySlotsNeeded;

                let blockReason = '';
                if (!canAfford) {
                  blockReason = 'Insufficient Purse';
                } else if (!hasSpace) {
                  blockReason = 'Roster Full';
                } else if (!complianceFeasible) {
                  const reasons = [];
                  if (femalesStillNeeded > 0) reasons.push(`need ${femalesStillNeeded} more female${femalesStillNeeded > 1 ? 's' : ''}`);
                  if (beginnersStillNeeded > 0) reasons.push(`need ${beginnersStillNeeded} more beginner${beginnersStillNeeded > 1 ? 's' : ''}`);
                  blockReason = `Not enough slots left (${reasons.join(', ')})`;
                }

                const isEligible = canAfford && hasSpace && complianceFeasible;
                
                return (
                  <div 
                    key={t.id} 
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isEligible) handleMarkSoldToTeam(t.id, t.teamName);
                    }}
                    style={{ 
                      padding: '16px',
                      background: 'rgba(255,255,255,0.02)',
                      border: `1px solid ${isEligible ? 'var(--border-color)' : 'rgba(239, 68, 68, 0.2)'}`,
                      borderRadius: '8px',
                      cursor: isEligible ? 'pointer' : 'not-allowed',
                      opacity: isEligible ? 1 : 0.5,
                      transition: 'all 0.2s',
                    }}
                    onMouseOver={(e) => { if(isEligible) { e.currentTarget.style.borderColor = t.themeColor || 'var(--color-primary)'; e.currentTarget.style.boxShadow = `0 0 15px ${t.themeColor || 'var(--color-primary)'}`; } }}
                    onMouseOut={(e) => { if(isEligible) { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.boxShadow = 'none'; } }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontWeight: '700', color: t.themeColor || 'white' }}>{t.teamName}</span>
                      <span style={{ fontSize: '0.8rem', color: canAfford ? 'var(--color-success)' : 'var(--color-danger)' }}>
                        {t.purseRemaining.toLocaleString()} pts
                      </span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'flex', gap: '12px' }}>
                      <span>Players: <span style={{ color: hasSpace ? 'inherit' : 'var(--color-danger)' }}>{t.totalPlayers}/{maxPlayers}</span></span>
                      <span>♀ {t.femalePlayers || 0}/{minFemales}</span>
                      <span>🟢 {t.beginnerPlayers || 0}/{minBeginners}</span>
                    </div>
                    {!isEligible && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-danger)', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        ⚠ {blockReason}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div 
          onClick={() => setToastMessage(null)}
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

export default AuctionPage;

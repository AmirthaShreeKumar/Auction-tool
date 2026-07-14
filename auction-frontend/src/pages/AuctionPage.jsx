import React, { useContext, useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import PlayerPhoto from '../components/PlayerPhoto';
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
  ArrowLeft,
  Clock,
  Feather,
  Trophy,
  ShieldAlert
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
    isLotSelected,
    setIsLotSelected,
    selectedGender,
    setSelectedGender,
    selectedSkill,
    setSelectedSkill,
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

  // Lots selection states are now persisted globally in AppContext

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


  // Filter teams by city
  const cityTeams = teams.filter(t => t.location?.toLowerCase() === city?.toLowerCase());

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
    setBiddingError('');
    const playerSold = activePlayer?.fullName;
    const amountSold = currentBid;

    const res = await markSold(teamId, (errorMsg) => {
      setToastMessage({ text: `Failed to sell ${playerSold}: ${errorMsg}`, type: 'error' });
      setTimeout(() => {
        setToastMessage(null);
      }, 5000);
    });

    if (res && !res.success) {
      setBiddingError(res.message);
    } else {
      setShowTeamModal(false);
      setToastMessage({ text: `${playerSold} sold to ${teamName} for ${amountSold.toLocaleString()} pts`, type: 'success' });
      setTimeout(() => {
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
              padding: '24px 28px',
              border: '1px solid var(--border-color)',
              boxShadow: '0 15px 40px rgba(0,0,0,0.5)',
              position: 'relative',
              overflow: 'hidden'
            }}>

              {/* Corner Watermark */}
              <Gavel size={160} style={{
                position: 'absolute',
                bottom: '-20px',
                right: '-20px',
                opacity: 0.03,
                color: 'white',
                transform: 'rotate(-25deg)',
                pointerEvents: 'none'
              }} />

              {/* Player Information Frame — photo left, details right */}
              <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>

                {/* Player Profile Photo */}
                <div style={{
                  width: '160px',
                  height: '160px',
                  flexShrink: 0,
                  borderRadius: '14px',
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.08) 100%)',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: getSkillBadgeColor(activePlayer.skillLevel),
                  overflow: 'hidden'
                }}>
                  {activePlayer.imageUrl && !imgError ? (
                    <img src={activePlayer.imageUrl} alt={activePlayer.fullName} onError={() => setImgError(true)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <PlayerPhoto playerId={activePlayer.id} playerName={activePlayer.fullName} imageUrlHash={activePlayer.imageUrlHash} size="160px" borderRadius="14px" style={{ border: 'none', background: 'transparent' }} />
                  )}
                </div>

                {/* Player details */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  {/* Name — large */}
                  <h3 style={{ fontSize: 'clamp(1.4rem, 2.2vw, 2.1rem)', fontWeight: '800', color: 'white', margin: '0 0 6px', lineHeight: '1.15', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {activePlayer.fullName}
                  </h3>

                  {/* WT-ID + Skill badge */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                    <span style={{
                      fontSize: '0.78rem',
                      background: 'rgba(255,255,255,0.08)',
                      padding: '3px 10px',
                      borderRadius: '5px',
                      color: 'white',
                      fontWeight: '700',
                      letterSpacing: '0.5px'
                    }}>{activePlayer.wissenId}</span>
                    <span style={{
                      fontSize: '0.78rem',
                      background: `${getSkillBadgeColor(activePlayer.skillLevel)}18`,
                      color: getSkillBadgeColor(activePlayer.skillLevel),
                      border: `1px solid ${getSkillBadgeColor(activePlayer.skillLevel)}55`,
                      padding: '3px 10px',
                      borderRadius: '5px',
                      fontWeight: '700',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>{activePlayer.skillLevel}</span>
                  </div>

                  {/* Gender — own line with icon */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '7px', color: 'var(--color-text-muted)', fontSize: '0.85rem', marginBottom: '5px' }}>
                    <User size={13} style={{ flexShrink: 0, opacity: 0.7 }} />
                    <span>Gender: <strong style={{ color: 'white' }}>{activePlayer.gender}</strong></span>
                  </div>

                  {/* Experience — own line with icon */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '7px', color: 'var(--color-text-muted)', fontSize: '0.85rem', marginBottom: '5px' }}>
                    <Clock size={13} style={{ flexShrink: 0, opacity: 0.7 }} />
                    <span>Experience: <strong style={{ color: 'white' }}>{activePlayer.yearsOfExperience !== null && activePlayer.yearsOfExperience !== undefined && activePlayer.yearsOfExperience !== '' ? `${activePlayer.yearsOfExperience} Year${String(activePlayer.yearsOfExperience) !== '1' ? 's' : ''}` : '-'}</strong></span>
                  </div>

                </div>
              </div>

              {/* Stats Row — full width, below photo+details */}
              {activePlayer.stats && (
                <div style={{
                  display: 'flex',
                  gap: '12px',
                  marginTop: '14px',
                  padding: '12px 16px',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '10px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
                    <div style={{ width: '34px', height: '34px', borderRadius: '8px', background: 'rgba(139,92,246,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Feather size={16} style={{ color: '#a78bfa' }} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Matches Played</div>
                      <div style={{ fontSize: '1.4rem', fontWeight: '800', color: 'white', lineHeight: 1 }}>{activePlayer.stats.matchesPlayed}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
                    <div style={{ width: '34px', height: '34px', borderRadius: '8px', background: 'rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Trophy size={16} style={{ color: 'var(--color-success)' }} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Won</div>
                      <div style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--color-success)', lineHeight: 1 }}>{activePlayer.stats.matchesWon}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
                    <div style={{ width: '34px', height: '34px', borderRadius: '8px', background: 'rgba(239,68,68,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <ShieldAlert size={16} style={{ color: 'var(--color-danger)' }} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Lost</div>
                      <div style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--color-danger)', lineHeight: 1 }}>{activePlayer.stats.matchesLost}</div>
                    </div>
                  </div>
                </div>
              )}

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
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '10px 16px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                  <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--color-text-muted)', fontWeight: '600' }}>Base Price</span>
                  <div style={{ fontSize: '1.6rem', fontWeight: '800', color: 'white', marginTop: '2px' }}>
                    {activePlayer.basePrice.toLocaleString()} <span style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', fontWeight: 'normal' }}>pts</span>
                  </div>
                </div>

                {/* Current Bid Display */}
                <div className={animateBid ? 'animate-bid' : ''} style={{
                  background: 'rgba(212, 252, 52, 0.04)',
                  padding: '10px 16px',
                  borderRadius: '12px',
                  border: '1px solid rgba(212, 252, 52, 0.25)',
                  transition: 'all 0.1s ease'
                }}>
                  <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--color-primary)', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <TrendingUp size={13} />
                    Current Bid
                  </span>
                  <div style={{ fontSize: '2rem', fontWeight: '900', color: 'var(--color-primary)', marginTop: '2px', fontFamily: 'var(--font-display)' }}>
                    {currentBid.toLocaleString()} <span style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', fontWeight: 'normal' }}>pts</span>
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
        <div style={{ flex: '0.9 1 45%', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div className="custom-table-container" style={{ margin: 0, border: 'none', background: 'transparent' }}>
              <table className="custom-table" style={{ width: '100%', tableLayout: 'fixed', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,0.04)', borderBottom: '2px solid var(--color-primary)' }}>
                    <th style={{ padding: '9px 10px 10px', fontSize: '0.82rem', letterSpacing: '0.09em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.85)', fontWeight: '800', width: '40%', textAlign: 'left' }}>Team</th>
                    <th style={{ padding: '9px 8px 10px', fontSize: '0.82rem', letterSpacing: '0.09em', textTransform: 'uppercase', color: 'var(--color-primary)', fontWeight: '800', width: '20%', textAlign: 'right' }}>Purse</th>
                    <th style={{ padding: '9px 4px 10px', fontSize: '0.82rem', letterSpacing: '0.09em', textTransform: 'uppercase', color: 'var(--color-success)', fontWeight: '800', width: '13%', textAlign: 'center' }}>F</th>
                    <th style={{ padding: '9px 4px 10px', fontSize: '0.82rem', letterSpacing: '0.09em', textTransform: 'uppercase', color: '#f59e0b', fontWeight: '800', width: '13%', textAlign: 'center' }}>B</th>
                    <th style={{ padding: '9px 4px 10px', fontSize: '0.82rem', letterSpacing: '0.09em', textTransform: 'uppercase', color: 'var(--color-secondary)', fontWeight: '800', width: '14%', textAlign: 'center' }}>T</th>
                  </tr>
                </thead>
                <tbody>
                  {cityTeams.map((t, idx) => {
                    const femaleCount = t.femalePlayers || 0;
                    const totalCount = t.totalPlayers || 0;
                    const beginnerCount = t.beginnerPlayers || 0;
                    const minFemales = businessRules.minFemales || 2;
                    const minBeginners = businessRules.minBeginners || 2;
                    const maxPlayers = businessRules.teamSizeLimit || 12;

                    const requiresFemales = femaleCount < minFemales;
                    const requiresBeginners = beginnerCount < minBeginners;

                    const isPurseCritical = t.purseRemaining <= 15000;
                    const isPurseWarning = t.purseRemaining > 15000 && t.purseRemaining <= 30000;

                    const purseK = t.purseRemaining >= 1000
                      ? `${Number((t.purseRemaining / 1000).toFixed(2))}K`
                      : t.purseRemaining.toString();

                    return (
                      <tr key={t.id || t.teamName} style={{ background: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}>
                        <td style={{ padding: '7px 10px', fontSize: '1rem', fontWeight: '700', color: t.themeColor || 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {t.teamName}
                        </td>
                        <td style={{
                          padding: '7px 8px',
                          fontSize: '1rem',
                          textAlign: 'right',
                          fontWeight: '700',
                          color: isPurseCritical ? 'var(--color-danger)' : isPurseWarning ? 'var(--color-warning)' : 'var(--color-success)'
                        }}>
                          {purseK}
                        </td>
                        <td style={{ padding: '7px 4px', textAlign: 'center' }}>
                          <span style={{
                            display: 'inline-block',
                            minWidth: '26px',
                            fontWeight: '700',
                            fontSize: '1rem',
                            color: requiresFemales ? 'var(--color-warning)' : 'var(--color-success)',
                            background: requiresFemales ? 'rgba(245,158,11,0.1)' : 'rgba(16,185,129,0.1)',
                            padding: '1px 6px',
                            borderRadius: '10px',
                            border: requiresFemales ? '1px solid rgba(245,158,11,0.25)' : '1px solid rgba(16,185,129,0.25)',
                          }}>
                            {femaleCount}
                          </span>
                        </td>
                        <td style={{ padding: '7px 4px', textAlign: 'center' }}>
                          <span style={{
                            display: 'inline-block',
                            minWidth: '26px',
                            fontWeight: '700',
                            fontSize: '1rem',
                            color: requiresBeginners ? 'var(--color-warning)' : 'var(--color-success)',
                            background: requiresBeginners ? 'rgba(245,158,11,0.1)' : 'rgba(16,185,129,0.1)',
                            padding: '1px 6px',
                            borderRadius: '10px',
                            border: requiresBeginners ? '1px solid rgba(245,158,11,0.25)' : '1px solid rgba(16,185,129,0.25)',
                          }}>
                            {beginnerCount}
                          </span>
                        </td>
                        <td style={{ padding: '7px 4px', fontSize: '1rem', textAlign: 'center', fontWeight: '600', color: totalCount === maxPlayers ? 'var(--color-success)' : 'white' }}>
                          {totalCount}/{maxPlayers}
                        </td>
                      </tr>
                    );
                  })}
                  {cityTeams.length === 0 && (
                    <tr>
                      <td colSpan="5" style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '20px' }}>
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
                const maxPlayers = businessRules.teamSizeLimit || 12;
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
                    onMouseOver={(e) => { if (isEligible) { e.currentTarget.style.borderColor = t.themeColor || 'var(--color-primary)'; e.currentTarget.style.boxShadow = `0 0 15px ${t.themeColor || 'var(--color-primary)'}`; } }}
                    onMouseOut={(e) => { if (isEligible) { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.boxShadow = 'none'; } }}
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

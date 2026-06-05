import React, { useContext, useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
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
  PlayCircle
} from 'lucide-react';

const AuctionPage = () => {
  const { city, role } = useParams();
  const { 
    teams, 
    activePlayer, 
    currentBid, 
    highestBidderTeam, 
    auctionQueue, 
    currentAuctionIndex,
    increaseBid, 
    passPlayer, 
    markSold, 
    nextPlayer,
    businessRules
  } = useContext(AppContext);

  // Trigger bid flash animation
  const [animateBid, setAnimateBid] = useState(false);
  const [biddingError, setBiddingError] = useState('');

  useEffect(() => {
    if (currentBid > 0) {
      setAnimateBid(true);
      const timer = setTimeout(() => setAnimateBid(false), 300);
      return () => clearTimeout(timer);
    }
  }, [currentBid]);

  // Reset error when player changes
  useEffect(() => {
    setBiddingError('');
  }, [activePlayer]);

  // Filter teams by city
  const cityTeams = teams.filter(t => t.location.toLowerCase() === city.toLowerCase());

  const handleBidSubmit = (teamName) => {
    setBiddingError('');
    const res = increaseBid(teamName);
    if (res && !res.success) {
      setBiddingError(res.message);
    }
  };

  const handleMarkSold = () => {
    setBiddingError('');
    const res = markSold();
    if (res && !res.success) {
      setBiddingError(res.message);
    } else {
      alert(`Player successfully sold to ${highestBidderTeam}!`);
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

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h2 className="page-title">Live Auction Board</h2>
          <p className="page-subtitle">Interactive player draft system for {city.toUpperCase()} location.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(212, 252, 52, 0.1)', padding: '6px 14px', borderRadius: '8px', border: '1px solid rgba(212, 252, 52, 0.2)' }}>
          <PlayCircle size={16} style={{ color: 'var(--color-primary)' }} />
          <span style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--color-primary)', textTransform: 'uppercase' }}>
            Queue Status: {auctionQueue.length} Players Left
          </span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '30px' }}>
        
        {/* Main Auction Player Frame */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {activePlayer ? (
            <div className="glass-panel" style={{ 
              padding: '40px', 
              border: '1px solid var(--border-color)', 
              boxShadow: '0 15px 40px rgba(0,0,0,0.5)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              
              {/* Corner Watermark */}
              <Gavel size={180} style={{ 
                position: 'absolute', 
                bottom: '-20px', 
                right: '-20px', 
                opacity: 0.03, 
                color: 'white',
                transform: 'rotate(-25deg)'
              }} />

              {/* Player Information Frame */}
              <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap' }}>
                
                {/* Player Profile Photo Placeholder */}
                <div style={{ 
                  width: '120px', 
                  height: '120px', 
                  borderRadius: '24px', 
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.08) 100%)',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: getSkillBadgeColor(activePlayer.skillLevel),
                  boxShadow: `0 0 20px rgba(255,255,255,0.02)`
                }}>
                  <User size={64} />
                </div>

                {/* Player details */}
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                    <span style={{ 
                      fontSize: '0.8rem', 
                      background: 'rgba(255,255,255,0.06)', 
                      padding: '4px 10px', 
                      borderRadius: '4px',
                      color: 'white',
                      fontWeight: '700'
                    }}>{activePlayer.wissenId}</span>
                    <span style={{ 
                      fontSize: '0.8rem', 
                      background: `rgba(255,255,255,0.05)`, 
                      color: getSkillBadgeColor(activePlayer.skillLevel),
                      border: `1px solid ${getSkillBadgeColor(activePlayer.skillLevel)}33`,
                      padding: '3px 10px', 
                      borderRadius: '4px',
                      fontWeight: '700',
                      textTransform: 'uppercase'
                    }}>{activePlayer.skillLevel}</span>
                  </div>

                  <h3 style={{ fontSize: '2.5rem', fontWeight: '800', color: 'white', marginTop: '12px', lineHeight: '1.1' }}>
                    {activePlayer.fullName}
                  </h3>

                  <div style={{ display: 'flex', gap: '20px', marginTop: '12px', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                    <span>Gender: <strong style={{ color: 'white' }}>{activePlayer.gender}</strong></span>
                    <span>&bull;</span>
                    <span>Experience: <strong style={{ color: 'white' }}>{activePlayer.yearsOfExperience} Year{activePlayer.yearsOfExperience !== 1 ? 's' : ''}</strong></span>
                    <span>&bull;</span>
                    <span>Email: <strong style={{ color: 'white' }}>{activePlayer.email}</strong></span>
                  </div>
                </div>
              </div>

              {/* Bidding Grid */}
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                gap: '24px', 
                marginTop: '40px',
                paddingTop: '30px',
                borderTop: '1px solid var(--border-color)'
              }}>
                {/* Base price card */}
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                  <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--color-text-muted)', fontWeight: '600' }}>Base Price</span>
                  <div style={{ fontSize: '1.8rem', fontWeight: '800', color: 'white', marginTop: '4px' }}>
                    {activePlayer.basePrice.toLocaleString()} <span style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', fontWeight: 'normal' }}>pts</span>
                  </div>
                </div>

                {/* Current Bid Display */}
                <div className={animateBid ? 'animate-bid' : ''} style={{ 
                  background: 'rgba(212, 252, 52, 0.04)', 
                  padding: '20px', 
                  borderRadius: '12px', 
                  border: '1px solid rgba(212, 252, 52, 0.25)',
                  transition: 'all 0.1s ease'
                }}>
                  <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--color-primary)', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <TrendingUp size={12} />
                    Current Bid
                  </span>
                  <div style={{ fontSize: '2.2rem', fontWeight: '900', color: 'var(--color-primary)', marginTop: '2px', fontFamily: 'var(--font-display)' }}>
                    {currentBid.toLocaleString()} <span style={{ fontSize: '1rem', color: 'var(--color-text-muted)', fontWeight: 'normal' }}>pts</span>
                  </div>
                </div>

                {/* Highest Bidder Display */}
                <div style={{ background: 'rgba(0, 240, 255, 0.04)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(0, 240, 255, 0.2)' }}>
                  <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--color-secondary)', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Award size={12} />
                    Highest Bidder
                  </span>
                  <div style={{ fontSize: '1.5rem', fontWeight: '800', color: 'white', marginTop: '8px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {highestBidderTeam ? highestBidderTeam : (
                      <span style={{ color: 'var(--color-text-muted)', fontWeight: 'normal', fontSize: '1rem' }}>No Bids Yet</span>
                    )}
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
                <div style={{ marginTop: '40px' }}>
                  {/* Select Team to Bid button row */}
                  <div style={{ marginBottom: '24px' }}>
                    <span className="form-label" style={{ marginBottom: '10px' }}>Simulate Bid On Behalf of Team:</span>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                      {cityTeams.map((t) => {
                        const canBid = t.purseRemaining >= (highestBidderTeam ? currentBid + businessRules.bidIncrement : activePlayer.basePrice) 
                                      && t.totalPlayers < businessRules.teamSizeLimit;
                        return (
                          <button
                            key={t.teamName}
                            onClick={() => handleBidSubmit(t.teamName)}
                            className="btn btn-secondary"
                            disabled={!canBid}
                            style={{
                              padding: '8px 14px',
                              fontSize: '0.8rem',
                              background: highestBidderTeam === t.teamName ? 'rgba(212, 252, 52, 0.15)' : 'rgba(255,255,255,0.02)',
                              borderColor: highestBidderTeam === t.teamName ? 'var(--color-primary)' : 'var(--border-color)',
                              color: highestBidderTeam === t.teamName ? 'var(--color-primary)' : 'white'
                            }}
                          >
                            Bid for {t.teamName} (+500)
                          </button>
                        );
                      })}
                      {cityTeams.length === 0 && (
                        <div style={{ color: 'var(--color-warning)', fontSize: '0.85rem' }}>
                          Warning: You must create at least one team under the "Teams" tab to simulate bids.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Direct Controls */}
                  <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
                    <button 
                      onClick={handleMarkSold} 
                      className="btn btn-primary"
                      disabled={!highestBidderTeam}
                      style={{ flex: '2 1 auto', minWidth: '150px' }}
                    >
                      <Check size={18} />
                      Mark Sold
                    </button>
                    
                    <button 
                      onClick={passPlayer} 
                      className="btn btn-danger"
                      style={{ flex: '1 1 auto', minWidth: '100px' }}
                    >
                      <XSquare size={18} />
                      Pass
                    </button>

                    <button 
                      onClick={nextPlayer} 
                      className="btn btn-secondary"
                      style={{ flex: '1 1 auto', minWidth: '100px', display: 'flex', gap: '6px' }}
                    >
                      Skip / Next
                      <ArrowRight size={18} />
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
                All registered draft players for the {city.toUpperCase()} league location have been auctioned or passed.
              </p>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                <Link to={`/dashboard/${city}/${role}/statistics`} className="btn btn-secondary" style={{ fontSize: '0.85rem' }}>
                  View Final Stats
                </Link>
                <Link to={`/dashboard/${city}/${role}/teams`} className="btn btn-secondary" style={{ fontSize: '0.85rem' }}>
                  View Rosters
                </Link>
              </div>
            </div>
          )}

          {/* Business Rules Quick Recap */}
          <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '12px', borderLeft: '3px solid var(--color-secondary)' }}>
            <Coins size={20} style={{ color: 'var(--color-secondary)' }} />
            <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', lineHeight: '1.4' }}>
              <strong>Bid Increment:</strong> Standard raises add <strong>500 points</strong>. Players will not be marked sold until at least one team places a valid bid matching or exceeding the player's base price.
            </div>
          </div>
        </div>

        {/* Sidebar: Upcoming Draft Queue */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', height: '100%', maxHeight: '600px' }}>
            <h4 style={{ fontSize: '0.95rem', color: 'white', marginBottom: '14px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Users size={16} style={{ color: 'var(--color-primary)' }} />
              Draft Order ({auctionQueue.length})
            </h4>

            {/* List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', overflowY: 'auto', flex: 1, paddingRight: '4px' }}>
              {auctionQueue.map((p, idx) => {
                const isActive = idx === currentAuctionIndex;
                const isPassed = p.status === 'passed';
                
                let borderColor = 'var(--border-color)';
                let background = 'rgba(255,255,255,0.01)';
                if (isActive) {
                  borderColor = 'var(--color-primary)';
                  background = 'rgba(212, 252, 52, 0.05)';
                } else if (isPassed) {
                  borderColor = 'rgba(239, 68, 68, 0.15)';
                }

                return (
                  <div key={p.id} style={{ 
                    padding: '10px 12px', 
                    borderRadius: '8px', 
                    border: `1px solid ${borderColor}`,
                    background,
                    display: 'flex',
                    flexDirection: 'column',
                    fontSize: '0.8rem',
                    transition: 'all 0.2s'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: isActive ? '700' : '600', color: isActive ? 'var(--color-primary)' : 'white' }}>
                        {idx + 1}. {p.fullName}
                      </span>
                      <span style={{
                        fontSize: '0.7rem',
                        color: getSkillBadgeColor(p.skillLevel),
                        fontWeight: '700',
                        textTransform: 'uppercase'
                      }}>{p.skillLevel}</span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                      <span>Base: {p.basePrice.toLocaleString()}</span>
                      {isPassed ? (
                        <span style={{ color: 'var(--color-danger)', fontWeight: '600' }}>Passed</span>
                      ) : isActive ? (
                        <span style={{ color: 'var(--color-primary)', fontWeight: '700' }}>Bidding</span>
                      ) : (
                        <span>Pending</span>
                      )}
                    </div>
                  </div>
                );
              })}

              {auctionQueue.length === 0 && (
                <div style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem', textAlign: 'center', padding: '20px' }}>
                  No pending players.
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AuctionPage;

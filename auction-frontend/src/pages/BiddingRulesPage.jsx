import React from 'react';

const BiddingRulesPage = () => {
  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h2 className="page-title">Bidding Rules</h2>
          <p className="page-subtitle">Guidelines and constraints for the auction process</p>
        </div>
      </div>
      
      <div className="glass-panel" style={{ padding: '30px' }}>
        <h3 style={{ marginBottom: '20px', color: 'var(--color-primary)', fontFamily: 'var(--font-display)' }}>Auction Guidelines</h3>
        <ul style={{ listStyleType: 'disc', paddingLeft: '20px', color: 'var(--color-text-main)', display: 'flex', flexDirection: 'column', gap: '15px', fontSize: '1.05rem' }}>
          <li><strong style={{ color: 'white' }}>Purse:</strong> 100K Points limit per team</li>
          <li><strong style={{ color: 'white' }}>Size:</strong> Maximum 10 Players per team</li>
          <li><strong style={{ color: 'white' }}>Min 2 Beginner:</strong> Each team must acquire at least 2 beginner level players</li>
          <li><strong style={{ color: 'white' }}>Min 2 Female:</strong> Each team must acquire at least 2 female players</li>
          <li><strong style={{ color: 'white' }}>Bid Increments:</strong> Bids will increment by +500 or +1000</li>
        </ul>
      </div>
    </div>
  );
};

export default BiddingRulesPage;

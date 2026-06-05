import React, { useContext } from 'react';
import { useParams } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import { 
  BarChart3, 
  Users, 
  Coins, 
  User, 
  Award,
  Sparkles,
  TrendingUp,
  Percent
} from 'lucide-react';

const StatisticsPage = () => {
  const { city } = useParams();
  const { players, teams, businessRules } = useContext(AppContext);

  // Capitalize city
  const capitalize = (str) => {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  // Filter based on city
  const cityPlayers = players.filter(p => p.location.toLowerCase() === city.toLowerCase());
  const cityTeams = teams.filter(t => t.location.toLowerCase() === city.toLowerCase());

  // Statistics Calculations
  const totalPlayers = cityPlayers.length;
  const soldPlayers = cityPlayers.filter(p => p.status === 'sold');
  const soldPlayersCount = soldPlayers.length;
  
  // Female statistics
  const femaleTotal = cityPlayers.filter(p => p.gender.toLowerCase() === 'female').length;
  const femaleSold = soldPlayers.filter(p => p.gender.toLowerCase() === 'female').length;

  // Beginner statistics
  const beginnerTotal = cityPlayers.filter(p => p.skillLevel.toLowerCase() === 'beginner').length;
  const beginnerSold = soldPlayers.filter(p => p.skillLevel.toLowerCase() === 'beginner').length;

  // Skill distributions
  const skillsCount = {
    Beginner: cityPlayers.filter(p => p.skillLevel === 'Beginner').length,
    Intermediate: cityPlayers.filter(p => p.skillLevel === 'Intermediate').length,
    Advanced: cityPlayers.filter(p => p.skillLevel === 'Advanced').length,
  };

  const skillsSold = {
    Beginner: soldPlayers.filter(p => p.skillLevel === 'Beginner').length,
    Intermediate: soldPlayers.filter(p => p.skillLevel === 'Intermediate').length,
    Advanced: soldPlayers.filter(p => p.skillLevel === 'Advanced').length,
  };

  // Purse allocations
  const totalTeams = cityTeams.length;
  const totalPurseAllocated = totalTeams * businessRules.purseLimit;
  const totalPurseRemaining = cityTeams.reduce((sum, t) => sum + t.purseRemaining, 0);
  const totalPurseSpent = totalPurseAllocated - totalPurseRemaining;

  // Percentage Calculations
  const femalePercent = totalPlayers > 0 ? Math.round((femaleTotal / totalPlayers) * 100) : 0;
  const beginnerPercent = totalPlayers > 0 ? Math.round((beginnerTotal / totalPlayers) * 100) : 0;
  
  const skillMaxCount = Math.max(skillsCount.Beginner, skillsCount.Intermediate, skillsCount.Advanced, 1);

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h2 className="page-title">League Statistics</h2>
          <p className="page-subtitle">Real-time analytical graphs and compliance metrics for {capitalize(city)} location.</p>
        </div>
      </div>

      {/* Stats Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        
        {/* Card 1: Female Ratio */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Female Representation</span>
            <User size={20} style={{ color: 'var(--color-secondary)' }} />
          </div>
          <span style={{ fontSize: '1.8rem', fontWeight: '800', color: 'white' }}>
            {femaleTotal} <span style={{ fontSize: '1rem', color: 'var(--color-text-muted)', fontWeight: 'normal' }}>({femalePercent}%)</span>
          </span>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-success)', marginTop: '8px' }}>
            {femaleSold} / {femaleTotal} Sold in draft
          </span>
        </div>

        {/* Card 2: Beginner Count */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Beginner Draft Pool</span>
            <Award size={20} style={{ color: 'var(--color-primary)' }} />
          </div>
          <span style={{ fontSize: '1.8rem', fontWeight: '800', color: 'white' }}>
            {beginnerTotal} <span style={{ fontSize: '1rem', color: 'var(--color-text-muted)', fontWeight: 'normal' }}>({beginnerPercent}%)</span>
          </span>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-success)', marginTop: '8px' }}>
            {beginnerSold} / {beginnerTotal} Sold in draft
          </span>
        </div>

        {/* Card 3: Purse Remaining */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Purse Remaining</span>
            <Coins size={20} style={{ color: 'var(--color-secondary)' }} />
          </div>
          <span style={{ fontSize: '1.8rem', fontWeight: '800', color: 'white' }}>
            {totalPurseRemaining.toLocaleString()}
          </span>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '8px' }}>
            Out of {totalPurseAllocated.toLocaleString()} allocated pts
          </span>
        </div>

        {/* Card 4: Average Auction price */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Avg Player Price</span>
            <TrendingUp size={20} style={{ color: 'var(--color-accent)' }} />
          </div>
          <span style={{ fontSize: '1.8rem', fontWeight: '800', color: 'white' }}>
            {soldPlayersCount > 0 
              ? Math.round(totalPurseSpent / soldPlayersCount).toLocaleString() 
              : '0'
            } <span style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', fontWeight: 'normal' }}>pts</span>
          </span>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '8px' }}>
            Calculated across {soldPlayersCount} sold
          </span>
        </div>
      </div>

      {/* SVG Charts Area */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '30px' }}>
        
        {/* Skill level Distribution Chart */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.1rem', color: 'white', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BarChart3 size={18} style={{ color: 'var(--color-primary)' }} />
            Players distribution by Skill level
          </h3>

          {/* Custom SVG Bar Chart */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {['Beginner', 'Intermediate', 'Advanced'].map((skill) => {
              const total = skillsCount[skill];
              const sold = skillsSold[skill];
              const unsold = total - sold;
              const widthPct = (total / skillMaxCount) * 100;
              const soldWidthPct = total > 0 ? (sold / total) * 100 : 0;

              let barColor = 'var(--color-secondary)';
              if (skill === 'Intermediate') barColor = 'var(--color-warning)';
              if (skill === 'Advanced') barColor = 'var(--color-accent)';

              return (
                <div key={skill}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '6px' }}>
                    <span style={{ fontWeight: '600' }}>{skill} ({total})</span>
                    <span style={{ color: 'var(--color-text-muted)' }}>
                      Sold: <strong style={{ color: 'white' }}>{sold}</strong> &bull; Unsold: <strong style={{ color: 'white' }}>{unsold}</strong>
                    </span>
                  </div>

                  <div style={{ 
                    width: '100%', 
                    height: '18px', 
                    background: 'rgba(255, 255, 255, 0.03)', 
                    borderRadius: '4px', 
                    overflow: 'hidden',
                    border: '1px solid var(--border-color)',
                    position: 'relative'
                  }}>
                    {/* Total bar container */}
                    <div style={{
                      width: `${widthPct}%`,
                      height: '100%',
                      background: 'rgba(255,255,255,0.05)',
                      position: 'absolute',
                      left: 0,
                      top: 0
                    }}>
                      {/* Sold inner bar */}
                      <div style={{
                        width: `${soldWidthPct}%`,
                        height: '100%',
                        background: barColor,
                        borderRadius: '3px',
                        transition: 'width 0.4s ease'
                      }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ marginTop: '24px', fontSize: '0.8rem', color: 'var(--color-text-muted)', background: 'rgba(255,255,255,0.01)', padding: '10px', borderRadius: '6px', border: '1px dashed var(--border-color)' }}>
            <strong>Guide:</strong> Bright solid colors show players that have been <strong>Sold</strong>, while the darker segments within each tier represent <strong>Unsold / Remaining</strong> players.
          </div>
        </div>

        {/* Gender Balance Breakdown */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '1.1rem', color: 'white', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Users size={18} style={{ color: 'var(--color-secondary)' }} />
            Gender Ratio Analysis
          </h3>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', flex: 1, padding: '10px 0' }}>
            {/* SVG Donut Chart */}
            <div style={{ position: 'relative', width: '120px', height: '120px' }}>
              <svg width="100%" height="100%" viewBox="0 0 42 42" className="donut">
                <circle className="donut-hole" cx="21" cy="21" r="15.91549430918954" fill="transparent"></circle>
                {/* Background Track */}
                <circle className="donut-ring" cx="21" cy="21" r="15.91549430918954" fill="transparent" stroke="rgba(255,255,255,0.03)" strokeWidth="4"></circle>
                
                {/* Female Arc Segment (Cyan) */}
                <circle 
                  className="donut-segment" 
                  cx="21" 
                  cy="21" 
                  r="15.91549430918954" 
                  fill="transparent" 
                  stroke="var(--color-secondary)" 
                  strokeWidth="4.2" 
                  strokeDasharray={`${femalePercent} ${100 - femalePercent}`} 
                  strokeDashoffset="25"
                  style={{ transition: 'stroke-dasharray 0.5s ease' }}
                ></circle>
              </svg>
              {/* Donut Center Percent */}
              <div style={{ 
                position: 'absolute', 
                top: 0, 
                left: 0, 
                right: 0, 
                bottom: 0, 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'center' 
              }}>
                <span style={{ fontSize: '1.4rem', fontWeight: '800', color: 'white' }}>{femalePercent}%</span>
                <span style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Female</span>
              </div>
            </div>

            {/* Labels */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
                  <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: 'var(--color-secondary)' }} />
                  <span style={{ fontWeight: '600' }}>Female Pool: {femaleTotal}</span>
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginLeft: '20px' }}>({femalePercent}% of total)</span>
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
                  <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: 'rgba(255, 255, 255, 0.2)' }} />
                  <span style={{ fontWeight: '600' }}>Male Pool: {totalPlayers - femaleTotal}</span>
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginLeft: '20px' }}>({100 - femalePercent}% of total)</span>
              </div>
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px', marginTop: '16px', fontSize: '0.8rem', display: 'flex', justifyContent: 'space-between', color: 'var(--color-text-muted)' }}>
            <span>Total City Franchises: {totalTeams}</span>
            <span>Required females per team: 2</span>
          </div>
        </div>

      </div>
    </div>
  );
};

export default StatisticsPage;

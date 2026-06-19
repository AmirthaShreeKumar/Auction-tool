import React, { useContext, useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import { apiFetch } from '../api/api';
import { 
  BarChart3, 
  Users, 
  Coins, 
  User, 
  Award,
  Sparkles,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  Filter
} from 'lucide-react';

const StatisticsPage = () => {
  const { city } = useParams();
  const { players, teams, businessRules, refreshPlayers, refreshTeams } = useContext(AppContext);

  const [bidHistory, setBidHistory] = useState([]);
  const [loadingBids, setLoadingBids] = useState(true);

  // Player Stats Filter State
  const [playerSkillFilter, setPlayerSkillFilter] = useState('All');
  const [playerGenderFilter, setPlayerGenderFilter] = useState('All');
  const [playerTeamFilter, setPlayerTeamFilter] = useState('All');
  const [showAllPlayers, setShowAllPlayers] = useState(false);

  // Team Stats State
  const [showAllTeams, setShowAllTeams] = useState(false);

  // Team Stats Filter State
  const [teamSkillFilter, setTeamSkillFilter] = useState('All');
  const [teamGenderFilter, setTeamGenderFilter] = useState('All');
  const [teamNameFilter, setTeamNameFilter] = useState('All');

  // Sorting State for Player Stats
  const [playerSortField, setPlayerSortField] = useState('soldPrice');
  const [playerSortOrder, setPlayerSortOrder] = useState('desc');

  // Sorting State for Team Stats
  const [teamSortField, setTeamSortField] = useState('amountSpent');
  const [teamSortOrder, setTeamSortOrder] = useState('desc');

  const handlePlayerSort = (field) => {
    if (playerSortField === field) {
      setPlayerSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setPlayerSortField(field);
      setPlayerSortOrder(field === 'fullName' || field === 'skillLevel' || field === 'gender' || field === 'soldTeam' ? 'asc' : 'desc');
    }
  };

  const handleTeamSort = (field) => {
    if (teamSortField === field) {
      setTeamSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setTeamSortField(field);
      setTeamSortOrder(field === 'teamName' ? 'asc' : 'desc');
    }
  };

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setLoadingBids(true);
        if (refreshPlayers) await refreshPlayers();
        if (refreshTeams) await refreshTeams();
        const data = await apiFetch(`/api/${city}/auction/bids`);
        setBidHistory(data || []);
      } catch (err) {
        console.error('Failed to load statistics data:', err);
      } finally {
        setLoadingBids(false);
      }
    };
    if (city) {
      fetchAllData();
    }
  }, [city, refreshPlayers, refreshTeams]);

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
  const soldPlayers = cityPlayers.filter(p => p.status === 'SOLD');
  const soldPlayersCount = soldPlayers.length;
  
  // Female statistics
  const femaleTotal = cityPlayers.filter(p => p.gender?.toLowerCase() === 'female').length;
  const femaleSold = soldPlayers.filter(p => p.gender?.toLowerCase() === 'female').length;

  // Beginner statistics
  const beginnerTotal = cityPlayers.filter(p => p.skillLevel?.toLowerCase() === 'beginner').length;
  const beginnerSold = soldPlayers.filter(p => p.skillLevel?.toLowerCase() === 'beginner').length;

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

  // Memoized Sorted Players List
  const sortedPlayersList = useMemo(() => {
    const filtered = soldPlayers
      .filter(p => playerSkillFilter === 'All' || p.skillLevel?.toLowerCase() === playerSkillFilter.toLowerCase())
      .filter(p => playerGenderFilter === 'All' || p.gender?.toLowerCase() === playerGenderFilter.toLowerCase())
      .filter(p => playerTeamFilter === 'All' || p.soldTeam === playerTeamFilter);

    return [...filtered].sort((a, b) => {
      let valA = a[playerSortField];
      let valB = b[playerSortField];

      if (valA === undefined || valA === null) valA = '';
      if (valB === undefined || valB === null) valB = '';

      if (playerSortField === 'soldPrice') {
        const numA = Number(valA) || 0;
        const numB = Number(valB) || 0;
        return playerSortOrder === 'asc' ? numA - numB : numB - numA;
      }

      const strA = String(valA).toLowerCase();
      const strB = String(valB).toLowerCase();
      if (strA < strB) return playerSortOrder === 'asc' ? -1 : 1;
      if (strA > strB) return playerSortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [soldPlayers, playerSkillFilter, playerGenderFilter, playerTeamFilter, playerSortField, playerSortOrder]);

  // Memoized Sorted Teams List
  const sortedTeamsList = useMemo(() => {
    const data = cityTeams
      .map(t => {
        const teamPlayers = soldPlayers.filter(p => p.soldTeam === t.teamName)
          .filter(p => teamSkillFilter === 'All' || p.skillLevel?.toLowerCase() === teamSkillFilter.toLowerCase())
          .filter(p => teamGenderFilter === 'All' || p.gender?.toLowerCase() === teamGenderFilter.toLowerCase());

        const amountSpent = teamPlayers.reduce((sum, p) => sum + p.soldPrice, 0);

        return {
          ...t,
          playersBoughtCount: teamPlayers.length,
          amountSpent
        };
      })
      .filter(t => teamNameFilter === 'All' || t.teamName === teamNameFilter);

    return [...data].sort((a, b) => {
      let valA = a[teamSortField];
      let valB = b[teamSortField];

      if (valA === undefined || valA === null) valA = 0;
      if (valB === undefined || valB === null) valB = 0;

      if (teamSortField === 'amountSpent' || teamSortField === 'purseRemaining' || teamSortField === 'playersBoughtCount') {
        const numA = Number(valA) || 0;
        const numB = Number(valB) || 0;
        return teamSortOrder === 'asc' ? numA - numB : numB - numA;
      }

      const strA = String(valA).toLowerCase();
      const strB = String(valB).toLowerCase();
      if (strA < strB) return teamSortOrder === 'asc' ? -1 : 1;
      if (strA > strB) return teamSortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [cityTeams, soldPlayers, teamSkillFilter, teamGenderFilter, teamNameFilter, teamSortField, teamSortOrder]);

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

      {/* Player Stats Table */}
      <div style={{ marginBottom: '30px' }}>
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
            <h3 style={{ fontSize: '1.15rem', color: 'white', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={20} style={{ color: 'var(--color-primary)' }} />
              Player Stats
            </h3>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
              <Filter size={16} style={{ color: 'var(--color-text-muted)' }} />
              <select className="stats-select" value={playerSkillFilter} onChange={e => setPlayerSkillFilter(e.target.value)}>
                <option value="All">All Levels</option>
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
              <select className="stats-select" value={playerGenderFilter} onChange={e => setPlayerGenderFilter(e.target.value)}>
                <option value="All">All Genders</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
              <select className="stats-select" value={playerTeamFilter} onChange={e => setPlayerTeamFilter(e.target.value)}>
                <option value="All">All Teams</option>
                {[...new Set(soldPlayers.map(p => p.soldTeam).filter(Boolean))].sort().map(team => (
                  <option key={team} value={team}>{team}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="custom-table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th style={{ width: '60px', userSelect: 'none' }}>#</th>
                  <th 
                    onClick={() => handlePlayerSort('fullName')} 
                    style={{ cursor: 'pointer', userSelect: 'none' }}
                    title="Click to sort by Player Name"
                  >
                    Player Name {playerSortField === 'fullName' ? (playerSortOrder === 'asc' ? ' ▲' : ' ▼') : ''}
                  </th>
                  <th 
                    onClick={() => handlePlayerSort('skillLevel')} 
                    style={{ cursor: 'pointer', userSelect: 'none' }}
                    title="Click to sort by Skill Level"
                  >
                    Skill Level {playerSortField === 'skillLevel' ? (playerSortOrder === 'asc' ? ' ▲' : ' ▼') : ''}
                  </th>
                  <th 
                    onClick={() => handlePlayerSort('gender')} 
                    style={{ cursor: 'pointer', userSelect: 'none' }}
                    title="Click to sort by Gender"
                  >
                    Gender {playerSortField === 'gender' ? (playerSortOrder === 'asc' ? ' ▲' : ' ▼') : ''}
                  </th>
                  <th 
                    onClick={() => handlePlayerSort('soldTeam')} 
                    style={{ cursor: 'pointer', userSelect: 'none' }}
                    title="Click to sort by Bought By"
                  >
                    Bought By {playerSortField === 'soldTeam' ? (playerSortOrder === 'asc' ? ' ▲' : ' ▼') : ''}
                  </th>
                  <th 
                    onClick={() => handlePlayerSort('soldPrice')} 
                    style={{ cursor: 'pointer', userSelect: 'none' }}
                    title="Click to sort by Bought Price (Points)"
                  >
                    Bought Price {playerSortField === 'soldPrice' ? (playerSortOrder === 'asc' ? ' ▲' : ' ▼') : ''}
                  </th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  const displayList = showAllPlayers ? sortedPlayersList : sortedPlayersList.slice(0, 5);

                  if (sortedPlayersList.length === 0) {
                    return (
                      <tr><td colSpan="6" style={{ textAlign: 'center', padding: '20px', color: 'var(--color-text-muted)' }}>No players sold yet</td></tr>
                    );
                  }

                  return (
                    <>
                      {displayList.map((p, idx) => (
                        <tr key={p.id}>
                          <td style={{ color: 'var(--color-text-muted)' }}>{idx + 1}</td>
                          <td style={{ fontWeight: '600' }}>{p.fullName}</td>
                          <td><span className={`pill pill-skill-${p.skillLevel?.toLowerCase()}`}>{p.skillLevel}</span></td>
                          <td>{p.gender}</td>
                          <td>{p.soldTeam}</td>
                          <td style={{ color: 'var(--color-primary)', fontWeight: '600' }}>{p.soldPrice?.toLocaleString()} pts</td>
                        </tr>
                      ))}
                      {sortedPlayersList.length > 5 && (
                        <tr>
                          <td colSpan="6" style={{ textAlign: 'center', padding: '0' }}>
                            <button
                              onClick={() => setShowAllPlayers(prev => !prev)}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: 'var(--color-secondary)',
                                cursor: 'pointer',
                                fontSize: '0.85rem',
                                fontWeight: '600',
                                padding: '10px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                transition: 'opacity 0.2s'
                              }}
                            >
                              {showAllPlayers ? (<>Show Less <ChevronUp size={16} /></>) : (<>Show All {sortedPlayersList.length} Players <ChevronDown size={16} /></>)}
                            </button>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })()}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Team Stats Table */}
      <div style={{ marginBottom: '30px' }}>
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
            <h3 style={{ fontSize: '1.15rem', color: 'white', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Coins size={20} style={{ color: 'var(--color-warning)' }} />
              Team Stats
            </h3>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
              <Filter size={16} style={{ color: 'var(--color-text-muted)' }} />
              <select className="stats-select" value={teamSkillFilter} onChange={e => setTeamSkillFilter(e.target.value)}>
                <option value="All">All Levels</option>
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
              <select className="stats-select" value={teamGenderFilter} onChange={e => setTeamGenderFilter(e.target.value)}>
                <option value="All">All Genders</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
              <select className="stats-select" value={teamNameFilter} onChange={e => setTeamNameFilter(e.target.value)}>
                <option value="All">All Teams</option>
                {cityTeams.map(t => (
                  <option key={t.id || t.teamName} value={t.teamName}>{t.teamName}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="custom-table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th style={{ width: '60px', userSelect: 'none' }}>#</th>
                  <th 
                    onClick={() => handleTeamSort('teamName')} 
                    style={{ cursor: 'pointer', userSelect: 'none' }}
                    title="Click to sort by Team Name"
                  >
                    Team Name {teamSortField === 'teamName' ? (teamSortOrder === 'asc' ? ' ▲' : ' ▼') : ''}
                  </th>
                  <th 
                    onClick={() => handleTeamSort('playersBoughtCount')} 
                    style={{ cursor: 'pointer', userSelect: 'none' }}
                    title="Click to sort by Players Bought"
                  >
                    Players Bought {teamSortField === 'playersBoughtCount' ? (teamSortOrder === 'asc' ? ' ▲' : ' ▼') : ''}
                  </th>
                  <th 
                    onClick={() => handleTeamSort('amountSpent')} 
                    style={{ cursor: 'pointer', userSelect: 'none' }}
                    title="Click to sort by Amount Spent"
                  >
                    Amount Spent {teamSortField === 'amountSpent' ? (teamSortOrder === 'asc' ? ' ▲' : ' ▼') : ''}
                  </th>
                  <th 
                    onClick={() => handleTeamSort('purseRemaining')} 
                    style={{ cursor: 'pointer', userSelect: 'none' }}
                    title="Click to sort by Purse Remaining"
                  >
                    Purse Remaining {teamSortField === 'purseRemaining' ? (teamSortOrder === 'asc' ? ' ▲' : ' ▼') : ''}
                  </th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  const displayTeams = showAllTeams ? sortedTeamsList : sortedTeamsList.slice(0, 5);

                  if (sortedTeamsList.length === 0) {
                    return (
                      <tr><td colSpan="5" style={{ textAlign: 'center', padding: '20px', color: 'var(--color-text-muted)' }}>No teams matching criteria</td></tr>
                    );
                  }

                  return (
                    <>
                      {displayTeams.map((t, idx) => (
                        <tr key={t.id || t.teamName}>
                          <td style={{ color: 'var(--color-text-muted)' }}>{idx + 1}</td>
                          <td style={{ fontWeight: '600' }}>{t.teamName}</td>
                          <td>{t.playersBoughtCount}</td>
                          <td style={{ color: 'var(--color-warning)', fontWeight: '600' }}>{t.amountSpent.toLocaleString()} pts</td>
                          <td style={{ color: 'var(--color-success)' }}>{t.purseRemaining.toLocaleString()} pts</td>
                        </tr>
                      ))}
                      {sortedTeamsList.length > 5 && (
                        <tr>
                          <td colSpan="5" style={{ textAlign: 'center', padding: '0' }}>
                            <button
                              onClick={() => setShowAllTeams(prev => !prev)}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: 'var(--color-secondary)',
                                cursor: 'pointer',
                                fontSize: '0.85rem',
                                fontWeight: '600',
                                padding: '10px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                transition: 'opacity 0.2s'
                              }}
                            >
                              {showAllTeams ? (<>Show Less <ChevronUp size={16} /></>) : (<>Show All {sortedTeamsList.length} Teams <ChevronDown size={16} /></>)}
                            </button>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })()}
              </tbody>
            </table>
          </div>
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

import React, { createContext, useState, useEffect } from 'react';
import { initialPlayers, initialTeams, businessRules } from '../data/mockData';

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  // Load initial state from localStorage or use defaults
  const [city, setCity] = useState(() => localStorage.getItem('wbp_city') || '');
  const [role, setRole] = useState(() => localStorage.getItem('wbp_role') || '');
  
  const [players, setPlayers] = useState(() => {
    const saved = localStorage.getItem('wbp_players');
    return saved ? JSON.parse(saved) : initialPlayers;
  });

  const [teams, setTeams] = useState(() => {
    const saved = localStorage.getItem('wbp_teams');
    return saved ? JSON.parse(saved) : initialTeams;
  });

  const [currentAuctionIndex, setCurrentAuctionIndex] = useState(0);
  const [currentBid, setCurrentBid] = useState(0);
  const [highestBidderTeam, setHighestBidderTeam] = useState(null);

  // Sync state to localStorage
  useEffect(() => {
    localStorage.setItem('wbp_city', city);
  }, [city]);

  useEffect(() => {
    localStorage.setItem('wbp_role', role);
  }, [role]);

  useEffect(() => {
    localStorage.setItem('wbp_players', JSON.stringify(players));
  }, [players]);

  useEffect(() => {
    localStorage.setItem('wbp_teams', JSON.stringify(teams));
  }, [teams]);

  // Select City & Reset role / auction index
  const selectCity = (selectedCity) => {
    setCity(selectedCity);
    setCurrentAuctionIndex(0);
    setCurrentBid(0);
    setHighestBidderTeam(null);
  };

  // Select Role
  const selectRole = (selectedRole) => {
    setRole(selectedRole);
  };

  // Add Player
  const addPlayer = (playerData) => {
    const newPlayer = {
      id: `p_${Date.now()}`,
      status: 'unsold',
      ...playerData
    };
    setPlayers(prev => [...prev, newPlayer]);
  };

  // Create Team
  const createTeam = (teamData) => {
    const newTeam = {
      purseRemaining: businessRules.purseLimit,
      players: [],
      totalPlayers: 0,
      femalePlayers: 0,
      beginnerPlayers: 0,
      ...teamData,
      location: city // Bind to active city
    };
    setTeams(prev => [...prev, newTeam]);
  };

  // Get active auction queue for selected city
  // Order: Beginner first, Intermediate second, Advanced last
  const getAuctionQueue = () => {
    const cityPlayers = players.filter(p => p.location.toLowerCase() === city.toLowerCase() && p.status !== 'sold');
    
    const skillOrder = { 'Beginner': 1, 'Intermediate': 2, 'Advanced': 3 };
    
    return cityPlayers.sort((a, b) => {
      const orderA = skillOrder[a.skillLevel] || 99;
      const orderB = skillOrder[b.skillLevel] || 99;
      if (orderA !== orderB) return orderA - orderB;
      return a.fullName.localeCompare(b.fullName);
    });
  };

  const auctionQueue = getAuctionQueue();
  const activePlayer = auctionQueue[currentAuctionIndex] || null;

  // Initialize bidding when active player changes
  useEffect(() => {
    if (activePlayer) {
      setCurrentBid(activePlayer.basePrice);
      setHighestBidderTeam(null);
    } else {
      setCurrentBid(0);
      setHighestBidderTeam(null);
    }
  }, [activePlayer, currentAuctionIndex]);

  // Increase Bid (+500)
  const increaseBid = (teamName) => {
    if (!activePlayer) return;
    
    // Check if team exists
    const team = teams.find(t => t.teamName === teamName && t.location.toLowerCase() === city.toLowerCase());
    if (!team) return { success: false, message: "Team not found." };

    const nextBid = highestBidderTeam ? currentBid + businessRules.bidIncrement : activePlayer.basePrice;

    // Check if team has enough purse
    if (team.purseRemaining < nextBid) {
      return { success: false, message: `Insufficient purse! Team has only ${team.purseRemaining} points.` };
    }

    // Check team size compliance
    if (team.totalPlayers >= businessRules.teamSizeLimit) {
      return { success: false, message: `Team is already full (${businessRules.teamSizeLimit} players).` };
    }

    setCurrentBid(nextBid);
    setHighestBidderTeam(teamName);
    return { success: true };
  };

  // Pass Player
  const passPlayer = () => {
    if (!activePlayer) return;

    setPlayers(prev => prev.map(p => {
      if (p.id === activePlayer.id) {
        return { ...p, status: 'passed' };
      }
      return p;
    }));

    // Move to next player in queue
    nextPlayer();
  };

  // Mark Sold
  const markSold = () => {
    if (!activePlayer) return { success: false, message: "No active player." };
    if (!highestBidderTeam) return { success: false, message: "No bid placed yet. Cannot mark sold." };

    const teamName = highestBidderTeam;
    const finalPrice = currentBid;

    // Double check team capacity and purse again
    const teamIndex = teams.findIndex(t => t.teamName === teamName && t.location.toLowerCase() === city.toLowerCase());
    if (teamIndex === -1) return { success: false, message: "Bidding team not found." };
    
    const team = teams[teamIndex];
    if (team.purseRemaining < finalPrice) {
      return { success: false, message: "Bidding team has insufficient purse balance." };
    }
    if (team.totalPlayers >= businessRules.teamSizeLimit) {
      return { success: false, message: "Bidding team roster is full." };
    }

    // Update Player Status
    setPlayers(prev => prev.map(p => {
      if (p.id === activePlayer.id) {
        return { 
          ...p, 
          status: 'sold', 
          soldPrice: finalPrice, 
          soldTeam: teamName 
        };
      }
      return p;
    }));

    // Update Team Roster and Purse
    setTeams(prev => prev.map(t => {
      if (t.teamName === teamName && t.location.toLowerCase() === city.toLowerCase()) {
        const isFemale = activePlayer.gender.toLowerCase() === 'female';
        const isBeginner = activePlayer.skillLevel.toLowerCase() === 'beginner';

        const updatedPlayers = [...t.players, activePlayer];
        
        return {
          ...t,
          purseRemaining: t.purseRemaining - finalPrice,
          players: updatedPlayers,
          totalPlayers: updatedPlayers.length,
          femalePlayers: t.femalePlayers + (isFemale ? 1 : 0),
          beginnerPlayers: t.beginnerPlayers + (isBeginner ? 1 : 0)
        };
      }
      return t;
    }));

    // Reset bidding and index will naturally adjust as queue shrinks, but let's keep it safe
    setHighestBidderTeam(null);
    
    // If we were at the end of the queue, move index down or reset to 0
    if (currentAuctionIndex >= auctionQueue.length - 1) {
      setCurrentAuctionIndex(0);
    }

    return { success: true };
  };

  // Next Player
  const nextPlayer = () => {
    const queue = getAuctionQueue();
    if (queue.length === 0) return;
    
    setCurrentAuctionIndex(prev => {
      const nextIdx = prev + 1;
      return nextIdx >= queue.length ? 0 : nextIdx;
    });
  };

  // Reset entire database to defaults
  const resetDatabase = () => {
    setPlayers(initialPlayers);
    setTeams(initialTeams);
    setCurrentAuctionIndex(0);
    setCurrentBid(0);
    setHighestBidderTeam(null);
    localStorage.removeItem('wbp_players');
    localStorage.removeItem('wbp_teams');
  };

  return (
    <AppContext.Provider value={{
      city,
      role,
      players,
      teams,
      businessRules,
      activePlayer,
      currentBid,
      highestBidderTeam,
      auctionQueue,
      currentAuctionIndex,
      selectCity,
      selectRole,
      addPlayer,
      createTeam,
      increaseBid,
      passPlayer,
      markSold,
      nextPlayer,
      resetDatabase
    }}>
      {children}
    </AppContext.Provider>
  );
};

import React, { createContext, useState, useEffect, useCallback } from 'react';
import { apiFetch, apiUpload } from '../api/api';

const businessRules = {
  teamSizeLimit: 10,
  minBeginners: 2,
  minFemales: 2,
  purseLimit: 100000,
  bidIncrement: 500,
};

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  // Auth state — token is in HttpOnly cookie, never in JS
  const [city, setCity]     = useState(() => localStorage.getItem('wbp_city')  || '');
  const [role, setRole]     = useState(() => localStorage.getItem('wbp_role')  || '');
  const [username, setUsername] = useState(() => localStorage.getItem('wbp_username') || '');

  // Data state
  const [players, setPlayers] = useState([]);
  const [teams, setTeams]     = useState([]);

  // Auction UI state (managed client-side for performance)
  const [currentAuctionIndex, setCurrentAuctionIndex] = useState(0);
  const [currentBid, setCurrentBid]                   = useState(0);
  const [bidHistory, setBidHistory]                   = useState([]); // Store local bid increments for revert
  const [highestBidderTeam, setHighestBidderTeam]     = useState(null); // No longer needed strictly for UI during bid, but kept for markSold if needed
  const [highestBidderTeamId, setHighestBidderTeamId] = useState(null);

  // Auction Filters — reset auction index when filters change so we start
  // at the beginning of the newly-filtered queue.
  const [auctionSkillFilter, _setAuctionSkillFilter] = useState('All');
  const [auctionGenderFilter, _setAuctionGenderFilter] = useState('All');
  const setAuctionSkillFilter = (val) => { _setAuctionSkillFilter(val); setCurrentAuctionIndex(0); };
  const setAuctionGenderFilter = (val) => { _setAuctionGenderFilter(val); setCurrentAuctionIndex(0); };

  // Loading / error
  const [loading, setLoading] = useState(false);

  // ---- Persist non-sensitive auth to localStorage (token stays in HttpOnly cookie) ----
  useEffect(() => { localStorage.setItem('wbp_city', city); }, [city]);
  useEffect(() => { localStorage.setItem('wbp_role', role); }, [role]);

  // ---- Fetch data when city is set ----
  const refreshPlayers = useCallback(async () => {
    if (!city) return;
    try {
      const data = await apiFetch(`/api/${city}/players`);
      setPlayers(Array.isArray(data) ? data : []);
    } catch (err) {
      // Silently ignore if city is not yet set (guest entering before auth)
    }
  }, [city]);

  const refreshTeams = useCallback(async () => {
    if (!city) return;
    try {
      const data = await apiFetch(`/api/${city}/teams`);
      setTeams(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load teams:', err.message);
    }
  }, [city]);

  useEffect(() => {
    if (city && (role === 'admin' || role === 'guest')) {
      refreshPlayers();
      refreshTeams();
    }
  }, [city, role, refreshPlayers, refreshTeams]);

  // ---- Auto-refresh for guest mode ----
  // Jitter spreads concurrent guests across a 5s window so they don't all
  // hit the backend at the same instant (thundering herd every 10s).
  useEffect(() => {
    if (role !== 'guest' || !city) return;
    const jitter = Math.random() * 5000;
    const interval = setInterval(() => {
      refreshPlayers();
      refreshTeams();
    }, 10000 + jitter);
    return () => clearInterval(interval);
  }, [role, city, refreshPlayers, refreshTeams]);

  // ---- Auth actions ----
  const selectCity = (selectedCity) => {
    setCity(selectedCity);
    setCurrentAuctionIndex(0);
    setCurrentBid(0);
    setBidHistory([]);
    setHighestBidderTeam(null);
    setHighestBidderTeamId(null);
  };

  const selectRole = (selectedRole) => {
    setRole(selectedRole);
  };

  /**
   * Login via backend API. Stores JWT and user info.
   */
  const login = async (usernameInput, password) => {
    // Backend sets the HttpOnly wbpl_jwt cookie; response body has role/city/username only
    const resp = await apiFetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username: usernameInput, password }),
    });
    setRole(resp.role);
    setCity(resp.city);
    setUsername(resp.username);
    localStorage.setItem('wbp_role',     resp.role);
    localStorage.setItem('wbp_city',     resp.city);
    localStorage.setItem('wbp_username', resp.username);
    return resp;
  };

  const logout = async () => {
    try {
      // Ask backend to clear the HttpOnly cookie
      await apiFetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // Proceed even if the logout request fails
    }
    setRole('');
    setCity('');
    setUsername('');
    setPlayers([]);
    setTeams([]);
    localStorage.removeItem('wbp_role');
    localStorage.removeItem('wbp_city');
    localStorage.removeItem('wbp_username');
  };

  // ---- Player CRUD ----
  const addPlayer = async (playerData) => {
    const newPlayer = await apiFetch(`/api/${city}/players`, {
      method: 'POST',
      body: JSON.stringify(playerData),
    });
    setPlayers(prev => [...prev, newPlayer]);
    return newPlayer;
  };

  const importPlayersFromExcel = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const newPlayers = await apiUpload(`/api/${city}/players/import`, formData);
    setPlayers(prev => [...prev, ...newPlayers]);
    return newPlayers;
  };

  const clearAllPlayers = async () => {
    await apiFetch(`/api/${city}/players`, { method: 'DELETE' });
    setPlayers([]);
  };

  const updatePlayer = async (id, playerData) => {
    const updated = await apiFetch(`/api/${city}/players/${id}`, {
      method: 'PUT',
      body: JSON.stringify(playerData),
    });
    setPlayers(prev => prev.map(p => p.id === id ? updated : p));
    return updated;
  };

  const deletePlayer = async (id) => {
    await apiFetch(`/api/${city}/players/${id}`, { method: 'DELETE' });
    setPlayers(prev => prev.filter(p => p.id !== id));
    // Also update teams in case this player was sold to a team
    setTeams(prev => prev.map(t => {
      const hadPlayer = t.players?.some(p => p.id === id);
      if (!hadPlayer) return t;
      const removedPlayer = t.players.find(p => p.id === id);
      return {
        ...t,
        players: t.players.filter(p => p.id !== id),
        totalPlayers: Math.max(0, (t.totalPlayers || 0) - 1),
        femalePlayers: Math.max(0, (t.femalePlayers || 0) - (removedPlayer?.gender === 'Female' ? 1 : 0)),
        beginnerPlayers: Math.max(0, (t.beginnerPlayers || 0) - (removedPlayer?.skillLevel === 'Beginner' ? 1 : 0)),
        purseRemaining: (t.purseRemaining || 0) + (removedPlayer?.soldPrice || removedPlayer?.basePrice || 0),
      };
    }));
  };

  const uploadPlayerPhoto = async (playerId, photoFile) => {
    const formData = new FormData();
    formData.append('photo', photoFile);
    const updated = await apiUpload(`/api/${city}/players/${playerId}/upload-photo`, formData);
    setPlayers(prev => prev.map(p => p.id === playerId ? updated : p));
    return updated;
  };

  // ---- Team CRUD ----
  const createTeam = async (teamData) => {
    const newTeam = await apiFetch(`/api/${city}/teams`, {
      method: 'POST',
      body: JSON.stringify(teamData),
    });
    setTeams(prev => [...prev, newTeam]);
    return newTeam;
  };

  const updateTeam = async (id, teamData) => {
    const updated = await apiFetch(`/api/${city}/teams/${id}`, {
      method: 'PUT',
      body: JSON.stringify(teamData),
    });
    setTeams(prev => prev.map(t => t.id === id ? updated : t));
    return updated;
  };

  const deleteTeam = async (id) => {
    // Optimistically find released players before deleting
    const team = teams.find(t => t.id === id);
    await apiFetch(`/api/${city}/teams/${id}`, { method: 'DELETE' });
    setTeams(prev => prev.filter(t => t.id !== id));
    // Mark the team's players as UNSOLD optimistically
    if (team?.players?.length) {
      const releasedIds = new Set(team.players.map(p => p.id));
      setPlayers(prev => prev.map(p =>
        releasedIds.has(p.id)
          ? { ...p, status: 'UNSOLD', soldPrice: null, soldTeamId: null, soldTeamName: null }
          : p
      ));
    }
  };

  const releasePlayerFromTeam = async (teamId, playerId) => {
    const updatedTeam = await apiFetch(`/api/${city}/teams/${teamId}/release-player`, {
      method: 'POST',
      body: JSON.stringify({ playerId }),
    });

    // Ensure the released player is removed from the returned team data
    let finalTeam = updatedTeam;
    if (finalTeam.players && finalTeam.players.some(p => p.id === playerId)) {
      const removedPlayer = finalTeam.players.find(p => p.id === playerId);
      finalTeam = {
        ...finalTeam,
        players: finalTeam.players.filter(p => p.id !== playerId),
        totalPlayers: Math.max(0, finalTeam.totalPlayers - 1),
        purseRemaining: finalTeam.purseRemaining + (removedPlayer.soldPrice || removedPlayer.basePrice || 0)
      };
    }

    // Optimistic update: update team in place
    setTeams(prev => prev.map(t => t.id === teamId ? finalTeam : t));
    // Optimistic update: mark the player as UNSOLD locally
    setPlayers(prev => prev.map(p =>
      p.id === playerId
        ? { ...p, status: 'UNSOLD', soldPrice: null, soldTeamId: null, soldTeamName: null }
        : p
    ));
    return finalTeam;
  };

  // ---- Auction queue ----
  const getAuctionQueue = useCallback(() => {
    let cityPlayers = players.filter(
      p => p.location?.toLowerCase() === city?.toLowerCase() && p.status === 'UNSOLD'
    );

    if (auctionSkillFilter !== 'All') {
      cityPlayers = cityPlayers.filter(p => p.skillLevel === auctionSkillFilter);
    }
    if (auctionGenderFilter !== 'All') {
      cityPlayers = cityPlayers.filter(p => p.gender === auctionGenderFilter);
    }

    const skillOrder = { Beginner: 1, Intermediate: 2, Advanced: 3 };
    return cityPlayers.sort((a, b) => {
      const orderA = skillOrder[a.skillLevel] || 99;
      const orderB = skillOrder[b.skillLevel] || 99;
      if (orderA !== orderB) return orderA - orderB;
      // Female first within same skill
      if (a.gender !== b.gender) return a.gender === 'Female' ? -1 : 1;
      return a.fullName?.localeCompare(b.fullName);
    });
  }, [players, city, auctionSkillFilter, auctionGenderFilter]);

  const auctionQueue  = getAuctionQueue();
  const activePlayer  = auctionQueue[currentAuctionIndex] || null;

  // Safety: when the queue shrinks (e.g., after selling a player), adjust the
  // index so the next player in line is shown. When we're past the end of the
  // queue it means we've exhausted the current category — keep the index at
  // queue.length so activePlayer is null and the "Auction Complete" screen
  // appears. Do NOT wrap to 0, as that would silently restart the auction.

  useEffect(() => {
    if (activePlayer) {
      setCurrentBid(activePlayer.basePrice);
      setBidHistory([]);
      setHighestBidderTeam(null);
      setHighestBidderTeamId(null);
    } else {
      setCurrentBid(0);
      setBidHistory([]);
      setHighestBidderTeam(null);
      setHighestBidderTeamId(null);
    }
  }, [activePlayer?.id, currentAuctionIndex]);

  // ---- Bidding (Local State Only) ----
  const increaseBid = async (amount = 500) => {
    if (!activePlayer) return { success: false, message: 'No active player.' };
    setBidHistory(prev => [...prev, currentBid]);
    setCurrentBid(prev => prev + amount);
    return { success: true, bidAmount: currentBid + amount };
  };

  const revertLastBid = async () => {
    if (!activePlayer) return;
    if (bidHistory.length > 0) {
      const last = bidHistory[bidHistory.length - 1];
      setCurrentBid(last);
      setBidHistory(prev => prev.slice(0, -1));
    }
  };

  const passPlayer = async () => {
    if (!activePlayer) return;
    const passedPlayerId = activePlayer.id;

    // Optimistic update: immediately mark player as UNSOLD locally
    // so the auction queue re-computes and the UI advances instantly.
    // The backend pass endpoint marks the player as UNSOLD and clears bid logs.
    setPlayers(prev => prev.map(p =>
      p.id === passedPlayerId
        ? { ...p, status: 'PASSED' }
        : p
    ));

    // Fire backend call in the background — don't await before advancing UI
    try {
      await apiFetch(`/api/${city}/auction/pass`, {
        method: 'POST',
        body: JSON.stringify({ playerId: passedPlayerId }),
      });
    } catch (err) {
      console.error('Pass failed:', err.message);
      // Revert optimistic update on failure
      await refreshPlayers();
    }
  };

  const markSold = async (teamId) => {
    if (!activePlayer || !teamId) {
      return { success: false, message: 'Invalid player or team selected.' };
    }
    try {
      const soldPlayerId = activePlayer.id;
      const soldPrice = currentBid;
      const soldPlayer = activePlayer;

      await apiFetch(`/api/${city}/auction/sell`, {
        method: 'POST',
        body: JSON.stringify({
          playerId: soldPlayerId,
          teamId: teamId,
          finalPrice: soldPrice,
        }),
      });

      // Optimistic update: mark player as SOLD locally
      setPlayers(prev => prev.map(p =>
        p.id === soldPlayerId
          ? { ...p, status: 'SOLD', soldPrice: soldPrice, soldTeamId: teamId }
          : p
      ));

      // Optimistic update: update team purse and counters locally
      setTeams(prev => prev.map(t => {
        if (t.id !== teamId) return t;
        const isFemale = soldPlayer.gender === 'Female';
        const isBeginner = soldPlayer.skillLevel === 'Beginner';
        return {
          ...t,
          purseRemaining: (t.purseRemaining || 0) - soldPrice,
          totalPlayers: (t.totalPlayers || 0) + 1,
          femalePlayers: (t.femalePlayers || 0) + (isFemale ? 1 : 0),
          beginnerPlayers: (t.beginnerPlayers || 0) + (isBeginner ? 1 : 0),
          players: [...(t.players || []), { ...soldPlayer, status: 'SOLD', soldPrice: soldPrice }],
        };
      }));

      setHighestBidderTeam(null);
      setHighestBidderTeamId(null);

      // Re-fetch from backend to reconcile optimistic state with the DB truth.
      // If the backend rejected part of the write, the refresh will surface the real values.
      await Promise.all([refreshPlayers(), refreshTeams()]);

      return { success: true };
    } catch (err) {
      return { success: false, message: err.message };
    }
  };

  const nextPlayer = () => {
    const queue = getAuctionQueue();
    if (queue.length === 0) return;
    setCurrentAuctionIndex(prev => {
      const nextIdx = prev + 1;
      return nextIdx >= queue.length ? 0 : nextIdx;
    });
  };

  const reAuction = async () => {
    try {
      // Send filter params so backend only resets matching PASSED players
      const params = new URLSearchParams();
      if (auctionSkillFilter !== 'All') params.append('skillLevel', auctionSkillFilter);
      if (auctionGenderFilter !== 'All') params.append('gender', auctionGenderFilter);
      const qs = params.toString();
      await apiFetch(`/api/${city}/auction/re-auction${qs ? '?' + qs : ''}`, { method: 'POST' });
      // Optimistic: mark only PASSED players matching current filters as UNSOLD
      setPlayers(prev => prev.map(p => {
        if (p.location?.toLowerCase() !== city?.toLowerCase()) return p;
        if (p.status !== 'PASSED') return p;
        if (auctionSkillFilter !== 'All' && p.skillLevel !== auctionSkillFilter) return p;
        if (auctionGenderFilter !== 'All' && p.gender !== auctionGenderFilter) return p;
        return { ...p, status: 'UNSOLD', soldPrice: null, soldTeamId: null, soldTeamName: null };
      }));
      setCurrentAuctionIndex(0);
    } catch (err) {
      console.error('Re-auction failed:', err.message);
    }
  };


  return (
    <AppContext.Provider value={{
      // Auth — token is in HttpOnly cookie, not exposed to JS
      city, role, username,
      login, logout,
      // Data
      players, teams,
      refreshPlayers, refreshTeams,
      businessRules,
      // Auction
      activePlayer,
      currentBid,
      highestBidderTeam,
      highestBidderTeamId,
      auctionQueue,
      currentAuctionIndex,
      auctionSkillFilter,
      setAuctionSkillFilter,
      auctionGenderFilter,
      setAuctionGenderFilter,
      // Player CRUD
      addPlayer, importPlayersFromExcel, updatePlayer, deletePlayer, clearAllPlayers, uploadPlayerPhoto,
      // Team CRUD
      createTeam, updateTeam, deleteTeam, releasePlayerFromTeam,
      // Auction actions
      increaseBid,
      revertLastBid,
      passPlayer,
      markSold,
      nextPlayer,
      reAuction,
      selectCity,
      selectRole,
      // UI
      loading,
    }}>
      {children}
    </AppContext.Provider>
  );
};

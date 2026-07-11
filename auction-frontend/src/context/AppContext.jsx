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
  const [auctionSkillFilter, _setAuctionSkillFilter] = useState(() => localStorage.getItem('wbp_auctionSkillFilter') || 'All');
  const [auctionGenderFilter, _setAuctionGenderFilter] = useState(() => localStorage.getItem('wbp_auctionGenderFilter') || 'All');
  const setAuctionSkillFilter = (val) => { _setAuctionSkillFilter(val); setCurrentAuctionIndex(0); };
  const setAuctionGenderFilter = (val) => { _setAuctionGenderFilter(val); setCurrentAuctionIndex(0); };

  // Lot Selection states (shared to persist across pages)
  const [isLotSelected, setIsLotSelected] = useState(() => localStorage.getItem('wbp_isLotSelected') === 'true');
  const [selectedGender, setSelectedGender] = useState(() => localStorage.getItem('wbp_selectedGender') || 'Female');
  const [selectedSkill, setSelectedSkill] = useState(() => localStorage.getItem('wbp_selectedSkill') || 'Beginner');

  // Loading / error
  const [loading, setLoading] = useState(false);

  // ---- Persist non-sensitive auth to localStorage (token stays in HttpOnly cookie) ----
  useEffect(() => { localStorage.setItem('wbp_city', city); }, [city]);
  useEffect(() => { localStorage.setItem('wbp_role', role); }, [role]);

  // ---- Persist lot configuration and filters to localStorage ----
  useEffect(() => { localStorage.setItem('wbp_auctionSkillFilter', auctionSkillFilter); }, [auctionSkillFilter]);
  useEffect(() => { localStorage.setItem('wbp_auctionGenderFilter', auctionGenderFilter); }, [auctionGenderFilter]);
  useEffect(() => { localStorage.setItem('wbp_isLotSelected', isLotSelected); }, [isLotSelected]);
  useEffect(() => { localStorage.setItem('wbp_selectedGender', selectedGender); }, [selectedGender]);
  useEffect(() => { localStorage.setItem('wbp_selectedSkill', selectedSkill); }, [selectedSkill]);

  // ---- Fetch helpers (city passed explicitly to avoid stale closure issues) ----
  const fetchPlayersForCity = useCallback(async (targetCity) => {
    if (!targetCity) return [];
    try {
      const data = await apiFetch(`/api/${targetCity}/players`);
      return Array.isArray(data) ? data : [];
    } catch (err) {
      console.error('Failed to load players:', err.message);
      return [];
    }
  }, []);

  const fetchTeamsForCity = useCallback(async (targetCity) => {
    if (!targetCity) return [];
    try {
      const data = await apiFetch(`/api/${targetCity}/teams`);
      if (Array.isArray(data)) {
        await Promise.all(data.map(async (team) => {
          if (team.logoSvgHash || team.logoUrlHash) {
            const cacheKey = `logo_${team.id}_${team.logoSvgHash || 'none'}_${team.logoUrlHash || 'none'}`;
            const cachedLogo = sessionStorage.getItem(cacheKey);
            if (cachedLogo) {
              try {
                const parsed = JSON.parse(cachedLogo);
                team.logoSvg = parsed.logoSvg;
                team.logoUrl = parsed.logoUrl;
              } catch (e) {
                // Handle legacy cache strings
                team.logoSvg = cachedLogo;
              }
            } else {
              try {
                const logoData = await apiFetch(`/api/${targetCity}/teams/${team.id}/logo`);
                if (logoData.logoSvg || logoData.logoUrl) {
                  team.logoSvg = logoData.logoSvg;
                  team.logoUrl = logoData.logoUrl;
                  sessionStorage.setItem(cacheKey, JSON.stringify({ logoSvg: logoData.logoSvg, logoUrl: logoData.logoUrl }));
                }
              } catch (e) {
                console.error('Failed to fetch logo for team', team.id);
              }
            }
          }
        }));
      }
      return Array.isArray(data) ? data : [];
    } catch (err) {
      console.error('Failed to load teams:', err.message);
      return [];
    }
  }, []);

  const refreshPlayers = useCallback(async () => {
    if (!city) return;
    const data = await fetchPlayersForCity(city);
    setPlayers(data);
  }, [city, fetchPlayersForCity]);

  const refreshTeams = useCallback(async () => {
    if (!city) return;
    const data = await fetchTeamsForCity(city);
    setTeams(data);
  }, [city, fetchTeamsForCity]);

  // Fetch data when city or role changes (e.g. after login or page refresh)
  useEffect(() => {
    if (city && (role === 'admin' || role === 'guest')) {
      fetchPlayersForCity(city).then(setPlayers);
      fetchTeamsForCity(city).then(setTeams);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [city, role]);

  // ---- Auto-refresh for guest mode ----
  useEffect(() => {
    if (role !== 'guest' || !city) return;
    const jitter = Math.random() * 5000;
    const interval = setInterval(() => {
      refreshPlayers();
      refreshTeams();
    }, 20000 + jitter);
    return () => clearInterval(interval);
  }, [role, city, refreshPlayers, refreshTeams]);

  // ---- Auth actions ----
  // selectCity is used by the guest flow — also fetches data immediately
  const selectCity = useCallback(async (selectedCity, selectedRole) => {
    setCity(selectedCity);
    setCurrentAuctionIndex(0);
    setCurrentBid(0);
    setBidHistory([]);
    setHighestBidderTeam(null);
    setHighestBidderTeamId(null);
    setIsLotSelected(false);
    _setAuctionSkillFilter('All');
    _setAuctionGenderFilter('All');
    setSelectedGender('Female');
    setSelectedSkill('Beginner');

    // Fetch data immediately using the new city (state update is async so we pass it directly)
    if (selectedCity && (selectedRole === 'guest' || selectedRole === 'admin')) {
      const [p, t] = await Promise.all([
        fetchPlayersForCity(selectedCity),
        fetchTeamsForCity(selectedCity),
      ]);
      setPlayers(p);
      setTeams(t);
    }
  }, [fetchPlayersForCity, fetchTeamsForCity]);

  const selectRole = useCallback((selectedRole) => {
    setRole(selectedRole);
  }, []);

  /**
   * Login via backend API. Stores JWT and user info.
   * Data fetch is handled by the useEffect that watches city/role changes.
   */
  const login = async (usernameInput, password) => {
    // Backend sets the HttpOnly wbpl_jwt cookie; response body has role/city/username only
    const resp = await apiFetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username: usernameInput, password }),
    });
    // Setting city and role will trigger the useEffect to fetch players/teams
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
    const response = await apiUpload(`/api/${city}/players/import`, formData);
    setPlayers(prev => [...prev, ...response.importedPlayers]);
    return response;
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
    setPlayers(prev => prev.map(p => Number(p.id) === Number(playerId) ? updated : p));
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
    // Snapshot state for rollback in case the backend rejects the delete
    const teamToDelete = teams.find(t => t.id === id);

    // --- Optimistic update: remove team and release its players immediately ---
    // This makes the UI respond instantly without waiting for the network.
    setTeams(prev => prev.filter(t => t.id !== id));
    if (teamToDelete?.players?.length) {
      const releasedIds = new Set(teamToDelete.players.map(p => p.id));
      setPlayers(prev => prev.map(p =>
        releasedIds.has(p.id)
          ? { ...p, status: 'UNSOLD', soldPrice: null, soldTeamId: null, soldTeam: null }
          : p
      ));
    }

    // Fire the network request — revert the optimistic update on failure
    try {
      await apiFetch(`/api/${city}/teams/${id}`, { method: 'DELETE' });
    } catch (err) {
      // Restore the team and its players back to their original state
      if (teamToDelete) {
        setTeams(prev => [...prev, teamToDelete]);
        if (teamToDelete.players?.length) {
          const releasedIds = new Set(teamToDelete.players.map(p => p.id));
          setPlayers(prev => prev.map(p =>
            releasedIds.has(p.id)
              ? { ...p, status: 'SOLD', soldPrice: p.soldPrice, soldTeamId: id, soldTeam: teamToDelete.teamName }
              : p
          ));
        }
      }
      throw err; // re-throw so TeamsPage can show the error toast
    }
  };


  const releasePlayerFromTeam = async (teamId, playerId) => {
    const updatedTeam = await apiFetch(`/api/${city}/teams/${teamId}/release-player`, {
      method: 'POST',
      body: JSON.stringify({ playerId }),
    });

    // Ensure the released player is removed from the returned team data
    let finalTeam = updatedTeam;
    if (finalTeam.players && finalTeam.players.some(p => Number(p.id) === Number(playerId))) {
      const removedPlayer = finalTeam.players.find(p => Number(p.id) === Number(playerId));
      finalTeam = {
        ...finalTeam,
        players: finalTeam.players.filter(p => Number(p.id) !== Number(playerId)),
        totalPlayers: Math.max(0, finalTeam.totalPlayers - 1),
        purseRemaining: finalTeam.purseRemaining + (removedPlayer.soldPrice || removedPlayer.basePrice || 0)
      };
    }

    // Optimistic update: update team in place
    setTeams(prev => prev.map(t => t.id === teamId ? finalTeam : t));
    // Optimistic update: mark the player as UNSOLD locally
    setPlayers(prev => prev.map(p =>
      Number(p.id) === Number(playerId)
        ? { ...p, status: 'UNSOLD', soldPrice: null, soldTeamId: null, soldTeam: null }
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
  }, [activePlayer?.id, currentAuctionIndex, city]);

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

  const markSold = async (teamId, onFailure) => {
    if (!activePlayer || !teamId) {
      return { success: false, message: 'Invalid player or team selected.' };
    }

    const soldPlayerId = activePlayer.id;
    const soldPrice = currentBid;
    const soldPlayer = activePlayer;

    const targetTeam = teams.find(t => t.id === teamId);
    const teamName = targetTeam ? targetTeam.teamName : null;

    // Optimistic update: mark player as SOLD locally
    setPlayers(prev => prev.map(p =>
      p.id === soldPlayerId
        ? { ...p, status: 'SOLD', soldPrice: soldPrice, soldTeamId: teamId, soldTeam: teamName }
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
        players: [...(t.players || []), { ...soldPlayer, status: 'SOLD', soldPrice: soldPrice, soldTeam: teamName, soldTeamId: teamId }],
      };
    }));

    setHighestBidderTeam(null);
    setHighestBidderTeamId(null);

    // Fire network request asynchronously in the background
    apiFetch(`/api/${city}/auction/sell`, {
      method: 'POST',
      body: JSON.stringify({
        playerId: soldPlayerId,
        teamId: teamId,
        finalPrice: soldPrice,
      }),
    })
      .then((updatedPlayer) => {
        // Sync with fresh database state on success
        setPlayers(prev => prev.map(p => p.id === soldPlayerId ? updatedPlayer : p));
      })
      .catch((err) => {
        console.error('Sell failed, reverting optimistic state:', err.message);
        
        // Revert only the specific player status to UNSOLD
        setPlayers(prev => prev.map(p =>
          p.id === soldPlayerId
            ? { ...p, status: 'UNSOLD', soldPrice: null, soldTeamId: null, soldTeam: null }
            : p
        ));

        // Revert only the specific team purse and counters
        setTeams(prev => prev.map(t => {
          if (t.id !== teamId) return t;
          const isFemale = soldPlayer.gender === 'Female';
          const isBeginner = soldPlayer.skillLevel === 'Beginner';
          return {
            ...t,
            purseRemaining: (t.purseRemaining || 0) + soldPrice,
            totalPlayers: Math.max(0, (t.totalPlayers || 0) - 1),
            femalePlayers: Math.max(0, (t.femalePlayers || 0) - (isFemale ? 1 : 0)),
            beginnerPlayers: Math.max(0, (t.beginnerPlayers || 0) - (isBeginner ? 1 : 0)),
            players: (t.players || []).filter(p => p.id !== soldPlayerId),
          };
        }));

        // Trigger failure callback if provided
        if (onFailure) {
          onFailure(err.message || 'Server error');
        }
      });

    return { success: true };
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
    // Optimistic update: immediately mark matching PASSED players as UNSOLD
    setPlayers(prev => prev.map(p => {
      if (p.location?.toLowerCase() !== city?.toLowerCase()) return p;
      if (p.status !== 'PASSED') return p;
      if (auctionSkillFilter !== 'All' && p.skillLevel !== auctionSkillFilter) return p;
      if (auctionGenderFilter !== 'All' && p.gender !== auctionGenderFilter) return p;
      return { ...p, status: 'UNSOLD', soldPrice: null, soldTeamId: null, soldTeam: null };
    }));
    setCurrentAuctionIndex(0);

    // Fire backend call in the background — don't block UI
    const params = new URLSearchParams();
    if (auctionSkillFilter !== 'All') params.append('skillLevel', auctionSkillFilter);
    if (auctionGenderFilter !== 'All') params.append('gender', auctionGenderFilter);
    const qs = params.toString();
    try {
      await apiFetch(`/api/${city}/auction/re-auction${qs ? '?' + qs : ''}`, { method: 'POST' });
    } catch (err) {
      console.error('Re-auction failed, reverting:', err.message);
      // Revert optimistic update on failure
      await refreshPlayers();
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
      isLotSelected,
      setIsLotSelected,
      selectedGender,
      setSelectedGender,
      selectedSkill,
      setSelectedSkill,
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

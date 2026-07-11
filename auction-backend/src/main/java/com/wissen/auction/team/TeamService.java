package com.wissen.auction.team;

import lombok.RequiredArgsConstructor;
import org.hibernate.Hibernate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.wissen.auction.auction.BidLog;
import com.wissen.auction.auction.BidLogRepository;
import com.wissen.auction.player.Player;
import com.wissen.auction.player.PlayerDTO;
import com.wissen.auction.player.PlayerRepository;

import java.util.List;
import java.util.stream.Collectors;

/**
 * TeamService – all business logic for franchise team management.
 * Every team is scoped to a city (location).
 */
@Service
@RequiredArgsConstructor
public class TeamService {

    private static final int PURSE_LIMIT = 100000;

    private final TeamRepository teamRepository;
    private final PlayerRepository playerRepository;
    private final BidLogRepository bidLogRepository;

    // ---- READ ----

    @Transactional(readOnly = true)
    public List<TeamDTO> getTeamsByCity(String city) {
        List<TeamSlimView> teams = teamRepository.findByLocationIgnoreCaseExcludingLogo(city);
        List<Object[]> rows = playerRepository.findSoldPlayersProjectionByLocation(city);

        java.util.Map<Long, List<PlayerDTO>> playersByTeamId = new java.util.HashMap<>();
        for (Object[] row : rows) {
            PlayerDTO dto = PlayerDTO.builder()
                    .id((Long) row[0])
                    .wissenId((String) row[1])
                    .fullName((String) row[2])
                    .email((String) row[3])
                    .gender(row[4] != null ? ((com.wissen.auction.player.Player.Gender) row[4]).name() : null)
                    .location((String) row[5])
                    .skillLevel(row[6] != null ? ((com.wissen.auction.player.Player.SkillLevel) row[6]).name() : null)
                    .yearsOfExperience((String) row[7])
                    .mobileNumber((String) row[8])
                    .basePrice((Integer) row[9])
                    .status(row[10] != null ? ((com.wissen.auction.player.Player.PlayerStatus) row[10]).name() : "UNSOLD")
                    .soldPrice((Integer) row[11])
                    .soldTeamId((Long) row[12])
                    .build();

            playersByTeamId.computeIfAbsent(dto.getSoldTeamId(), k -> new java.util.ArrayList<>()).add(dto);
        }

        return teams.stream()
                .map(t -> {
                    List<PlayerDTO> teamPlayers = playersByTeamId.getOrDefault(t.getId(), List.of());
                    return TeamDTO.fromSlimView(t, teamPlayers);
                })
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public TeamDTO getTeamById(Long id) {
        return TeamDTO.from(findOrThrow(id));
    }

    @Transactional(readOnly = true)
    public java.util.Map<String, String> getTeamLogo(Long id) {
        Team team = findOrThrow(id);
        java.util.Map<String, String> result = new java.util.HashMap<>();
        result.put("logoSvg", team.getLogoSvg());
        result.put("logoUrl", team.getLogoUrl());
        return result;
    }

    // ---- CREATE ----

    @Transactional
    public TeamDTO createTeam(TeamRequest req, String city) {
        if (teamRepository.existsByTeamNameIgnoreCaseAndLocationIgnoreCase(req.getTeamName(), city)) {
            throw new IllegalArgumentException("A team named '" + req.getTeamName() + "' already exists in " + city + ".");
        }

        Team team = Team.builder()
                .teamName(req.getTeamName())
                .ownerName(req.getOwnerName())
                .themeColor(req.getThemeColor() != null ? req.getThemeColor() : "#1d4ed8")
                .logoUrl(req.getLogoUrl())
                .logoSvg(req.getLogoSvg())
                .location(city)
                .purseRemaining(PURSE_LIMIT)
                .build();

        return TeamDTO.from(teamRepository.save(team));
    }

    // ---- UPDATE ----

    @Transactional
    public TeamDTO updateTeam(Long id, TeamRequest req, String city) {
        Team team = findOrThrow(id);
        if (!team.getLocation().equalsIgnoreCase(city)) {
            throw new SecurityException("Cannot modify teams from another city.");
        }

        // Check name conflict with another team
        teamRepository.findByTeamNameIgnoreCaseAndLocationIgnoreCase(req.getTeamName(), city)
                .ifPresent(existing -> {
                    if (!existing.getId().equals(id)) {
                        throw new IllegalArgumentException("Team name '" + req.getTeamName() + "' is already in use.");
                    }
                });

        team.setTeamName(req.getTeamName());
        team.setOwnerName(req.getOwnerName());
        if (req.getThemeColor() != null) {
            team.setThemeColor(req.getThemeColor());
        }
        team.setLogoUrl(req.getLogoUrl());
        team.setLogoSvg(req.getLogoSvg());
        return TeamDTO.from(teamRepository.save(team));
    }

    // ---- DELETE ----

    @Transactional
    public void deleteTeam(Long id, String city) {
        Team team = findOrThrow(id);
        if (!team.getLocation().equalsIgnoreCase(city)) {
            throw new SecurityException("Cannot delete teams from another city.");
        }

        // Block delete if this team is the current highest bidder on any active player.
        // Single query: fetch the latest bid for this city scoped to this team name.
        // This replaces the old O(n) loop that queried bid logs per-player.
        List<BidLog> activeBidsForTeam =
                bidLogRepository.findTopActiveBidByTeamNameAndCity(team.getTeamName(), city);
        if (!activeBidsForTeam.isEmpty()) {
            BidLog topBid = activeBidsForTeam.get(0);
            throw new IllegalStateException(
                "Cannot delete '" + team.getTeamName() + "' — they hold the current highest bid on "
                + topBid.getPlayer().getFullName() + ". Revert or complete the bid first.");
        }

        // Bulk-reset all players owned by this team in a single UPDATE query
        // instead of the old O(n) loop of individual saves.
        // clearAutomatically=true ensures the L1 cache is invalidated so the
        // subsequent delete does not trigger a lazy collection load.
        playerRepository.bulkReleasePlayersByTeam(id);

        // Direct JPQL DELETE — bypasses Spring Data's em.find()+em.remove() overhead.
        // Safe because bulkReleasePlayersByTeam already cleared all FK references.
        teamRepository.deleteTeamById(id);
    }

    // ---- RELEASE PLAYER ----

    @Transactional
    public TeamDTO releasePlayer(Long teamId, Long playerId, String city) {
        Team team = findOrThrow(teamId);
        if (!team.getLocation().equalsIgnoreCase(city)) {
            throw new SecurityException("Cannot modify teams from another city.");
        }

        Player player = playerRepository.findById(playerId)
                .orElseThrow(() -> new RuntimeException("Player not found with id: " + playerId));

        if (player.getSoldTeam() == null || !player.getSoldTeam().getId().equals(teamId)) {
            throw new IllegalArgumentException("This player does not belong to this team.");
        }

        // Refund purse — the only counter we maintain as a stored field.
        // totalPlayers / femalePlayers / beginnerPlayers are derived dynamically in TeamDTO.from().
        int refund = player.getSoldPrice() != null ? player.getSoldPrice() : 0;
        team.setPurseRemaining(team.getPurseRemaining() + refund);

        // Release the player: mark as UNSOLD, clear sold info
        player.setStatus(Player.PlayerStatus.UNSOLD);
        player.setSoldPrice(null);
        player.setSoldTeam(null);
        playerRepository.save(player);

        // Force-initialize the lazy players collection to avoid proxy issues
        Hibernate.initialize(team.getPlayers());
        team.getPlayers().removeIf(p -> p.getId().equals(playerId));
        teamRepository.save(team);

        // Return updated team DTO
        return TeamDTO.from(team);
    }

    // ---- Internal (used by AuctionService) ----

    public Team findOrThrow(Long id) {
        return teamRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Team not found with id: " + id));
    }

    @Transactional
    public void save(Team team) {
        teamRepository.save(team);
    }
}

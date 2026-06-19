package com.wissen.auction.team;

import lombok.RequiredArgsConstructor;
import org.hibernate.Hibernate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.wissen.auction.player.Player;
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

    // ---- READ ----

    @Transactional(readOnly = true)
    public List<TeamDTO> getTeamsByCity(String city) {
        return teamRepository.findByLocationIgnoreCase(city)
                .stream()
                .map(TeamDTO::from)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public TeamDTO getTeamById(Long id) {
        return TeamDTO.from(findOrThrow(id));
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
                .totalPlayers(0)
                .femalePlayers(0)
                .beginnerPlayers(0)
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

        // Remove dependency: reset all players bought by this team
        List<Player> players = team.getPlayers();
        if (players != null && !players.isEmpty()) {
            for (Player player : players) {
                player.setStatus(Player.PlayerStatus.UNSOLD);
                player.setSoldPrice(null);
                player.setSoldTeam(null);
                playerRepository.save(player);
            }
        }

        teamRepository.delete(team);
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

        // Update team counters: decrement totals and refund purse
        int refund = player.getSoldPrice() != null ? player.getSoldPrice() : 0;
        team.setTotalPlayers(Math.max(0, team.getTotalPlayers() - 1));
        if (player.getGender() == Player.Gender.Female) {
            team.setFemalePlayers(Math.max(0, team.getFemalePlayers() - 1));
        }
        if (player.getSkillLevel() == Player.SkillLevel.Beginner) {
            team.setBeginnerPlayers(Math.max(0, team.getBeginnerPlayers() - 1));
        }
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

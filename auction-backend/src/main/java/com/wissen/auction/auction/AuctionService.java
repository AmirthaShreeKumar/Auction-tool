package com.wissen.auction.auction;

import com.wissen.auction.player.*;
import com.wissen.auction.team.*;
import lombok.RequiredArgsConstructor;
import org.hibernate.Hibernate;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

/**
 * AuctionService – core bidding business logic.
 *
 * Business rules enforced:
 * - Bid increment: +500 or +1000 points
 * - Team purse check: bid must not exceed purseRemaining
 * - Team size check: max 10 players
 * - Last 5 bids per player are persisted in BidLog
 * - On "Mark Sold": deduct from team purse, update counters, mark player SOLD
 * - On "Pass": mark player PASSED
 * - Re-auction: reset PASSED players back to UNSOLD
 */
@Service
@RequiredArgsConstructor
public class AuctionService {

    private static final int TEAM_SIZE_LIMIT  = 12;
    private static final int BID_INCREMENT_500 = 500;
    private static final int BID_INCREMENT_1000 = 1000;
    private static final int MAX_BID_HISTORY   = 5;

    private final PlayerRepository  playerRepository;
    private final TeamRepository    teamRepository;
    private final BidLogRepository  bidLogRepository;
    private final PlayerService     playerService;
    private final TeamService       teamService;

    // ---- AUCTION STATE ----

    /**
     * Returns the current auction snapshot for a given city.
     * The active player is the first in the auction queue.
     */
    @Cacheable(value = "auctionState", key = "#city")
    @Transactional(readOnly = true)
    public AuctionStateDTO getAuctionState(String city) {
        List<AuctionQueueView> queue = playerRepository.findAuctionQueueSlim(city);
        List<PlayerDTO> queueDTOs = queue.stream().map(PlayerDTO::from).collect(Collectors.toList());

        PlayerDTO activePlayer = queueDTOs.isEmpty() ? null : queueDTOs.get(0);

        List<TeamDTO> teamDTOs = teamService.getTeamsByCity(city, null);

        return AuctionStateDTO.builder()
                .activePlayer(activePlayer)
                .currentBid(activePlayer != null ? activePlayer.getBasePrice() : 0)
                .highestBidderTeam(null)
                .auctionQueue(queueDTOs)
                .currentAuctionIndex(0)
                .location(city)
                .cityTeams(teamDTOs)
                .build();
    }

    // ---- PLACE BID ----

    /**
     * Places a bid for a team on the currently active player.
     * Returns updated BidLog entry.
     */
    @CacheEvict(value = "auctionState", key = "#city")
    @Transactional
    public BidResponseDTO placeBid(Long playerId, Long teamId, Integer increment, String city) {
        Player player = playerService.findOrThrow(playerId);
        com.wissen.auction.team.Team team = teamService.findOrThrow(teamId);

        // Validate same city
        if (!team.getLocation().equalsIgnoreCase(city)) {
            throw new IllegalArgumentException("Team does not belong to city: " + city);
        }
        if (!player.getLocation().equalsIgnoreCase(city)) {
            throw new IllegalArgumentException("Player does not belong to city: " + city);
        }

        // Player must be in auction
        if (player.getStatus() == Player.PlayerStatus.SOLD) {
            throw new IllegalStateException("Player is already sold.");
        }

        // Validate increment
        if (increment != BID_INCREMENT_500 && increment != BID_INCREMENT_1000) {
            throw new IllegalArgumentException("Increment must be 500 or 1000.");
        }

        // Get last bid for this player
        List<BidLog> existingBids = bidLogRepository.findByPlayerOrderByCreatedAtDesc(player);
        int currentBid = existingBids.isEmpty()
                ? player.getBasePrice()
                : existingBids.get(0).getBidAmount();

        int nextBid = existingBids.isEmpty() ? player.getBasePrice() : currentBid + increment;

        // Purse check
        if (team.getPurseRemaining() < nextBid) {
            throw new IllegalStateException("Insufficient purse! Team has only " + team.getPurseRemaining() + " points.");
        }

        // Team size check – use actual player count, not the counter column which can be stale
        Hibernate.initialize(team.getPlayers());
        int actualPlayerCount = team.getPlayers() != null ? team.getPlayers().size() : 0;
        if (actualPlayerCount >= TEAM_SIZE_LIMIT) {
            throw new IllegalStateException("Team roster is full (" + TEAM_SIZE_LIMIT + " players).");
        }

        // Save bid log
        BidLog log = BidLog.builder()
                .player(player)
                .teamName(team.getTeamName())
                .bidAmount(nextBid)
                .location(city)
                .build();
        bidLogRepository.save(log);

        // Keep only last 5 bids per player (disabled to preserve stats history)
        // pruneOldBids(player);

        // Fetch fresh last 5 bids
        List<BidLog> last5 = bidLogRepository.findTop5ByPlayer(player, PageRequest.of(0, 5));

        return BidResponseDTO.builder()
                .playerId(playerId)
                .teamId(teamId)
                .teamName(team.getTeamName())
                .bidAmount(nextBid)
                .recentBids(last5.stream().map(b -> BidResponseDTO.BidEntry.builder()
                        .teamName(b.getTeamName())
                        .bidAmount(b.getBidAmount())
                        .createdAt(b.getCreatedAt() != null ? b.getCreatedAt().toString() : "")
                        .build()).collect(Collectors.toList()))
                .build();
    }

    // ---- REVERT LAST BID ----

    @CacheEvict(value = "auctionState", key = "#city")
    @Transactional
    public BidResponseDTO revertLastBid(Long playerId, String city) {
        Player player = playerService.findOrThrow(playerId);
        List<BidLog> bids = bidLogRepository.findByPlayerOrderByCreatedAtDesc(player);
        if (!bids.isEmpty()) {
            bidLogRepository.delete(bids.get(0));
            if (bids.size() > 1) {
                bids = bids.subList(1, bids.size());
            } else {
                bids = java.util.Collections.emptyList();
            }
        }

        int currentBid = bids.isEmpty() ? player.getBasePrice() : bids.get(0).getBidAmount();
        String teamName = bids.isEmpty() ? null : bids.get(0).getTeamName();
        Long teamId = null;
        if (teamName != null) {
            com.wissen.auction.team.Team t = teamRepository.findByTeamNameIgnoreCaseAndLocationIgnoreCase(teamName, city).orElse(null);
            if (t != null) {
                teamId = t.getId();
            }
        }

        List<BidLog> last5 = bids.stream().limit(5).collect(Collectors.toList());

        return BidResponseDTO.builder()
                .playerId(playerId)
                .teamId(teamId)
                .teamName(teamName)
                .bidAmount(currentBid)
                .recentBids(last5.stream().map(b -> BidResponseDTO.BidEntry.builder()
                        .teamName(b.getTeamName())
                        .bidAmount(b.getBidAmount())
                        .createdAt(b.getCreatedAt() != null ? b.getCreatedAt().toString() : "")
                        .build()).collect(Collectors.toList()))
                .build();
    }

    // ---- MARK SOLD ----

    private static final int MIN_FEMALES   = 2;
    private static final int MIN_BEGINNERS = 2;

    @CacheEvict(value = "auctionState", key = "#city")
    @Transactional
    public PlayerDTO markSold(Long playerId, Long teamId, Integer finalPrice, String city) {
        // Pessimistic lock prevents two concurrent sell requests on the same player
        Player player = playerRepository.findByIdForUpdate(playerId)
                .orElseThrow(() -> new RuntimeException("Player not found with id: " + playerId));
        com.wissen.auction.team.Team team = teamService.findOrThrow(teamId);

        if (!team.getLocation().equalsIgnoreCase(city)) {
            throw new IllegalArgumentException("Team does not belong to city: " + city);
        }
        if (team.getPurseRemaining() < finalPrice) {
            throw new IllegalStateException("Insufficient purse to complete sale.");
        }
        // Team size check – use actual player count, not the counter column which can be stale
        Hibernate.initialize(team.getPlayers());
        int actualPlayerCount = team.getPlayers() != null ? team.getPlayers().size() : 0;
        if (actualPlayerCount >= TEAM_SIZE_LIMIT) {
            throw new IllegalStateException("Team roster is full.");
        }

        // Compliance feasibility check – ensure buying this player won't make it
        // impossible to meet min-female and min-beginner requirements with remaining slots
        boolean isFemale   = player.getGender()     == Player.Gender.Female;
        boolean isBeginner = player.getSkillLevel()  == Player.SkillLevel.Beginner;

        int newTotal     = actualPlayerCount + 1;
        int newFemales   = (int) team.getPlayers().stream()
                .filter(p -> p.getGender() == Player.Gender.Female).count()
                + (isFemale ? 1 : 0);
        int newBeginners = (int) team.getPlayers().stream()
                .filter(p -> p.getSkillLevel() == Player.SkillLevel.Beginner).count()
                + (isBeginner ? 1 : 0);

        int slotsLeft         = TEAM_SIZE_LIMIT - newTotal;
        int femalesNeeded     = Math.max(0, MIN_FEMALES - newFemales);
        int beginnersNeeded   = Math.max(0, MIN_BEGINNERS - newBeginners);
        // A female beginner can satisfy both quotas, so use max (not sum)
        int mandatorySlots    = Math.max(femalesNeeded, beginnersNeeded);

        if (slotsLeft < mandatorySlots) {
            throw new IllegalStateException(
                "Cannot sell this player to this team – not enough remaining slots to meet "
                + "compliance requirements (need " + femalesNeeded + " more female(s) and "
                + beginnersNeeded + " more beginner(s) but only " + slotsLeft + " slot(s) left).");
        }

        // Update player
        player.setStatus(Player.PlayerStatus.SOLD);
        player.setSoldPrice(finalPrice);
        player.setSoldTeam(team);
        playerRepository.save(player);

        // Deduct purse — the only counter worth storing (used for quick budget checks in placeBid).
        // totalPlayers / femalePlayers / beginnerPlayers are computed dynamically in TeamDTO.from()
        // so we don't touch those fields; keeping them avoids drift between entity and DTO.
        team.setPurseRemaining(team.getPurseRemaining() - finalPrice);
        // Keep the in-memory collection consistent so compliance stream-counts stay accurate
        // within the same transaction without a reload.
        if (team.getPlayers() != null) {
            team.getPlayers().add(player);
        }
        teamRepository.save(team);

        return PlayerDTO.from(player);
    }

    // ---- PASS / MARK UNSOLD ----

    @CacheEvict(value = "auctionState", key = "#city")
    @Transactional
    public PlayerDTO passPlayer(Long playerId, String city) {
        Player player = playerService.findOrThrow(playerId);
        if (!player.getLocation().equalsIgnoreCase(city)) {
            throw new SecurityException("Cannot modify players from another city.");
        }
        // Clear bid history so re-auction starts with a clean slate and revertBid
        // cannot accidentally revert a bid from a previous round.
        bidLogRepository.deleteByPlayer(player);
        player.setStatus(Player.PlayerStatus.PASSED);
        return PlayerDTO.from(playerRepository.save(player));
    }

    // ---- RE-AUCTION UNSOLD ----

    /**
     * Resets PASSED players back to UNSOLD so they re-enter the auction queue.
     * Optional filters narrow down which passed players are reset.
     */
    @CacheEvict(value = "auctionState", key = "#city")
    @Transactional
    public int resetPassedPlayers(String city, String skillLevel, String gender) {
        boolean hasSkill = skillLevel != null && !skillLevel.isBlank();
        boolean hasGender = gender != null && !gender.isBlank();

        int updated;
        if (hasSkill && hasGender) {
            updated = playerRepository.bulkResetPassedBySkillAndGender(
                    city,
                    Player.SkillLevel.valueOf(skillLevel),
                    Player.Gender.valueOf(gender));
        } else if (hasSkill) {
            updated = playerRepository.bulkResetPassedBySkill(
                    city,
                    Player.SkillLevel.valueOf(skillLevel));
        } else if (hasGender) {
            updated = playerRepository.bulkResetPassedByGender(
                    city,
                    Player.Gender.valueOf(gender));
        } else {
            updated = playerRepository.bulkResetPassed(city);
        }

        return updated;
    }

    // ---- BID HISTORY ----

    @Transactional(readOnly = true)
    public List<BidLogDTO> getBidHistoryDTOs(String city) {
        return bidLogRepository.findByLocationIgnoreCaseOrderByCreatedAtDesc(city)
                .stream()
                .map(BidLogDTO::from)
                .collect(Collectors.toList());
    }

    public List<BidLog> getBidHistory(String city) {
        return bidLogRepository.findByLocationIgnoreCaseOrderByCreatedAtDesc(city);
    }

    // ---- HELPER ----

    private void pruneOldBids(Player player) {
        List<BidLog> all = bidLogRepository.findByPlayerOrderByCreatedAtDesc(player);
        if (all.size() > MAX_BID_HISTORY) {
            List<BidLog> toDelete = all.subList(MAX_BID_HISTORY, all.size());
            bidLogRepository.deleteAll(toDelete);
        }
    }
}

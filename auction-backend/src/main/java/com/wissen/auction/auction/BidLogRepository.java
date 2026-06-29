package com.wissen.auction.auction;

import com.wissen.auction.player.Player;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface BidLogRepository extends JpaRepository<BidLog, Long> {

    /** Latest bids for a single player, ordered newest first */
    List<BidLog> findByPlayerOrderByCreatedAtDesc(Player player, Pageable pageable);

    /** All bid history for a player */
    List<BidLog> findByPlayerOrderByCreatedAtDesc(Player player);

    /** Last 5 bids for a player */
    @Query("""
        SELECT b FROM BidLog b
        WHERE b.player = :player
        ORDER BY b.createdAt DESC
        """)
    List<BidLog> findTop5ByPlayer(@Param("player") Player player, Pageable pageable);

    /** All bids for a given location */
    List<BidLog> findByLocationIgnoreCaseOrderByCreatedAtDesc(String location);

    /** Delete all bids associated with a player */
    void deleteByPlayer(Player player);

    /** Bulk-delete all bids for a list of players */
    void deleteByPlayerIn(List<Player> players);

    /**
     * Finds the single most-recent bid made by a given team name in a given city
     * on a player that is still UNSOLD — i.e. the team is currently the leading bidder.
     * Returns at most one result (the latest matching bid log).
     * Used by TeamService.deleteTeam to block deletion when the team holds an active bid.
     */
    @Query("""
        SELECT b FROM BidLog b
        WHERE LOWER(b.teamName) = LOWER(:teamName)
          AND LOWER(b.location) = LOWER(:city)
          AND b.player.status = 'UNSOLD'
        ORDER BY b.createdAt DESC
        """)
    List<BidLog> findTopActiveBidByTeamNameAndCity(
            @Param("teamName") String teamName,
            @Param("city") String city,
            org.springframework.data.domain.Pageable pageable);

    /**
     * Convenience overload without a Pageable — returns ALL matching active bids.
     * The caller checks isEmpty() to decide if the team is a leading bidder anywhere.
     */
    default List<BidLog> findTopActiveBidByTeamNameAndCity(String teamName, String city) {
        return findTopActiveBidByTeamNameAndCity(
                teamName, city,
                org.springframework.data.domain.PageRequest.of(0, 1));
    }
}

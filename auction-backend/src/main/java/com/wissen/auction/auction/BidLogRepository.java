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
}

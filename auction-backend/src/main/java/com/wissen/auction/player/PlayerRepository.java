package com.wissen.auction.player;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface PlayerRepository extends JpaRepository<Player, Long> {

    List<Player> findByLocationIgnoreCase(String location);

    List<Player> findByLocationIgnoreCaseAndStatus(String location, Player.PlayerStatus status);

    List<Player> findByLocationIgnoreCaseAndSkillLevel(String location, Player.SkillLevel skillLevel);

    Optional<Player> findByWissenId(String wissenId);

    boolean existsByWissenId(String wissenId);

    /**
     * Auction queue order:
     * Female first within each skill tier,
     * then by skill: Beginner → Intermediate → Advanced.
     */
    @Query("""
        SELECT p FROM Player p
        WHERE LOWER(p.location) = LOWER(:location)
          AND p.status = 'UNSOLD'
        ORDER BY
          CASE p.skillLevel WHEN 'Beginner' THEN 1 WHEN 'Intermediate' THEN 2 ELSE 3 END ASC,
          CASE p.gender    WHEN 'Female'   THEN 1 ELSE 2 END ASC,
          p.fullName ASC
        """)
    List<Player> findAuctionQueue(@Param("location") String location);
}

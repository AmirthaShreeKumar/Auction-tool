package com.wissen.auction.player;

import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface PlayerRepository extends JpaRepository<Player, Long> {

    /** Exclusive lock — used in markSold to prevent two concurrent sales on the same player. */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT p FROM Player p WHERE p.id = :id")
    Optional<Player> findByIdForUpdate(@Param("id") Long id);

    @EntityGraph(attributePaths = {"soldTeam", "stats"})
    List<Player> findByLocationIgnoreCase(String location);

    List<PlayerSlimView> findSlimByLocationIgnoreCase(String location);

    List<Player> findByLocationIgnoreCaseAndStatus(String location, Player.PlayerStatus status);

    List<Player> findByLocationIgnoreCaseAndSkillLevel(String location, Player.SkillLevel skillLevel);

    Optional<Player> findByWissenIdAndLocationIgnoreCase(String wissenId, String location);

    Optional<Player> findByWissenId(String wissenId);

    boolean existsByWissenIdAndLocationIgnoreCase(String wissenId, String location);

    /**
     * Auction queue order:
     * Female first within each skill tier,
     * then by skill: Beginner → Intermediate → Advanced.
     */
    @EntityGraph(attributePaths = {"soldTeam", "stats"})
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

    @Query("""
        SELECT p FROM Player p
        WHERE LOWER(p.location) = LOWER(:location)
          AND p.status = 'UNSOLD'
        ORDER BY
          CASE p.skillLevel WHEN 'Beginner' THEN 1 WHEN 'Intermediate' THEN 2 ELSE 3 END ASC,
          CASE p.gender    WHEN 'Female'   THEN 1 ELSE 2 END ASC,
          p.fullName ASC
        """)
    List<AuctionQueueView> findAuctionQueueSlim(@Param("location") String location);

    // ---- Bulk UPDATE for re-auction (single SQL round-trip) ----

    /** Reset ALL PASSED players in a city to UNSOLD (no filters). */
    @Modifying
    @Query("""
        UPDATE Player p SET p.status = 'UNSOLD', p.soldPrice = NULL, p.soldTeam = NULL
        WHERE LOWER(p.location) = LOWER(:city) AND p.status = 'PASSED'
        """)
    int bulkResetPassed(@Param("city") String city);

    /** Reset PASSED players in a city to UNSOLD, filtered by skill level only. */
    @Modifying
    @Query("""
        UPDATE Player p SET p.status = 'UNSOLD', p.soldPrice = NULL, p.soldTeam = NULL
        WHERE LOWER(p.location) = LOWER(:city) AND p.status = 'PASSED'
          AND p.skillLevel = :skillLevel
        """)
    int bulkResetPassedBySkill(@Param("city") String city,
                               @Param("skillLevel") Player.SkillLevel skillLevel);

    /** Reset PASSED players in a city to UNSOLD, filtered by gender only. */
    @Modifying
    @Query("""
        UPDATE Player p SET p.status = 'UNSOLD', p.soldPrice = NULL, p.soldTeam = NULL
        WHERE LOWER(p.location) = LOWER(:city) AND p.status = 'PASSED'
          AND p.gender = :gender
        """)
    int bulkResetPassedByGender(@Param("city") String city,
                                @Param("gender") Player.Gender gender);

    /** Reset PASSED players in a city to UNSOLD, filtered by both skill level and gender. */
    @Modifying
    @Query("""
        UPDATE Player p SET p.status = 'UNSOLD', p.soldPrice = NULL, p.soldTeam = NULL
        WHERE LOWER(p.location) = LOWER(:city) AND p.status = 'PASSED'
          AND p.skillLevel = :skillLevel AND p.gender = :gender
        """)
    int bulkResetPassedBySkillAndGender(@Param("city") String city,
                                        @Param("skillLevel") Player.SkillLevel skillLevel,
                                        @Param("gender") Player.Gender gender);

    @Query("""
        SELECT 
            p.id, 
            p.wissenId, 
            p.fullName, 
            p.email, 
            p.gender, 
            p.location, 
            p.skillLevel, 
            p.yearsOfExperience, 
            p.mobileNumber, 
            p.basePrice, 
            p.status, 
            p.soldPrice, 
            p.soldTeam.id 
        FROM Player p 
        WHERE LOWER(p.location) = LOWER(:city) 
          AND p.status = 'SOLD'
        """)
    List<Object[]> findSoldPlayersProjectionByLocation(@Param("city") String city);

    /**
     * Bulk-reset all players sold to a specific team: mark them UNSOLD and
     * clear their sold price and team association in a single UPDATE statement.
     * Used by TeamService.deleteTeam to avoid O(n) individual saves.
     *
     * clearAutomatically=true flushes the Hibernate L1 cache after the bulk UPDATE
     * so the EntityManager does not hold a stale players proxy for this team,
     * which would otherwise trigger an extra SELECT when the team entity is deleted.
     */
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("""
        UPDATE Player p
        SET p.status = 'UNSOLD', p.soldPrice = NULL, p.soldTeam = NULL
        WHERE p.soldTeam.id = :teamId
        """)
    int bulkReleasePlayersByTeam(@Param("teamId") Long teamId);
}

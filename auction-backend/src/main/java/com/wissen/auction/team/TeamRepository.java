package com.wissen.auction.team;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface TeamRepository extends JpaRepository<Team, Long> {

    List<Team> findByLocationIgnoreCase(String location);

    @Query("SELECT DISTINCT t FROM Team t LEFT JOIN FETCH t.players WHERE LOWER(t.location) = LOWER(:city)")
    List<Team> findByLocationWithPlayers(@Param("city") String city);

    Optional<Team> findByTeamNameIgnoreCaseAndLocationIgnoreCase(String teamName, String location);

    boolean existsByTeamNameIgnoreCaseAndLocationIgnoreCase(String teamName, String location);

    /**
     * Direct JPQL DELETE — issues a single SQL DELETE without Spring Data's
     * default em.find() + em.merge() + em.remove() sequence.
     * Safe to call after bulkReleasePlayersByTeam has already cleared the FK references.
     */
    @Modifying(clearAutomatically = true)
    @Query("DELETE FROM Team t WHERE t.id = :id")
    void deleteTeamById(@Param("id") Long id);
}

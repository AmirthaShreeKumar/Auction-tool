package com.wissen.auction.team;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TeamRepository extends JpaRepository<Team, Long> {

    List<Team> findByLocationIgnoreCase(String location);

    Optional<Team> findByTeamNameIgnoreCaseAndLocationIgnoreCase(String teamName, String location);

    boolean existsByTeamNameIgnoreCaseAndLocationIgnoreCase(String teamName, String location);
}

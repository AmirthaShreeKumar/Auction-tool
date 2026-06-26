package com.wissen.auction.team;

import com.wissen.auction.player.Player;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.hibernate.Hibernate;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * TeamPurseSync – CommandLineRunner that executes on application startup.
 * Automatically synchronizes the team `purse_remaining` database column
 * by dynamically counting the spent values of all players currently sold.
 * This fixes any historical out-of-sync values in the database.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class TeamPurseSync implements CommandLineRunner {

    private final TeamRepository teamRepository;

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        log.info("[WBPL Startup] Starting team purse remaining synchronization...");
        
        List<Team> teams = teamRepository.findAll();
        int updatedCount = 0;
        
        for (Team team : teams) {
            Hibernate.initialize(team.getPlayers());
            int spent = team.getPlayers().stream()
                    .filter(p -> p.getStatus() == Player.PlayerStatus.SOLD)
                    .mapToInt(p -> p.getSoldPrice() != null ? p.getSoldPrice() : 0)
                    .sum();
            
            Integer actualPurseRemaining = 100000 - spent;
            
            // Check if DB column is out-of-sync
            if (!actualPurseRemaining.equals(team.getRawPurseRemaining())) {
                log.warn("[WBPL Startup] Team '{}' (ID: {}) has out-of-sync purse! DB has {}, actual calculated is {}. Syncing...",
                        team.getTeamName(), team.getId(), team.getRawPurseRemaining(), actualPurseRemaining);
                
                team.setPurseRemaining(actualPurseRemaining);
                teamRepository.save(team);
                updatedCount++;
            }
        }
        
        log.info("[WBPL Startup] Team purse remaining synchronization completed. Updated {} out-of-sync team(s).", updatedCount);
    }
}

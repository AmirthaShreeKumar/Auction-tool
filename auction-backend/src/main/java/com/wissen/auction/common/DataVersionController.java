package com.wissen.auction.common;

import com.wissen.auction.player.PlayerRepository;
import com.wissen.auction.team.TeamRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Lightweight endpoint that returns a tiny fingerprint of the current data state.
 * The frontend uses this to decide whether it needs to re-fetch the full player/team
 * payload, or if the locally cached copy is still valid.
 *
 * Response is ~60 bytes — orders of magnitude smaller than the full data payload.
 */
@RestController
@RequestMapping("/api/{city}")
@RequiredArgsConstructor
public class DataVersionController {

    private final PlayerRepository playerRepository;
    private final TeamRepository teamRepository;

    @GetMapping("/data-version")
    public ResponseEntity<Map<String, String>> getDataVersion(@PathVariable String city) {
        String fingerprint = playerRepository.computeDataFingerprint(city);
        long teamCount = teamRepository.countByCityLower(city);
        String hash = fingerprint + "_" + teamCount;
        String timestamp = java.time.LocalDateTime.now().format(java.time.format.DateTimeFormatter.ISO_DATE_TIME);
        return ResponseEntity.ok(Map.of("hash", hash, "timestamp", timestamp));
    }
}

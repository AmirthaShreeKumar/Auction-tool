package com.wissen.auction.player;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

/**
 * PlayerController – REST endpoints for player management.
 *
 * All routes are city-scoped via the JWT token (jwtCity attribute).
 * Admins: full CRUD + Excel import.
 * Guests: read-only.
 *
 * Base path: /api/{city}/players
 * (The {city} path param is cross-validated against the JWT city.)
 */
@RestController
@RequestMapping("/api/{city}/players")
@RequiredArgsConstructor
public class PlayerController {

    private final PlayerService playerService;

    /** GET /api/{city}/players – list all players for this city */
    @GetMapping
    public ResponseEntity<List<PlayerDTO>> listPlayers(@PathVariable String city) {
        return ResponseEntity.ok(playerService.getPlayersByCity(city));
    }

    /** GET /api/{city}/players/{id} – single player */
    @GetMapping("/{id}")
    public ResponseEntity<PlayerDTO> getPlayer(@PathVariable String city,
                                               @PathVariable Long id) {
        return ResponseEntity.ok(playerService.getPlayerById(id));
    }

    /** GET /api/{city}/players/queue – ordered auction queue */
    @GetMapping("/queue")
    public ResponseEntity<List<PlayerDTO>> getQueue(@PathVariable String city) {
        return ResponseEntity.ok(playerService.getAuctionQueue(city));
    }

    /** POST /api/{city}/players – create a player (Admin only) */
    @PostMapping
    public ResponseEntity<PlayerDTO> createPlayer(@PathVariable String city,
                                                   @Valid @RequestBody PlayerRequest request,
                                                   HttpServletRequest httpReq) {
        String jwtCity = (String) httpReq.getAttribute("jwtCity");
        validateCity(city, jwtCity);
        return ResponseEntity.ok(playerService.createPlayer(request, jwtCity));
    }

    /** PUT /api/{city}/players/{id} – update a player (Admin only) */
    @PutMapping("/{id}")
    public ResponseEntity<PlayerDTO> updatePlayer(@PathVariable String city,
                                                   @PathVariable Long id,
                                                   @Valid @RequestBody PlayerRequest request,
                                                   HttpServletRequest httpReq) {
        String jwtCity = (String) httpReq.getAttribute("jwtCity");
        validateCity(city, jwtCity);
        return ResponseEntity.ok(playerService.updatePlayer(id, request, jwtCity));
    }

    /** DELETE /api/{city}/players/{id} – delete a player (Admin only) */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePlayer(@PathVariable String city,
                                              @PathVariable Long id,
                                              HttpServletRequest httpReq) {
        String jwtCity = (String) httpReq.getAttribute("jwtCity");
        validateCity(city, jwtCity);
        playerService.deletePlayer(id, jwtCity);
        return ResponseEntity.noContent().build();
    }

    /** POST /api/{city}/players/import – bulk Excel import (Admin only) */
    @PostMapping(value = "/import", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<List<PlayerDTO>> importPlayers(@PathVariable String city,
                                                          @RequestParam("file") MultipartFile file,
                                                          HttpServletRequest httpReq) throws IOException {
        String jwtCity = (String) httpReq.getAttribute("jwtCity");
        validateCity(city, jwtCity);
        return ResponseEntity.ok(playerService.importFromExcel(file, jwtCity));
    }

    private void validateCity(String pathCity, String jwtCity) {
        if (jwtCity != null && !jwtCity.equalsIgnoreCase(pathCity)) {
            throw new SecurityException("You are not authorized to access data for city: " + pathCity);
        }
    }
}

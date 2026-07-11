package com.wissen.auction.team;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * TeamController – REST endpoints for franchise team management.
 *
 * Base path: /api/{city}/teams
 * All writes are Admin-only. Reads are accessible to both Admin and Guest.
 */
@RestController
@RequestMapping("/api/{city}/teams")
@RequiredArgsConstructor
public class TeamController {

    private final TeamService teamService;
    private final LogoGenerationService logoGenerationService;

    /** GET /api/{city}/teams – all teams for this city (optionally since a timestamp) */
    @GetMapping
    public ResponseEntity<List<TeamDTO>> listTeams(
            @PathVariable String city,
            @RequestParam(required = false) @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE_TIME) java.time.LocalDateTime since) {
        return ResponseEntity.ok(teamService.getTeamsByCity(city, since));
    }

    /** GET /api/{city}/teams/{id} – single team with roster */
    @GetMapping("/{id}")
    public ResponseEntity<TeamDTO> getTeam(@PathVariable String city,
                                            @PathVariable Long id) {
        return ResponseEntity.ok(teamService.getTeamById(id));
    }

    /** GET /api/{city}/teams/{id}/logo – returns logo on-demand */
    @GetMapping("/{id}/logo")
    public ResponseEntity<java.util.Map<String, String>> getTeamLogo(@PathVariable String city,
                                                                      @PathVariable Long id) {
        return ResponseEntity.ok(teamService.getTeamLogo(id));
    }

    /** POST /api/{city}/teams – create team (Admin only) */
    @PostMapping
    public ResponseEntity<TeamDTO> createTeam(@PathVariable String city,
                                               @Valid @RequestBody TeamRequest request,
                                               HttpServletRequest httpReq) {
        String jwtCity = (String) httpReq.getAttribute("jwtCity");
        validateCity(city, jwtCity);
        return ResponseEntity.ok(teamService.createTeam(request, jwtCity));
    }

    /** PUT /api/{city}/teams/{id} – update team name/owner (Admin only) */
    @PutMapping("/{id}")
    public ResponseEntity<TeamDTO> updateTeam(@PathVariable String city,
                                               @PathVariable Long id,
                                               @Valid @RequestBody TeamRequest request,
                                               HttpServletRequest httpReq) {
        String jwtCity = (String) httpReq.getAttribute("jwtCity");
        validateCity(city, jwtCity);
        return ResponseEntity.ok(teamService.updateTeam(id, request, jwtCity));
    }

    /** DELETE /api/{city}/teams/{id} – delete team (Admin only) */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTeam(@PathVariable String city,
                                            @PathVariable Long id,
                                            HttpServletRequest httpReq) {
        String jwtCity = (String) httpReq.getAttribute("jwtCity");
        validateCity(city, jwtCity);
        teamService.deleteTeam(id, jwtCity);
        return ResponseEntity.noContent().build();
    }

    /**
     * POST /api/{city}/teams/generate-logo – trigger async AI logo generation (Admin only).
     * Returns 202 Accepted immediately. The SVG is saved to the team once generation completes;
     * the frontend picks it up on the next team list refresh.
     */
    @PostMapping("/generate-logo")
    public ResponseEntity<java.util.Map<String, String>> generateLogo(@PathVariable String city,
                                                                       @RequestBody java.util.Map<String, String> request,
                                                                       HttpServletRequest httpReq) {
        String jwtCity = (String) httpReq.getAttribute("jwtCity");
        validateCity(city, jwtCity);
        String teamIdStr  = request.get("teamId");
        String teamName   = request.get("teamName");
        String themeColor = request.get("themeColor");
        if (teamIdStr == null) {
            throw new IllegalArgumentException("teamId is required for logo generation.");
        }
        logoGenerationService.generateLogoAsync(Long.parseLong(teamIdStr), teamName, themeColor);
        return ResponseEntity.accepted().body(java.util.Map.of("status", "generating"));
    }

    /** POST /api/{city}/teams/{teamId}/release-player – release a player from the team (Admin only) */
    @PostMapping("/{teamId}/release-player")
    public ResponseEntity<TeamDTO> releasePlayer(@PathVariable String city,
                                                  @PathVariable Long teamId,
                                                  @RequestBody java.util.Map<String, Long> request,
                                                  HttpServletRequest httpReq) {
        String jwtCity = (String) httpReq.getAttribute("jwtCity");
        validateCity(city, jwtCity);
        Long playerId = request.get("playerId");
        return ResponseEntity.ok(teamService.releasePlayer(teamId, playerId, jwtCity));
    }

    private void validateCity(String pathCity, String jwtCity) {
        if (jwtCity != null && !jwtCity.equalsIgnoreCase(pathCity)) {
            throw new SecurityException("You are not authorized to access data for city: " + pathCity);
        }
    }
}

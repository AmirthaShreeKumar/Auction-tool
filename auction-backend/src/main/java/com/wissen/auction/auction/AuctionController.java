package com.wissen.auction.auction;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * AuctionController – REST endpoints for the live auction process.
 *
 * Base path: /api/{city}/auction
 *
 * GET endpoints: accessible by both Admin and Guest (live view).
 * POST/PUT endpoints: Admin only.
 */
@RestController
@RequestMapping("/api/{city}/auction")
@RequiredArgsConstructor
public class AuctionController {

    private final AuctionService auctionService;

    // ---- READ ----

    /**
     * GET /api/{city}/auction/state
     * Returns the full current auction state: active player, queue, teams, current bid.
     * Used by both admin and guest live view.
     */
    @GetMapping("/state")
    public ResponseEntity<AuctionStateDTO> getAuctionState(@PathVariable String city) {
        return ResponseEntity.ok(auctionService.getAuctionState(city));
    }

    /**
     * GET /api/{city}/auction/bids
     * Returns the full bid history for a city (all sold/bid records).
     */
    @GetMapping("/bids")
    public ResponseEntity<List<BidLogDTO>> getBidHistory(@PathVariable String city) {
        return ResponseEntity.ok(auctionService.getBidHistoryDTOs(city));
    }

    // ---- ADMIN ACTIONS ----

    /**
     * POST /api/{city}/auction/bid
     * Place a bid for a team. Admin clicks on behalf of a team.
     * Body: { playerId, teamId, increment (500 or 1000) }
     */
    @PostMapping("/bid")
    public ResponseEntity<BidResponseDTO> placeBid(@PathVariable String city,
                                                    @Valid @RequestBody BidRequest request,
                                                    HttpServletRequest httpReq) {
        String jwtCity = (String) httpReq.getAttribute("jwtCity");
        validateCity(city, jwtCity);

        BidResponseDTO response = auctionService.placeBid(
                request.getPlayerId(),
                request.getTeamId(),
                request.getIncrement(),
                jwtCity
        );
        return ResponseEntity.ok(response);
    }

    /**
     * POST /api/{city}/auction/revert
     * Revert (undo) the last bid for the current player.
     * Body: { playerId }
     */
    @PostMapping("/revert")
    public ResponseEntity<BidResponseDTO> revertLastBid(@PathVariable String city,
                                                              @RequestBody Map<String, Long> body,
                                                              HttpServletRequest httpReq) {
        String jwtCity = (String) httpReq.getAttribute("jwtCity");
        validateCity(city, jwtCity);

        Long playerId = body.get("playerId");
        return ResponseEntity.ok(auctionService.revertLastBid(playerId, jwtCity));
    }

    /**
     * POST /api/{city}/auction/sell
     * Mark the active player as sold to the highest bidder.
     * Body: { playerId, teamId, finalPrice }
     */
    @PostMapping("/sell")
    public ResponseEntity<com.wissen.auction.player.PlayerDTO> markSold(
            @PathVariable String city,
            @RequestBody SellRequest request,
            HttpServletRequest httpReq) {

        String jwtCity = (String) httpReq.getAttribute("jwtCity");
        validateCity(city, jwtCity);

        return ResponseEntity.ok(auctionService.markSold(
                request.getPlayerId(),
                request.getTeamId(),
                request.getFinalPrice(),
                jwtCity
        ));
    }

    /**
     * POST /api/{city}/auction/pass
     * Mark the current player as passed (skipped / unsold this round).
     * Body: { playerId }
     */
    @PostMapping("/pass")
    public ResponseEntity<com.wissen.auction.player.PlayerDTO> passPlayer(
            @PathVariable String city,
            @RequestBody Map<String, Long> body,
            HttpServletRequest httpReq) {

        String jwtCity = (String) httpReq.getAttribute("jwtCity");
        validateCity(city, jwtCity);

        Long playerId = body.get("playerId");
        return ResponseEntity.ok(auctionService.passPlayer(playerId, jwtCity));
    }

    /**
     * POST /api/{city}/auction/re-auction
     * Reset all PASSED players back to UNSOLD for a re-auction round.
     */
    @PostMapping("/re-auction")
    public ResponseEntity<List<com.wissen.auction.player.PlayerDTO>> reAuction(
            @PathVariable String city,
            HttpServletRequest httpReq) {

        String jwtCity = (String) httpReq.getAttribute("jwtCity");
        validateCity(city, jwtCity);

        return ResponseEntity.ok(auctionService.resetPassedPlayers(jwtCity));
    }

    // ---- Helpers ----

    private void validateCity(String pathCity, String jwtCity) {
        if (jwtCity != null && !jwtCity.equalsIgnoreCase(pathCity)) {
            throw new SecurityException("You are not authorized to manage auction for city: " + pathCity);
        }
    }

    @Data
    public static class SellRequest {
        private Long playerId;
        private Long teamId;
        private Integer finalPrice;
    }
}

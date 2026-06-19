package com.wissen.auction.auction;

import lombok.Builder;
import lombok.Data;

import java.util.List;

/**
 * Response DTO returned after a bid is placed.
 */
@Data
@Builder
public class BidResponseDTO {

    private Long playerId;
    private Long teamId;
    private String teamName;
    private Integer bidAmount;
    private List<BidEntry> recentBids;

    @Data
    @Builder
    public static class BidEntry {
        private String teamName;
        private Integer bidAmount;
        private String createdAt;
    }
}

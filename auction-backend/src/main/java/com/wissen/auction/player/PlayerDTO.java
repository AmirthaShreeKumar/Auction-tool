package com.wissen.auction.player;

import com.wissen.auction.auction.BidLog;
import lombok.Builder;
import lombok.Data;

import java.util.List;

/**
 * Response DTO for Player – safe to send to the frontend.
 * Maps the frontend's data model exactly.
 */
@Data
@Builder
public class PlayerDTO {

    private Long id;
    private String wissenId;
    private String fullName;
    private String email;
    private String gender;
    private String location;
    private String skillLevel;
    private String yearsOfExperience;
    private String mobileNumber;
    private String imageUrl;
    private Integer basePrice;
    private String status;       // UNSOLD | SOLD | PASSED
    private Integer soldPrice;
    private String soldTeam;     // team name or null
    private Long soldTeamId;
    private List<BidLogDTO> recentBids;
    private PlayerStatsDTO stats;

    @Data
    @Builder
    public static class PlayerStatsDTO {
        private Integer matchesPlayed;
        private Integer matchesWon;
        private Integer matchesLost;
    }

    @Data
    @Builder
    public static class BidLogDTO {
        private Long id;
        private String teamName;
        private Integer bidAmount;
        private String createdAt;
    }

    public static PlayerDTO from(Player p) {
        return PlayerDTO.builder()
                .id(p.getId())
                .wissenId(p.getWissenId())
                .fullName(p.getFullName())
                .email(p.getEmail())
                .gender(p.getGender() != null ? p.getGender().name() : null)
                .location(p.getLocation())
                .skillLevel(p.getSkillLevel() != null ? p.getSkillLevel().name() : null)
                .yearsOfExperience(p.getYearsOfExperience())
                .mobileNumber(p.getMobileNumber())
                .imageUrl(p.getImageUrl())
                .basePrice(p.getBasePrice())
                .status(p.getStatus() != null ? p.getStatus().name() : "UNSOLD")
                .soldPrice(p.getSoldPrice())
                .soldTeam(p.getSoldTeam() != null ? p.getSoldTeam().getTeamName() : null)
                .soldTeamId(p.getSoldTeam() != null ? p.getSoldTeam().getId() : null)
                .stats(p.getStats() != null ? PlayerStatsDTO.builder()
                        .matchesPlayed(p.getStats().getMatchesPlayed())
                        .matchesWon(p.getStats().getMatchesWon())
                        .matchesLost(p.getStats().getMatchesLost())
                        .build() : null)
                .build();
    }

    /**
     * Slim version for list endpoints — excludes the imageUrl (base64 photo).
     * This keeps the bulk player list response small and fast.
     * Photos are loaded on demand via GET /api/{city}/players/{id}.
     */
    public static PlayerDTO fromSlim(Player p) {
        PlayerDTO dto = from(p);
        dto.setImageUrl(null);
        return dto;
    }
}

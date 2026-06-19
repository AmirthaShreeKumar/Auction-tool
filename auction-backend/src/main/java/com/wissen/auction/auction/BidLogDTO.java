package com.wissen.auction.auction;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class BidLogDTO {
    private Long id;
    private String teamName;
    private Integer bidAmount;
    private String location;
    private String createdAt;
    private PlayerInfo player;

    @Data
    @Builder
    public static class PlayerInfo {
        private Long id;
        private String wissenId;
        private String fullName;
        private String skillLevel;
        private String gender;
        private Integer basePrice;
    }

    public static BidLogDTO from(BidLog log) {
        return BidLogDTO.builder()
                .id(log.getId())
                .teamName(log.getTeamName())
                .bidAmount(log.getBidAmount())
                .location(log.getLocation())
                .createdAt(log.getCreatedAt() != null ? log.getCreatedAt().toString() : "")
                .player(log.getPlayer() != null ? PlayerInfo.builder()
                        .id(log.getPlayer().getId())
                        .wissenId(log.getPlayer().getWissenId())
                        .fullName(log.getPlayer().getFullName())
                        .skillLevel(log.getPlayer().getSkillLevel() != null ? log.getPlayer().getSkillLevel().name() : null)
                        .gender(log.getPlayer().getGender() != null ? log.getPlayer().getGender().name() : null)
                        .basePrice(log.getPlayer().getBasePrice())
                        .build() : null)
                .build();
    }
}

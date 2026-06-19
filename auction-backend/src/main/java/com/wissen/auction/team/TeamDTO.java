package com.wissen.auction.team;

import com.wissen.auction.player.PlayerDTO;
import lombok.Builder;
import lombok.Data;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Response DTO for Team – mirrors the frontend team model.
 */
@Data
@Builder
public class TeamDTO {

    private Long id;
    private String teamName;
    private String ownerName;
    private String location;
    private String themeColor;
    private String logoUrl;
    private String logoSvg;
    private Integer purseRemaining;
    private Integer totalPlayers;
    private Integer femalePlayers;
    private Integer beginnerPlayers;
    private List<PlayerDTO> players;

    public static TeamDTO from(Team t) {
        List<PlayerDTO> playerDTOs = t.getPlayers() != null
                ? t.getPlayers().stream().map(PlayerDTO::from).collect(Collectors.toList())
                : List.of();

        int dynamicTotal = playerDTOs.size();
        int dynamicFemale = (int) playerDTOs.stream().filter(p -> "Female".equalsIgnoreCase(p.getGender())).count();
        int dynamicBeginner = (int) playerDTOs.stream().filter(p -> "Beginner".equalsIgnoreCase(p.getSkillLevel())).count();
        int spent = playerDTOs.stream().mapToInt(p -> p.getSoldPrice() != null ? p.getSoldPrice() : 0).sum();
        int dynamicPurse = 100000 - spent;

        return TeamDTO.builder()
                .id(t.getId())
                .teamName(t.getTeamName())
                .ownerName(t.getOwnerName())
                .location(t.getLocation())
                .themeColor(t.getThemeColor())
                .logoUrl(t.getLogoUrl())
                .logoSvg(t.getLogoSvg())
                .purseRemaining(dynamicPurse)
                .totalPlayers(dynamicTotal)
                .femalePlayers(dynamicFemale)
                .beginnerPlayers(dynamicBeginner)
                .players(playerDTOs)
                .build();
    }
}

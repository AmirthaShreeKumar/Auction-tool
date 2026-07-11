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
    private String logoSvgHash;
    private String logoUrlHash;
    private Integer purseRemaining;
    private Integer totalPlayers;
    private Integer femalePlayers;
    private Integer beginnerPlayers;
    private List<PlayerDTO> players;

    public static TeamDTO from(Team t) {
        List<PlayerDTO> playerDTOs = t.getPlayers() != null
                ? t.getPlayers().stream().map(PlayerDTO::fromSlimForTeam).collect(Collectors.toList())
                : List.of();
        return from(t, playerDTOs);
    }

    public static TeamDTO from(Team t, List<PlayerDTO> playerDTOs) {
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

    public static TeamDTO fromSlim(Team t, List<PlayerDTO> playerDTOs) {
        TeamDTO dto = from(t, playerDTOs);
        dto.setLogoSvg(null);
        dto.setLogoUrl(null);
        if (t.getLogoSvg() != null) {
            dto.setLogoSvgHash(Integer.toHexString(t.getLogoSvg().hashCode()));
        }
        if (t.getLogoUrl() != null) {
            dto.setLogoUrlHash(Integer.toHexString(t.getLogoUrl().hashCode()));
        }
        return dto;
    }

    public static TeamDTO fromSlimView(TeamSlimView t, List<PlayerDTO> playerDTOs) {
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
                .purseRemaining(dynamicPurse)
                .totalPlayers(dynamicTotal)
                .femalePlayers(dynamicFemale)
                .beginnerPlayers(dynamicBeginner)
                .logoSvgHash(t.getLogoSvgHash() != null ? Integer.toHexString(t.getLogoSvgHash()) : null)
                .logoUrlHash(t.getLogoUrlHash() != null ? Integer.toHexString(t.getLogoUrlHash()) : null)
                .players(playerDTOs)
                .build();
    }
}

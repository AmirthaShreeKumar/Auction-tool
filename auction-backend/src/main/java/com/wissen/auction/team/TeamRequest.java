package com.wissen.auction.team;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * Request DTO for creating or updating a team.
 */
@Data
public class TeamRequest {

    @NotBlank(message = "Team name is required")
    private String teamName;

    @NotBlank(message = "Owner name is required")
    private String ownerName;

    private String themeColor;
    private String logoUrl;
    private String logoSvg;

    // location is always inferred from the authenticated user's city claim
}

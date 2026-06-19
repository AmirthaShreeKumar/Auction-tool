package com.wissen.auction.player;

import jakarta.validation.constraints.*;
import lombok.Data;

/**
 * Request DTO for creating or updating a player.
 */
@Data
public class PlayerRequest {

    @NotBlank(message = "Wissen ID is required")
    private String wissenId;

    @NotBlank(message = "Full name is required")
    private String fullName;

    @Email(message = "Valid email is required")
    @NotBlank
    private String email;

    @NotBlank
    private String gender;          // "Male" | "Female"

    @NotBlank
    private String skillLevel;      // "Beginner" | "Intermediate" | "Advanced"

    @Min(0) @Max(50)
    private Integer yearsOfExperience;

    private String mobileNumber;

    private String imageUrl;

    private Integer matchesPlayed;
    private Integer matchesWon;
    private Integer matchesLost;

    @Min(1000)
    private Integer basePrice;

    // location is inferred from JWT token (city claim) – not accepted from body
}

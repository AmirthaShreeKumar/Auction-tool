package com.wissen.auction.auction;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

/**
 * Request body for placing a bid on the current active player.
 */
@Data
public class BidRequest {

    /** DB id of the player being auctioned */
    @NotNull
    private Long playerId;

    /** DB id of the team placing the bid */
    @NotNull
    private Long teamId;

    /** Bid amount in points (must be >= base price + increment) */
    @Min(0)
    private Integer bidAmount;

    /** Increment type: 500 or 1000 */
    private Integer increment;
}

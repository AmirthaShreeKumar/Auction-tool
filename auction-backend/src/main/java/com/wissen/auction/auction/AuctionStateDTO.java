package com.wissen.auction.auction;

import com.wissen.auction.player.PlayerDTO;
import com.wissen.auction.team.TeamDTO;
import lombok.Builder;
import lombok.Data;

import java.util.List;

/**
 * Snapshot of the current auction state for a city.
 * Used by both admin (controls) and guest (live view).
 */
@Data
@Builder
public class AuctionStateDTO {

    /** Current player up for auction */
    private PlayerDTO activePlayer;

    /** Current highest bid amount */
    private Integer currentBid;

    /** Team name of the highest bidder */
    private String highestBidderTeam;

    /** Remaining auction queue (ordered) */
    private List<PlayerDTO> auctionQueue;

    /** Index of active player in the queue */
    private Integer currentAuctionIndex;

    /** City context */
    private String location;

    /** All teams in this city (for bid buttons) */
    private List<TeamDTO> cityTeams;
}

package com.wissen.auction.auction;

import com.wissen.auction.player.Player;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * Stores an individual bid event during an auction.
 * The last 5 bids per player are kept for historical/audit purposes.
 */
@Entity
@Table(name = "bid_logs")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BidLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Player this bid belongs to */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "player_id", nullable = false)
    private Player player;

    /** Name of the team that placed the bid */
    @Column(name = "team_name", nullable = false)
    private String teamName;

    /** Bid amount in points */
    @Column(name = "bid_amount", nullable = false)
    private Integer bidAmount;

    @Column(name = "location", nullable = false)
    private String location;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}

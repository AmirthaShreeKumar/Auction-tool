package com.wissen.auction.player;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "player_stats")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PlayerStats {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Wissen ID used to map stats to a player (business key) */
    @Column(name = "wissen_id", unique = true)
    private String wissenId;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "wissen_id", referencedColumnName = "wissen_id", insertable = false, updatable = false)
    private Player player;

    @Column(name = "matches_played")
    private Integer matchesPlayed;

    @Column(name = "matches_won")
    private Integer matchesWon;

    @Column(name = "matches_lost")
    private Integer matchesLost;
}

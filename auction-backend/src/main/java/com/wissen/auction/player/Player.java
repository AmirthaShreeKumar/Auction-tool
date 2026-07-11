package com.wissen.auction.player;

import com.wissen.auction.team.Team;
import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.math.BigDecimal;

/**
 * Represents a badminton player in the auction pool.
 * Scoped to a city/location. Tracks skill, gender, base price, and sold status.
 */
@Entity
@Table(name = "players", uniqueConstraints = {
    @UniqueConstraint(name = "uk_players_wissen_id_location", columnNames = {"wissen_id", "location"})
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Player {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Employee / Wissen ID – unique per player per location */
    @Column(name = "wissen_id", nullable = false)
    @NotBlank
    private String wissenId;

    @Column(name = "full_name", nullable = false)
    @NotBlank
    private String fullName;

    @Email
    @Column(nullable = false)
    private String email;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Gender gender;

    /** City this player belongs to */
    @Column(nullable = false)
    private String location;

    @Enumerated(EnumType.STRING)
    @Column(name = "skill_level", nullable = false)
    private SkillLevel skillLevel;

    @Column(name = "years_of_experience")
    private String yearsOfExperience;

    @Column(name = "base_price", nullable = false)
    private Integer basePrice;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private PlayerStatus status = PlayerStatus.UNSOLD;

    /** Price at which the player was sold – null if not sold */
    @Column(name = "sold_price")
    private Integer soldPrice;

    /** Team that purchased the player – null if not sold */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sold_team_id")
    private Team soldTeam;

    @Column(name = "mobile_number")
    private String mobileNumber;

    @Column(name = "image_url", columnDefinition = "TEXT")
    private String imageUrl;

    @org.hibernate.annotations.Formula("LENGTH(image_url)")
    private Integer imageUrlHash;

    @OneToOne(mappedBy = "player", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private PlayerStats stats;

    @org.hibernate.annotations.UpdateTimestamp
    @Column(name = "updated_at")
    private java.time.LocalDateTime updatedAt;

    // ---- Enums ----

    public enum Gender { Male, Female }

    public enum SkillLevel { Beginner, Intermediate, Advanced }

    public enum PlayerStatus { UNSOLD, SOLD, PASSED }
}

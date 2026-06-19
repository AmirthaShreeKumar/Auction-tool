package com.wissen.auction.auth;

import jakarta.persistence.*;
import lombok.*;

/**
 * Application user – stores credentials and city/role binding.
 * Seeded via DataInitializer on first run.
 */
@Entity
@Table(name = "app_users")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AppUser {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String username;

    @Column(nullable = false)
    private String password;       // BCrypt-hashed

    /** 'admin' or 'guest' */
    @Column(nullable = false)
    private String role;

    /** 'Pune' | 'Mumbai' | 'Bangalore' */
    @Column(nullable = false)
    private String city;
}

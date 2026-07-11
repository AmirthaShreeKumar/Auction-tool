package com.wissen.auction.security;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

/**
 * Spring Security configuration:
 * - Stateless JWT sessions
 * - CORS from configured frontend origin
 * - Public: POST /api/auth/login
 * - Admin-only: create/update/delete players and teams, auction control
 * - Guest + Admin: GET endpoints for players, teams, auction state
 */
@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;

    @Value("${app.allowed.origins}")
    private String allowedOrigins;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                // Public endpoints (login + logout — logout just clears the cookie, no auth needed)
                .requestMatchers("/api/auth/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/*/players").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/*/players/**").permitAll()  // covers /{id}, /{id}/photo, /queue
                .requestMatchers(HttpMethod.GET, "/api/*/teams").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/*/teams/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/*/auction").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/*/auction/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/*/data-version").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/*/statistics").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/*/statistics/**").permitAll()
                // Admin-only write operations
                .requestMatchers(HttpMethod.POST,   "/api/*/players/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.PUT,    "/api/*/players/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/api/*/players/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.POST,   "/api/*/teams/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.PUT,    "/api/*/teams/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/api/*/teams/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.POST,   "/api/*/auction/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.PUT,    "/api/*/auction/**").hasRole("ADMIN")
                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        // Support comma-separated list of origins
        List<String> origins = List.of(allowedOrigins.split(","));
        config.setAllowedOrigins(origins);
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}

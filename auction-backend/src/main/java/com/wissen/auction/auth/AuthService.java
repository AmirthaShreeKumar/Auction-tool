package com.wissen.auction.auth;

import com.wissen.auction.security.JwtUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Map;

/**
 * AuthService handles login validation and JWT token generation.
 */
@Service
@RequiredArgsConstructor
public class AuthService {

    private final AppUserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtils jwtUtils;

    /**
     * Validates credentials and returns a JWT token with city + role claims.
     *
     * @param username plain username
     * @param password plain password
     * @return Map with token, role, city, username
     */
    public Map<String, Object> login(String username, String password) {
        AppUser user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Invalid username or password"));

        if (!passwordEncoder.matches(password, user.getPassword())) {
            throw new RuntimeException("Invalid username or password");
        }

        String token = jwtUtils.generateToken(user.getUsername(), user.getRole(), user.getCity());

        return Map.of(
                "token", token,
                "role", user.getRole(),
                "city", user.getCity(),
                "username", user.getUsername()
        );
    }
}

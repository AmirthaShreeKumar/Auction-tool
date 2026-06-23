package com.wissen.auction.auth;

import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * AuthController – login and logout.
 * POST /api/auth/login   → sets HttpOnly JWT cookie, returns role + city + username
 * POST /api/auth/logout  → clears the JWT cookie
 */
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @Value("${app.cookie.secure:true}")
    private boolean secureCookie;

    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(@Valid @RequestBody LoginRequest request,
                                                     HttpServletResponse httpResponse) {
        Map<String, Object> result = authService.login(request.getUsername(), request.getPassword());

        String token = (String) result.get("token");
        ResponseCookie cookie = ResponseCookie.from("wbpl_jwt", token)
                .httpOnly(true)
                .secure(secureCookie)
                .sameSite(secureCookie ? "None" : "Lax")
                .path("/")
                .maxAge(86400) // 24 hours, matches JWT expiry
                .build();
        httpResponse.addHeader("Set-Cookie", cookie.toString());

        // Return role/city/username but NOT the raw token — it lives in the cookie only
        return ResponseEntity.ok(Map.of(
                "role",     result.get("role"),
                "city",     result.get("city"),
                "username", result.get("username")
        ));
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(HttpServletResponse httpResponse) {
        ResponseCookie clear = ResponseCookie.from("wbpl_jwt", "")
                .httpOnly(true)
                .secure(secureCookie)
                .sameSite(secureCookie ? "None" : "Lax")
                .path("/")
                .maxAge(0)
                .build();
        httpResponse.addHeader("Set-Cookie", clear.toString());
        return ResponseEntity.noContent().build();
    }

    @Data
    public static class LoginRequest {
        @NotBlank
        private String username;
        @NotBlank
        private String password;
        private String city;
    }
}

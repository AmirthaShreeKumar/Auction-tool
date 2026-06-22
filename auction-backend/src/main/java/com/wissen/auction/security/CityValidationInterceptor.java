package com.wissen.auction.security;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.io.IOException;

/**
 * Ensures the city in the URL path always matches the city embedded in the JWT.
 *
 * This replaces the per-controller validateCity() pattern, which was error-prone
 * because any endpoint that forgot the call silently allowed cross-city access.
 *
 * Pattern matched: /api/{city}/**
 * Guests (no JWT) are exempt — they only hit public GET endpoints.
 */
@Component
public class CityValidationInterceptor implements HandlerInterceptor {

    @Override
    public boolean preHandle(HttpServletRequest request,
                             HttpServletResponse response,
                             Object handler) throws IOException {
        String jwtCity = (String) request.getAttribute("jwtCity");
        if (jwtCity == null) {
            // No JWT present — guest or unauthenticated request; Spring Security handles authorization.
            return true;
        }

        String uri = request.getRequestURI();
        // URI format: /api/{city}/...  → split gives ["", "api", "{city}", ...]
        String[] parts = uri.split("/");
        if (parts.length < 3) return true;

        String pathCity = parts[2];
        if (!jwtCity.equalsIgnoreCase(pathCity)) {
            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
            response.setContentType("application/json");
            response.getWriter().write(
                "{\"status\":403,\"error\":\"Forbidden\","
                + "\"message\":\"You are not authorized to access data for city: " + pathCity + "\"}"
            );
            return false;
        }
        return true;
    }
}

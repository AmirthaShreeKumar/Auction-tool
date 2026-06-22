package com.wissen.auction.team;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import com.google.genai.Client;
import com.google.genai.types.GenerateContentConfig;
import com.google.genai.types.GenerateContentResponse;

import java.util.List;

/**
 * Service to generate premium team logos using official Google Gen AI Java SDK.
 */
@Service
@RequiredArgsConstructor
public class LogoGenerationService {

    @Value("${gemini.api.key}")
    private String apiKey;

    private final TeamRepository teamRepository;

    /**
     * Fire-and-forget: generates a logo in a background thread and persists it on the team.
     * The caller receives a 202 immediately; the frontend picks up the SVG on next team refresh.
     */
    @Async
    public void generateLogoAsync(Long teamId, String teamName, String themeColor) {
        try {
            String svg = generateLogo(teamName, themeColor);
            teamRepository.findById(teamId).ifPresent(team -> {
                team.setLogoSvg(svg);
                teamRepository.save(team);
            });
        } catch (Exception e) {
            System.err.println("[AI Logo] Async generation failed for team " + teamId + ": " + e.getMessage());
        }
    }

    public String generateLogo(String teamName, String themeColor) {
        if (apiKey == null || apiKey.trim().isEmpty()) {
            throw new IllegalStateException("Gemini API key is not configured. Please set gemini.api.key in application.properties.");
        }

        String prompt = "Create a premium, professional sports franchise logo SVG for a team named \"" + teamName + "\".\n" +
                "Theme color: \"" + themeColor + "\".\n\n" +
                "Design Style Guidelines (Must match the visual quality of an official IPL / NBA / Premier League team logo):\n" +
                "1. Structure & Layout:\n" +
                "   - Background layer: Include dynamic, energetic elements extending outwards (e.g., majestic wings, sharp lightning flares, speed rays, or flame trails).\n" +
                "   - Midground layer: A sharp, geometric sports shield, crest, or pentagonal badge frame with thick borders and drop-shadow styling.\n" +
                "   - Foreground layer: A central, recognizable aggressive vector mascot or sports object emblem. IMPORTANT: The logo MUST contain a clear, recognizable central subject inside the crest. If the team name contains a mascot or animal keyword (like Hawk, Tiger, Wolf, etc.), draw that creature. If the team name is abstract (like 'Masters', 'Super Kings', 'Warriors', etc.), you MUST integrate a majestic, recognizable sports symbol—such as a sharp vector badminton racket, a shuttlecock, a burning firebird, a crown, a lightning bolt, a roaring lion, or a burning flame. Never generate empty/plain nested shields without a clear central mascot or object.\n" +
                "2. Aesthetics & Colors:\n" +
                "   - The primary theme color MUST be \"" + themeColor + "\".\n" +
                "   - Use a high-contrast secondary color (e.g., if theme is blue, pair it with gold or neon cyan; if theme is red, pair it with white or orange).\n" +
                "   - Integrate sophisticated gradients (<linearGradient> or <radialGradient> with multiple <stop> offsets) to give a metallic, 3D, or glowing neon texture.\n" +
                "   - Use thick black or dark stroke outlines (`stroke`, `stroke-width=\"2\"` or more, `stroke-linejoin=\"round\"`) to separate shapes and create a bold sticker/decal style typical of high-end sports logos.\n" +
                "3. Constraints (CRITICAL):\n" +
                "   - Strictly NO letters, NO words, NO numbers, and NO initials anywhere in the logo.\n" +
                "   - Do NOT output simple flat clipart, basic circles, squares, or cartoonish characters. It must look serious, aggressive, and premium.\n" +
                "   - Output ONLY the raw SVG XML matching standard properties (viewBox=\"0 0 120 120\", transparent background with fill=\"none\" or background=\"none\", and fully self-contained paths/polygons). Do not include markdown code block syntax (like ```xml) or HTML wrappers.\n" +
                "   - Keep the SVG XML clean, highly optimized, and lightweight (under 120 lines of XML and under 1000 characters). Do not output extremely verbose path coordinates or thousands of coordinate points, as it must generate and load very quickly.";

        // Robust list of prioritized fallback models based on available system capacities
        List<String> modelsToTry = List.of("gemini-2.0-flash", "gemini-2.5-flash", "gemini-flash-latest");
        Exception lastException = null;

        Client client = Client.builder()
            .apiKey(apiKey)
            .build();

        GenerateContentConfig config = GenerateContentConfig.builder()
            .temperature(0.3f)
            .maxOutputTokens(2048)
            .build();

        for (String modelName : modelsToTry) {
            int maxAttemptsPerModel = 2;
            for (int attempt = 1; attempt <= maxAttemptsPerModel; attempt++) {
                try {
                    System.out.println("[AI Logo] Trying model: " + modelName + " (Attempt " + attempt + ") using official SDK for team: " + teamName);
                    
                    GenerateContentResponse response = client.models.generateContent(modelName, prompt, config);
                    String rawText = response.text();
                    
                    if (rawText == null || rawText.trim().isEmpty()) {
                        throw new RuntimeException("Empty response body from Gemini SDK");
                    }

                    // Clean up and extract the SVG content specifically to bypass any introductory/concluding conversational text
                    String cleaned = rawText.trim();
                    int svgStart = cleaned.toLowerCase().indexOf("<svg");
                    int svgEnd = cleaned.toLowerCase().lastIndexOf("</svg>");
                    
                    if (svgStart != -1 && svgEnd != -1 && svgEnd > svgStart) {
                        cleaned = cleaned.substring(svgStart, svgEnd + 6); // include </svg> tag (6 characters)
                    } else {
                        // Fallback to basic markdown cleanup if standard tags are not found in expected order
                        if (cleaned.contains("```")) {
                            cleaned = cleaned.replaceAll("(?s)^```[a-zA-Z]*\\s*", "");
                            cleaned = cleaned.replaceAll("(?s)\\s*```$", "");
                        }
                    }
                    cleaned = cleaned.trim();
                    
                    // Basic validation: ensure it's actually an SVG
                    if (!cleaned.toLowerCase().contains("<svg")) {
                        throw new RuntimeException("Generated output does not contain a valid SVG XML tag");
                    }
                    
                    System.out.println("[AI Logo] Successfully generated logo using model: " + modelName + " via SDK");
                    return cleaned;
                } catch (Exception e) {
                    lastException = e;
                    System.err.println("[AI Logo] Model " + modelName + " (Attempt " + attempt + ") failed via SDK: " + e.getMessage());
                    
                    // If the model is not found (404), skip directly to the next model instead of retrying
                    if (e.getMessage() != null && (e.getMessage().contains("404") || e.getMessage().contains("not found") || e.getMessage().contains("Not Found") || e.getMessage().contains("404 Not Found"))) {
                        System.out.println("[AI Logo] Model " + modelName + " is not supported/found. Skipping directly to next fallback model.");
                        break;
                    }
                    
                    if (attempt < maxAttemptsPerModel) {
                        try {
                            Thread.sleep(600); // Quick wait before retry
                        } catch (InterruptedException ie) {
                            Thread.currentThread().interrupt();
                            throw new RuntimeException("Interrupted during SDK API retry wait", ie);
                        }
                    }
                }
            }
        }
        throw new RuntimeException("Failed to generate logo after trying multiple fallback models via SDK: " + lastException.getMessage(), lastException);
    }
}

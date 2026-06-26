package com.wissen.auction.common;

import com.wissen.auction.auth.AppUser;
import com.wissen.auction.auth.AppUserRepository;
import com.wissen.auction.player.Player;
import com.wissen.auction.player.PlayerRepository;
import com.wissen.auction.team.Team;
import com.wissen.auction.team.TeamRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * DataInitializer seeds the database with:
 * 1. Admin + Guest users for each city (Pune, Mumbai, Bangalore)
 * 2. Default teams for each city
 * 3. Sample players for each city
 *
 * Runs only if users table is empty (idempotent).
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final AppUserRepository userRepository;
    private final TeamRepository teamRepository;
    private final PlayerRepository playerRepository;
    private final PasswordEncoder passwordEncoder;
    private final javax.sql.DataSource dataSource;

    @Override
    public void run(String... args) {
        // NOTE: All one-time schema migrations (ALTER TABLE, constraint drops/adds, etc.)
        // have already been applied to the database and are intentionally removed here.
        // Running DDL on every startup locks tables and times out on Supabase.
        // Use Flyway or a one-off SQL script for any future schema changes.

        if (userRepository.count() == 0) {
            seedUsers();
        }
        if (teamRepository.count() == 0) {
            seedTeams();
        }
        if (playerRepository.count() == 0) {
            seedPlayers();
        }

        // Run player photo optimization in a background thread.
        // Delayed by 60s so the connection pool is free for normal API requests first.
        // Disabled: all existing photos have been optimized, and new photos are resized during upload/import.
        // This avoids background query loop locks and connection pool starvation with PgBouncer.
        /*
        new Thread(() -> {
            try {
                Thread.sleep(60_000);
                optimizeExistingPlayerPhotos();
            } catch (Exception e) {
                log.warn("Failed to run existing player photos optimization: {}", e.getMessage());
            }
        }).start();
        */

        log.info("DataInitializer complete.");
    }

    private void optimizeExistingPlayerPhotos() {
        log.info("Checking for unoptimized player photos in database (in background)...");
        // Fetch only IDs of players that have base64 image data — avoids loading all photo bytes at once.
        // Process one player at a time to stay within the small Supabase connection pool (size=3).
        java.util.List<Long> playerIds;
        try (java.sql.Connection conn = dataSource.getConnection();
             java.sql.PreparedStatement ps = conn.prepareStatement(
                     "SELECT id FROM players WHERE image_url LIKE 'data:image%'")) {
            java.sql.ResultSet rs = ps.executeQuery();
            playerIds = new java.util.ArrayList<>();
            while (rs.next()) {
                playerIds.add(rs.getLong(1));
            }
        } catch (Exception e) {
            log.warn("Could not query player IDs for photo optimization: {}", e.getMessage());
            return;
        }

        if (playerIds.isEmpty()) {
            log.info("No player photos require optimization.");
            return;
        }

        int count = 0;
        for (Long id : playerIds) {
            try {
                Player player = playerRepository.findById(id).orElse(null);
                if (player == null || player.getImageUrl() == null) continue;
                String currentUrl = player.getImageUrl();
                int commaIdx = currentUrl.indexOf(",");
                if (commaIdx == -1) continue;

                String header = currentUrl.substring(0, commaIdx);
                String base64Data = currentUrl.substring(commaIdx + 1);
                byte[] imageBytes = java.util.Base64.getDecoder().decode(base64Data);

                // Check dimensions – skip if already <= 200x200
                java.io.ByteArrayInputStream bais = new java.io.ByteArrayInputStream(imageBytes);
                java.awt.image.BufferedImage img = javax.imageio.ImageIO.read(bais);
                if (img != null && img.getWidth() <= 200 && img.getHeight() <= 200) {
                    continue;
                }

                String contentType = header.contains("png") ? "image/png"
                        : header.contains("gif") ? "image/gif" : "image/jpeg";

                byte[] resizedBytes = com.wissen.auction.player.PlayerService.resizeImage(imageBytes, contentType);
                String newBase64 = java.util.Base64.getEncoder().encodeToString(resizedBytes);
                player.setImageUrl(header + "," + newBase64);
                playerRepository.save(player);
                count++;

                // Small pause so we don't monopolize the DB connection pool
                Thread.sleep(200);
            } catch (Exception e) {
                log.warn("Failed to optimize photo for player id {}: {}", id, e.getMessage());
            }
        }

        if (count > 0) {
            log.info("Successfully optimized {} player photos in the database.", count);
        } else {
            log.info("No player photos required optimization.");
        }
    }

    // ---- Users ----

    private void seedUsers() {
        String[] cities = { "Pune", "Mumbai", "Bangalore" };
        for (String city : cities) {
            // Admin
            userRepository.save(AppUser.builder()
                    .username(city.toLowerCase() + "_admin")
                    .password(passwordEncoder.encode("admin123"))
                    .role("admin")
                    .city(city)
                    .build());

            // Guest
            userRepository.save(AppUser.builder()
                    .username(city.toLowerCase() + "_guest")
                    .password(passwordEncoder.encode("guest123"))
                    .role("guest")
                    .city(city)
                    .build());
        }

        log.info("Users seeded.");
    }

    // ---- Teams ----

    private void seedTeams() {
        saveTeam("Bangalore Badgers", "Sudhir Kumar", "Bangalore", "#ef4444"); // red
        saveTeam("Bangalore Smashers", "Nisha Srinath", "Bangalore", "#3b82f6"); // blue
        saveTeam("Mumbai Mavericks", "Vikrant Patil", "Mumbai", "#f59e0b"); // amber
        saveTeam("Mumbai Titans", "Rohit Deshmukh", "Mumbai", "#8b5cf6"); // purple
        saveTeam("Pune Pioneers", "Amol Kadam", "Pune", "#10b981"); // green
        saveTeam("Pune Warriors", "Sheetal Joshi", "Pune", "#ec4899"); // pink
        log.info("Teams seeded.");
    }

    private void saveTeam(String name, String owner, String city, String themeColor) {
        teamRepository.save(Team.builder()
                .teamName(name)
                .ownerName(owner)
                .themeColor(themeColor)
                .location(city)
                .purseRemaining(100000)
                .totalPlayers(0)
                .femalePlayers(0)
                .beginnerPlayers(0)
                .build());
    }

    // ---- Players ----

    private void seedPlayers() {
        // Bangalore
        savePlayer("WIS001", "Aditya Hegde", "aditya.hegde@wissen.com", Player.Gender.Male, "Bangalore",
                Player.SkillLevel.Advanced, 6, 15000);
        savePlayer("WIS002", "Sneha Rao", "sneha.rao@wissen.com", Player.Gender.Female, "Bangalore",
                Player.SkillLevel.Beginner, 1, 5000);
        savePlayer("WIS003", "Rohan Das", "rohan.das@wissen.com", Player.Gender.Male, "Bangalore",
                Player.SkillLevel.Intermediate, 3, 10000);
        savePlayer("WIS004", "Priya Nair", "priya.nair@wissen.com", Player.Gender.Female, "Bangalore",
                Player.SkillLevel.Beginner, 2, 5000);
        savePlayer("WIS005", "Vikram Shenoy", "vikram.shenoy@wissen.com", Player.Gender.Male, "Bangalore",
                Player.SkillLevel.Intermediate, 4, 10000);
        savePlayer("WIS006", "Ananya Bhat", "ananya.bhat@wissen.com", Player.Gender.Female, "Bangalore",
                Player.SkillLevel.Advanced, 5, 15000);
        savePlayer("WIS007", "Rahul Kamath", "rahul.kamath@wissen.com", Player.Gender.Male, "Bangalore",
                Player.SkillLevel.Beginner, 1, 5000);

        // Mumbai
        savePlayer("WIS008", "Amit Sharma", "amit.sharma@wissen.com", Player.Gender.Male, "Mumbai",
                Player.SkillLevel.Advanced, 7, 15000);
        savePlayer("WIS009", "Neha Patil", "neha.patil@wissen.com", Player.Gender.Female, "Mumbai",
                Player.SkillLevel.Beginner, 1, 5000);
        savePlayer("WIS010", "Karan Johar", "karan.johar@wissen.com", Player.Gender.Male, "Mumbai",
                Player.SkillLevel.Intermediate, 3, 10000);
        savePlayer("WIS011", "Deepa Mehta", "deepa.mehta@wissen.com", Player.Gender.Female, "Mumbai",
                Player.SkillLevel.Beginner, 2, 5000);
        savePlayer("WIS012", "Siddharth Malhotra", "siddharth.malhotra@wissen.com", Player.Gender.Male, "Mumbai",
                Player.SkillLevel.Intermediate, 4, 10000);
        savePlayer("WIS013", "Rhea Kapoor", "rhea.kapoor@wissen.com", Player.Gender.Female, "Mumbai",
                Player.SkillLevel.Advanced, 5, 15000);
        savePlayer("WIS014", "Varun Dhawan", "varun.dhawan@wissen.com", Player.Gender.Male, "Mumbai",
                Player.SkillLevel.Beginner, 1, 5000);

        // Pune
        savePlayer("WIS015", "Sachin Kulkarni", "sachin.kulkarni@wissen.com", Player.Gender.Male, "Pune",
                Player.SkillLevel.Advanced, 8, 15000);
        savePlayer("WIS016", "Pooja Joshi", "pooja.joshi@wissen.com", Player.Gender.Female, "Pune",
                Player.SkillLevel.Beginner, 1, 5000);
        savePlayer("WIS017", "Ajay Deshpande", "ajay.deshpande@wissen.com", Player.Gender.Male, "Pune",
                Player.SkillLevel.Intermediate, 3, 10000);
        savePlayer("WIS018", "Tanvi Gupte", "tanvi.gupte@wissen.com", Player.Gender.Female, "Pune",
                Player.SkillLevel.Beginner, 2, 5000);
        savePlayer("WIS019", "Manoj Shinde", "manoj.shinde@wissen.com", Player.Gender.Male, "Pune",
                Player.SkillLevel.Intermediate, 5, 10000);
        savePlayer("WIS020", "Snehal Shinde", "snehal.shinde@wissen.com", Player.Gender.Female, "Pune",
                Player.SkillLevel.Advanced, 6, 15000);
        savePlayer("WIS021", "Kunal More", "kunal.more@wissen.com", Player.Gender.Male, "Pune",
                Player.SkillLevel.Beginner, 1, 5000);

        log.info("Players seeded.");
    }

    private void savePlayer(String wissenId, String fullName, String email,
            Player.Gender gender, String city,
            Player.SkillLevel skill, int exp, int basePrice) {
        playerRepository.save(Player.builder()
                .wissenId(wissenId)
                .fullName(fullName)
                .email(email)
                .gender(gender)
                .location(city)
                .skillLevel(skill)
                .yearsOfExperience(String.valueOf(exp))
                .basePrice(basePrice)
                .status(Player.PlayerStatus.UNSOLD)
                .build());
    }
}

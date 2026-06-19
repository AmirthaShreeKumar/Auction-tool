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
import org.springframework.jdbc.core.JdbcTemplate;
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

    private final AppUserRepository   userRepository;
    private final TeamRepository      teamRepository;
    private final PlayerRepository    playerRepository;
    private final PasswordEncoder     passwordEncoder;
    private final JdbcTemplate        jdbcTemplate;

    @Override
    public void run(String... args) {
        try {
            log.info("Checking and altering column sizes in teams and players tables if necessary...");
            jdbcTemplate.execute("ALTER TABLE teams ALTER COLUMN logo_url TYPE TEXT");
            jdbcTemplate.execute("ALTER TABLE teams ALTER COLUMN logo_svg TYPE TEXT");
            jdbcTemplate.execute("ALTER TABLE players ALTER COLUMN image_url TYPE TEXT");
            log.info("Tables columns altered to TEXT successfully.");
        } catch (Exception e) {
            log.warn("Note: Could not run ALTER TABLE query (columns might already be TEXT): {}", e.getMessage());
        }


        if (userRepository.count() == 0) {
            seedUsers();
        }
        if (teamRepository.count() == 0) {
            seedTeams();
        }
        if (playerRepository.count() == 0) {
            seedPlayers();
        }
        log.info("DataInitializer complete.");
    }


    // ---- Users ----

    private void seedUsers() {
        String[] cities = {"Pune", "Mumbai", "Bangalore"};
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
        saveTeam("Bangalore Badgers",  "Sudhir Kumar",   "Bangalore", "#ef4444"); // red
        saveTeam("Bangalore Smashers", "Nisha Srinath",  "Bangalore", "#3b82f6"); // blue
        saveTeam("Mumbai Mavericks",   "Vikrant Patil",  "Mumbai",    "#f59e0b"); // amber
        saveTeam("Mumbai Titans",      "Rohit Deshmukh", "Mumbai",    "#8b5cf6"); // purple
        saveTeam("Pune Pioneers",      "Amol Kadam",     "Pune",      "#10b981"); // green
        saveTeam("Pune Warriors",      "Sheetal Joshi",  "Pune",      "#ec4899"); // pink
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
        savePlayer("WIS001", "Aditya Hegde",       "aditya.hegde@wissen.com",       Player.Gender.Male,   "Bangalore", Player.SkillLevel.Advanced,     6, 15000);
        savePlayer("WIS002", "Sneha Rao",           "sneha.rao@wissen.com",           Player.Gender.Female, "Bangalore", Player.SkillLevel.Beginner,      1, 5000);
        savePlayer("WIS003", "Rohan Das",           "rohan.das@wissen.com",           Player.Gender.Male,   "Bangalore", Player.SkillLevel.Intermediate,  3, 10000);
        savePlayer("WIS004", "Priya Nair",          "priya.nair@wissen.com",          Player.Gender.Female, "Bangalore", Player.SkillLevel.Beginner,      2, 5000);
        savePlayer("WIS005", "Vikram Shenoy",       "vikram.shenoy@wissen.com",       Player.Gender.Male,   "Bangalore", Player.SkillLevel.Intermediate,  4, 10000);
        savePlayer("WIS006", "Ananya Bhat",         "ananya.bhat@wissen.com",         Player.Gender.Female, "Bangalore", Player.SkillLevel.Advanced,      5, 15000);
        savePlayer("WIS007", "Rahul Kamath",        "rahul.kamath@wissen.com",        Player.Gender.Male,   "Bangalore", Player.SkillLevel.Beginner,      1, 5000);

        // Mumbai
        savePlayer("WIS008", "Amit Sharma",         "amit.sharma@wissen.com",         Player.Gender.Male,   "Mumbai", Player.SkillLevel.Advanced,     7, 15000);
        savePlayer("WIS009", "Neha Patil",          "neha.patil@wissen.com",          Player.Gender.Female, "Mumbai", Player.SkillLevel.Beginner,      1, 5000);
        savePlayer("WIS010", "Karan Johar",         "karan.johar@wissen.com",         Player.Gender.Male,   "Mumbai", Player.SkillLevel.Intermediate,  3, 10000);
        savePlayer("WIS011", "Deepa Mehta",         "deepa.mehta@wissen.com",         Player.Gender.Female, "Mumbai", Player.SkillLevel.Beginner,      2, 5000);
        savePlayer("WIS012", "Siddharth Malhotra",  "siddharth.malhotra@wissen.com",  Player.Gender.Male,   "Mumbai", Player.SkillLevel.Intermediate,  4, 10000);
        savePlayer("WIS013", "Rhea Kapoor",         "rhea.kapoor@wissen.com",         Player.Gender.Female, "Mumbai", Player.SkillLevel.Advanced,      5, 15000);
        savePlayer("WIS014", "Varun Dhawan",        "varun.dhawan@wissen.com",        Player.Gender.Male,   "Mumbai", Player.SkillLevel.Beginner,      1, 5000);

        // Pune
        savePlayer("WIS015", "Sachin Kulkarni",     "sachin.kulkarni@wissen.com",     Player.Gender.Male,   "Pune", Player.SkillLevel.Advanced,     8, 15000);
        savePlayer("WIS016", "Pooja Joshi",         "pooja.joshi@wissen.com",         Player.Gender.Female, "Pune", Player.SkillLevel.Beginner,      1, 5000);
        savePlayer("WIS017", "Ajay Deshpande",      "ajay.deshpande@wissen.com",      Player.Gender.Male,   "Pune", Player.SkillLevel.Intermediate,  3, 10000);
        savePlayer("WIS018", "Tanvi Gupte",         "tanvi.gupte@wissen.com",         Player.Gender.Female, "Pune", Player.SkillLevel.Beginner,      2, 5000);
        savePlayer("WIS019", "Manoj Shinde",        "manoj.shinde@wissen.com",        Player.Gender.Male,   "Pune", Player.SkillLevel.Intermediate,  5, 10000);
        savePlayer("WIS020", "Snehal Shinde",       "snehal.shinde@wissen.com",       Player.Gender.Female, "Pune", Player.SkillLevel.Advanced,      6, 15000);
        savePlayer("WIS021", "Kunal More",          "kunal.more@wissen.com",          Player.Gender.Male,   "Pune", Player.SkillLevel.Beginner,      1, 5000);

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
                .yearsOfExperience(exp)
                .basePrice(basePrice)
                .status(Player.PlayerStatus.UNSOLD)
                .build());
    }
}

package com.wissen.auction.player;

import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.Base64;
import java.util.Set;

import com.wissen.auction.auction.BidLogRepository;

import java.io.IOException;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * PlayerService – all business logic for player management.
 *
 * Column order expected in Excel upload:
 * wissenId | fullName | email | gender | skillLevel | yearsOfExperience | basePrice
 */
@Service
@RequiredArgsConstructor
public class PlayerService {

    private final PlayerRepository playerRepository;
    private final BidLogRepository bidLogRepository;

    // ---- READ ----

    @Transactional(readOnly = true)
    public List<PlayerDTO> getPlayersByCity(String city) {
        return playerRepository.findByLocationIgnoreCase(city)
                .stream()
                .map(PlayerDTO::from)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public PlayerDTO getPlayerById(Long id) {
        Player p = findOrThrow(id);
        return PlayerDTO.from(p);
    }

    @Transactional(readOnly = true)
    public List<PlayerDTO> getAuctionQueue(String city) {
        return playerRepository.findAuctionQueue(city)
                .stream()
                .map(PlayerDTO::from)
                .collect(Collectors.toList());
    }

    // ---- CREATE ----

    @Transactional
    public PlayerDTO createPlayer(PlayerRequest req, String city) {
        if (playerRepository.existsByWissenId(req.getWissenId())) {
            throw new IllegalArgumentException("A player with Wissen ID " + req.getWissenId() + " already exists.");
        }

        Player player = Player.builder()
                .wissenId(req.getWissenId())
                .fullName(req.getFullName())
                .email(req.getEmail())
                .gender(Player.Gender.valueOf(req.getGender()))
                .location(city)
                .skillLevel(Player.SkillLevel.valueOf(req.getSkillLevel()))
                .yearsOfExperience(req.getYearsOfExperience())
                .mobileNumber(req.getMobileNumber())
                .imageUrl(req.getImageUrl())
                .basePrice(req.getBasePrice())
                .status(Player.PlayerStatus.UNSOLD)
                .build();

        if (req.getMatchesPlayed() != null || req.getMatchesWon() != null || req.getMatchesLost() != null) {
            PlayerStats stats = PlayerStats.builder()
                    .wissenId(req.getWissenId())
                    .matchesPlayed(req.getMatchesPlayed())
                    .matchesWon(req.getMatchesWon())
                    .matchesLost(req.getMatchesLost())
                    .build();
            player.setStats(stats);
        }

        return PlayerDTO.from(playerRepository.save(player));
    }

    // ---- UPDATE ----

    @CacheEvict(value = "auctionState", key = "#city")
    @Transactional
    public PlayerDTO updatePlayer(Long id, PlayerRequest req, String city) {
        Player player = findOrThrow(id);

        // Ensure player belongs to admin's city
        if (!player.getLocation().equalsIgnoreCase(city)) {
            throw new SecurityException("Cannot modify players from another city.");
        }

        // Check wissenId conflict with another player
        playerRepository.findByWissenId(req.getWissenId()).ifPresent(existing -> {
            if (!existing.getId().equals(id)) {
                throw new IllegalArgumentException("Wissen ID " + req.getWissenId() + " is already in use.");
            }
        });

        player.setWissenId(req.getWissenId());
        player.setFullName(req.getFullName());
        player.setEmail(req.getEmail());
        player.setGender(Player.Gender.valueOf(req.getGender()));
        player.setSkillLevel(Player.SkillLevel.valueOf(req.getSkillLevel()));
        player.setYearsOfExperience(req.getYearsOfExperience());
        player.setMobileNumber(req.getMobileNumber());
        player.setImageUrl(req.getImageUrl());
        player.setBasePrice(req.getBasePrice());

        if (req.getMatchesPlayed() != null || req.getMatchesWon() != null || req.getMatchesLost() != null) {
            if (player.getStats() == null) {
                PlayerStats stats = PlayerStats.builder().wissenId(req.getWissenId()).build();
                player.setStats(stats);
            } else {
                player.getStats().setWissenId(req.getWissenId());
            }
            player.getStats().setMatchesPlayed(req.getMatchesPlayed());
            player.getStats().setMatchesWon(req.getMatchesWon());
            player.getStats().setMatchesLost(req.getMatchesLost());
        } else if (player.getStats() != null) {
            player.getStats().setMatchesPlayed(null);
            player.getStats().setMatchesWon(null);
            player.getStats().setMatchesLost(null);
        }

        return PlayerDTO.from(playerRepository.save(player));
    }

    // ---- PHOTO UPLOAD ----

    private static final long MAX_PHOTO_SIZE = 2 * 1024 * 1024; // 2MB
    private static final Set<String> ALLOWED_IMAGE_TYPES = Set.of(
            "image/jpeg", "image/png", "image/webp", "image/gif"
    );

    /**
     * Upload a photo for a player. Converts the file to a Base64 data URI
     * and stores it in the imageUrl column. This approach is deployment-safe
     * (no filesystem dependency) and works with Docker/cloud deployments.
     */
    @Transactional
    public PlayerDTO uploadPhoto(Long id, MultipartFile photo, String city) throws IOException {
        Player player = findOrThrow(id);

        if (!player.getLocation().equalsIgnoreCase(city)) {
            throw new SecurityException("Cannot modify players from another city.");
        }

        // Validate content type
        String contentType = photo.getContentType();
        if (contentType == null || !ALLOWED_IMAGE_TYPES.contains(contentType.toLowerCase())) {
            throw new IllegalArgumentException(
                    "Invalid file type. Allowed types: JPEG, PNG, WebP, GIF");
        }

        // Validate file size
        if (photo.getSize() > MAX_PHOTO_SIZE) {
            throw new IllegalArgumentException(
                    "Photo size exceeds 2MB limit. Please compress or resize the image.");
        }

        // Convert to Base64 data URI
        byte[] bytes = photo.getBytes();
        String base64 = Base64.getEncoder().encodeToString(bytes);
        String dataUri = "data:" + contentType + ";base64," + base64;

        player.setImageUrl(dataUri);
        return PlayerDTO.from(playerRepository.save(player));
    }

    // ---- DELETE ----

    @Transactional
    public void deletePlayer(Long id, String city) {
        Player player = findOrThrow(id);
        if (!player.getLocation().equalsIgnoreCase(city)) {
            throw new SecurityException("Cannot delete players from another city.");
        }
        bidLogRepository.deleteByPlayer(player);
        playerRepository.delete(player);
    }

    // ---- EXCEL IMPORT ----

    @Transactional
    public List<PlayerDTO> importFromExcel(MultipartFile file, String city) throws IOException {
        Map<String, Player> toSaveMap = new LinkedHashMap<>();

        try (Workbook workbook = new XSSFWorkbook(file.getInputStream())) {
            Sheet sheet = workbook.getSheetAt(0);
            Row headerRow = sheet.getRow(0);
            if (headerRow == null) {
                throw new IllegalArgumentException("Excel file is empty or missing headers.");
            }

            int wissenIdCol = -1;
            int fullNameCol = -1;
            int nameFallbackCol = -1;
            int emailCol = -1;
            int emailIdFallbackCol = -1;
            int genderCol = -1;
            int skillCol = -1;
            int mobileCol = -1;
            int experienceCol = -1;
            int imageCol = -1;

            for (int col = 0; col < headerRow.getLastCellNum(); col++) {
                Cell cell = headerRow.getCell(col);
                if (cell == null) continue;
                String rawHeader = getCellString(headerRow, col);
                String header = normalizeHeader(rawHeader);
                if (header.isEmpty()) continue;

                switch (header) {
                    case "wissenid", "employeeid" -> wissenIdCol = col;
                    case "fullname", "employeename" -> fullNameCol = col;
                    case "name" -> nameFallbackCol = col;
                    case "email" -> emailCol = col;
                    case "emailid" -> emailIdFallbackCol = col;
                    case "gender" -> genderCol = col;
                    case "whatisyourskilllevel", "badmintonskilllevel", "skilllevel" -> skillCol = col;
                    case "mobilenumber", "mobile", "mobileno" -> mobileCol = col;
                    case "yearsofplayingexperience", "yearsofexperience", "experience" -> experienceCol = col;
                    case "uploadyourimage", "imageurl", "image" -> imageCol = col;
                }
            }

            if (fullNameCol == -1) {
                fullNameCol = nameFallbackCol;
            }
            if (emailCol == -1) {
                emailCol = emailIdFallbackCol;
            }

            if (emailCol == -1) {
                throw new IllegalArgumentException("Required column header 'Email' or 'Email ID' is missing.");
            }
            if (wissenIdCol == -1) {
                throw new IllegalArgumentException("Required column header 'Wissen ID' or 'Employee ID' is missing.");
            }
            if (fullNameCol == -1) {
                throw new IllegalArgumentException("Required column header 'Full Name' or 'Employee Name' is missing.");
            }
            if (genderCol == -1) {
                throw new IllegalArgumentException("Required column header 'Gender' is missing.");
            }
            if (skillCol == -1) {
                throw new IllegalArgumentException("Required column header 'Skill Level' or 'Badminton Skill Level' is missing.");
            }

            for (Row row : sheet) {
                if (row.getRowNum() == 0) continue; // skip header row

                // If the email field is empty, skip row
                String email = getCellStringSafe(row, emailCol);
                if (email == null || email.trim().isEmpty()) continue;

                String wissenId = getCellStringSafe(row, wissenIdCol).replaceAll("\\s+", "").toUpperCase();
                if (wissenId.isEmpty()) continue;

                String fullName        = getCellStringSafe(row, fullNameCol);
                String genderStr       = getCellStringSafe(row, genderCol).toUpperCase();
                String skillLevelStr   = getCellStringSafe(row, skillCol).toUpperCase();

                // Skip rows where required fields are blank — common in form exports
                // that have trailing rows or optional-response entries.
                if (fullName == null || fullName.trim().isEmpty()) continue;
                if (genderStr.isEmpty()) continue;
                if (skillLevelStr.isEmpty()) continue;

                String mobile = null;
                if (mobileCol != -1) {
                    mobile = getCellStringSafe(row, mobileCol);
                    if (mobile.trim().isEmpty()) {
                        mobile = null;
                    }
                }

                Integer yearsOfExperience = null;
                if (experienceCol != -1) {
                    String expStr = getCellStringSafe(row, experienceCol);
                    double expNum = getCellNumericSafe(row, experienceCol);
                    if (expNum > 0) {
                        yearsOfExperience = (int) expNum;
                    } else if (!expStr.trim().isEmpty()) {
                        String digits = expStr.replaceAll("[^0-9]", "");
                        if (!digits.isEmpty()) {
                            yearsOfExperience = Integer.parseInt(digits);
                        } else {
                            yearsOfExperience = 1;
                        }
                    }
                }

                String imageUrl = null;
                if (imageCol != -1) {
                    imageUrl = getCellStringSafe(row, imageCol);
                    if (imageUrl.trim().isEmpty()) {
                        imageUrl = null;
                    }
                }

                Player.Gender gender = Player.Gender.Male;
                if (genderStr.contains("FEMALE")) gender = Player.Gender.Female;

                Player.SkillLevel skillLevel = Player.SkillLevel.Beginner;
                if (skillLevelStr.contains("INTERMEDIATE")) skillLevel = Player.SkillLevel.Intermediate;
                else if (skillLevelStr.contains("ADVANCED")) skillLevel = Player.SkillLevel.Advanced;

                int basePrice = 2000;
                if (skillLevel == Player.SkillLevel.Intermediate) basePrice = 5000;
                else if (skillLevel == Player.SkillLevel.Advanced) basePrice = 8000;

                // Retrieve player from toSaveMap (if duplicated in Excel) or database (if already exists)
                Player player = toSaveMap.get(wissenId);
                if (player == null) {
                    player = playerRepository.findByWissenId(wissenId).orElse(null);
                }
                if (player == null) {
                    player = Player.builder()
                            .wissenId(wissenId)
                            .status(Player.PlayerStatus.UNSOLD)
                            .build();
                }

                // Update properties in-place
                player.setFullName(fullName);
                player.setEmail(email);
                player.setGender(gender);
                player.setLocation(city);
                player.setSkillLevel(skillLevel);
                player.setYearsOfExperience(yearsOfExperience);
                player.setMobileNumber(mobile);
                player.setImageUrl(imageUrl);
                player.setBasePrice(basePrice);

                toSaveMap.put(wissenId, player);
            }
        }

        return playerRepository.saveAll(toSaveMap.values())
                .stream()
                .map(PlayerDTO::from)
                .collect(Collectors.toList());
    }

    // ---- BULK DELETE ----

    @Transactional
    public int deleteAllPlayersByCity(String city) {
        List<Player> players = playerRepository.findByLocationIgnoreCase(city);
        if (players.isEmpty()) return 0;
        bidLogRepository.deleteByPlayerIn(players);
        playerRepository.deleteAll(players);
        return players.size();
    }

    // ---- Status Update (used by AuctionService) ----

    @Transactional
    public Player markPlayerPassed(Long playerId) {
        Player player = findOrThrow(playerId);
        player.setStatus(Player.PlayerStatus.UNSOLD);
        return playerRepository.save(player);
    }

    @Transactional
    public Player resetPlayerToUnsold(Long playerId) {
        Player player = findOrThrow(playerId);
        player.setStatus(Player.PlayerStatus.UNSOLD);
        player.setSoldPrice(null);
        player.setSoldTeam(null);
        return playerRepository.save(player);
    }

    // ---- Helpers ----

    public Player findOrThrow(Long id) {
        return playerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Player not found with id: " + id));
    }

    private String getCellString(Row row, int col) {
        Cell cell = row.getCell(col);
        if (cell == null) return "";
        return switch (cell.getCellType()) {
            case STRING  -> cell.getStringCellValue().trim();
            case NUMERIC -> String.valueOf((long) cell.getNumericCellValue());
            default      -> "";
        };
    }

    private String getCellStringSafe(Row row, int col) {
        if (col < 0 || row == null) return "";
        Cell cell = row.getCell(col);
        if (cell == null) return "";
        return switch (cell.getCellType()) {
            case STRING  -> cell.getStringCellValue().trim();
            case NUMERIC -> {
                double val = cell.getNumericCellValue();
                if (val == (long) val) {
                    yield String.valueOf((long) val);
                } else {
                    yield String.valueOf(val);
                }
            }
            default      -> "";
        };
    }

    private double getCellNumericSafe(Row row, int col) {
        if (col < 0 || row == null) return 0;
        Cell cell = row.getCell(col);
        if (cell == null) return 0;
        return cell.getCellType() == CellType.NUMERIC ? cell.getNumericCellValue() : 0;
    }

    private String normalizeHeader(String header) {
        if (header == null) return "";
        return header.replaceAll("[^a-zA-Z0-9]", "").toLowerCase();
    }
}

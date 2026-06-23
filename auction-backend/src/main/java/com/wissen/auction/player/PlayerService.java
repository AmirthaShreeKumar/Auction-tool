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
            Sheet sheet = null;
            Row headerRow = null;
            int headerRowIndex = -1;

            // Scan all sheets for a row with at least 2 matching headers
            for (int s = 0; s < workbook.getNumberOfSheets(); s++) {
                Sheet currentSheet = workbook.getSheetAt(s);
                int bestScore = 0;
                Row bestRow = null;
                int bestRowIdx = -1;
                for (int r = 0; r <= Math.min(currentSheet.getLastRowNum(), 15); r++) {
                    Row currentRow = currentSheet.getRow(r);
                    if (currentRow == null) continue;
                    int score = scoreHeaderRow(currentRow);
                    if (score > bestScore) {
                        bestScore = score;
                        bestRow = currentRow;
                        bestRowIdx = r;
                    }
                }
                if (bestScore >= 2) {
                    sheet = currentSheet;
                    headerRow = bestRow;
                    headerRowIndex = bestRowIdx;
                    break;
                }
            }

            // Fallback to sheet 0 row 0 if no matching header row found
            if (headerRow == null) {
                sheet = workbook.getSheetAt(0);
                headerRow = sheet.getRow(0);
            }
            if (headerRow == null) {
                throw new IllegalArgumentException("Excel file is empty or missing headers.");
            }

            int excelIdCol = -1;
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
                    case "id" -> excelIdCol = col;
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

            for (Row row : sheet) {
                if (row.getRowNum() <= headerRowIndex) continue; // skip header row and any metadata rows above it
                if (isRowBlank(row)) continue;      // skip completely blank/empty rows

                // 1. Process Email
                String email = "";
                if (emailCol != -1) {
                    email = getCellStringSafe(row, emailCol).trim();
                }
                if (email.isEmpty()) {
                    email = "temp_email_" + (row.getRowNum() + 1) + "@wissen.com";
                }

                // 2. Process Wissen ID
                String wissenId = "";
                if (wissenIdCol != -1) {
                    wissenId = getCellStringSafe(row, wissenIdCol).replaceAll("\\s+", "").toUpperCase();
                }
                if (wissenId.isEmpty()) {
                    String excelId = (excelIdCol != -1) ? getCellStringSafe(row, excelIdCol).trim() : "";
                    if (!excelId.isEmpty()) {
                        wissenId = "TEMP-ID-" + excelId.toUpperCase();
                    } else if (emailCol != -1 && !getCellStringSafe(row, emailCol).trim().isEmpty()) {
                        String cleanEmail = getCellStringSafe(row, emailCol).trim();
                        String emailPrefix = cleanEmail.contains("@") ? cleanEmail.split("@")[0] : cleanEmail;
                        wissenId = "TEMP-EMAIL-" + emailPrefix.replaceAll("[^a-zA-Z0-9]", "").toUpperCase();
                    } else {
                        wissenId = "TEMP-ROW-" + (row.getRowNum() + 1);
                    }
                }

                // 3. Process Full Name
                String fullName = "";
                if (fullNameCol != -1) {
                    fullName = getCellStringSafe(row, fullNameCol).trim();
                }
                if (fullName.isEmpty()) {
                    fullName = "Player " + (row.getRowNum() + 1);
                }

                // 4. Process Gender
                String genderStr = "";
                if (genderCol != -1) {
                    genderStr = getCellStringSafe(row, genderCol).toUpperCase().trim();
                }
                Player.Gender gender = Player.Gender.Male;
                if (genderStr.equals("FEMALE") || genderStr.equals("F") || genderStr.startsWith("FEM") || genderStr.equals("WOMAN") || genderStr.equals("WOMEN") || genderStr.equals("W")) {
                    gender = Player.Gender.Female;
                }

                // 5. Process Skill Level (strict mapping, else Beginner)
                String skillLevelStr = "";
                if (skillCol != -1) {
                    skillLevelStr = getCellStringSafe(row, skillCol).toUpperCase().trim();
                }
                Player.SkillLevel skillLevel = Player.SkillLevel.Beginner;
                if (skillLevelStr.contains("INTERMEDIATE") || skillLevelStr.equals("I") || skillLevelStr.startsWith("INTER")) {
                    skillLevel = Player.SkillLevel.Intermediate;
                } else if (skillLevelStr.contains("ADVANCED") || skillLevelStr.equals("A") || skillLevelStr.startsWith("ADV")) {
                    skillLevel = Player.SkillLevel.Advanced;
                }

                // 6. Process Mobile
                String mobile = null;
                if (mobileCol != -1) {
                    mobile = getCellStringSafe(row, mobileCol).trim();
                    if (mobile.isEmpty()) {
                        mobile = null;
                    }
                }

                // 7. Process Experience
                String yearsOfExperience = "";
                if (experienceCol != -1) {
                    yearsOfExperience = getCellStringSafe(row, experienceCol).trim();
                }
                if (yearsOfExperience.isEmpty()) {
                    yearsOfExperience = "0";
                }

                // 8. Process Image
                String imageUrl = null;
                if (imageCol != -1) {
                    imageUrl = getCellStringSafe(row, imageCol).trim();
                    if (imageUrl.isEmpty()) {
                        imageUrl = null;
                    }
                }

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
        try {
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
                case FORMULA -> {
                    try {
                        yield cell.getStringCellValue().trim();
                    } catch (Exception e) {
                        double val = cell.getNumericCellValue();
                        if (val == (long) val) {
                            yield String.valueOf((long) val);
                        } else {
                            yield String.valueOf(val);
                        }
                    }
                }
                case BOOLEAN -> String.valueOf(cell.getBooleanCellValue());
                default      -> "";
            };
        } catch (Exception e) {
            return "";
        }
    }

    private double getCellNumericSafe(Row row, int col) {
        if (col < 0 || row == null) return 0;
        Cell cell = row.getCell(col);
        if (cell == null) return 0;
        return cell.getCellType() == CellType.NUMERIC ? cell.getNumericCellValue() : 0;
    }

    private int scoreHeaderRow(Row row) {
        if (row == null) return 0;
        int score = 0;
        for (int col = 0; col < row.getLastCellNum(); col++) {
            Cell cell = row.getCell(col);
            if (cell == null) continue;
            String val = "";
            try {
                val = switch (cell.getCellType()) {
                    case STRING  -> cell.getStringCellValue().trim();
                    case NUMERIC -> String.valueOf((long) cell.getNumericCellValue());
                    default      -> "";
                };
            } catch (Exception e) {
                // ignore
            }
            String header = normalizeHeader(val);
            if (header.isEmpty()) continue;
            switch (header) {
                case "id", "wissenid", "employeeid", "fullname", "employeename", "name",
                     "email", "emailid", "gender", "whatisyourskilllevel", "badmintonskilllevel",
                     "skilllevel", "mobilenumber", "mobile", "mobileno", "yearsofplayingexperience",
                     "yearsofexperience", "experience", "uploadyourimage", "imageurl", "image" -> score++;
            }
        }
        return score;
    }

    private boolean isRowBlank(Row row) {
        if (row == null) return true;
        for (int col = 0; col < row.getLastCellNum(); col++) {
            Cell cell = row.getCell(col);
            if (cell != null && cell.getCellType() != CellType.BLANK) {
                if (cell.getCellType() == CellType.STRING) {
                    if (!cell.getStringCellValue().trim().isEmpty()) {
                        return false;
                    }
                } else {
                    return false;
                }
            }
        }
        return true;
    }

    private String normalizeHeader(String header) {
        if (header == null) return "";
        return header.replaceAll("[^a-zA-Z0-9]", "").toLowerCase();
    }
}

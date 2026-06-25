package com.wissen.auction.player;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PlayerImportResponse {
    private List<PlayerDTO> importedPlayers;
    private int totalRows;
    private int importedCount;
    private int skippedCount;
    private List<String> skipReasons;
}

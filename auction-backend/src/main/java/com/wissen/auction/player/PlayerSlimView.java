package com.wissen.auction.player;

public interface PlayerSlimView {
    Long getId();
    String getWissenId();
    String getFullName();
    String getEmail();
    String getLocation();
    String getMobileNumber();
    String getYearsOfExperience();
    Player.Gender getGender();
    Player.SkillLevel getSkillLevel();
    Integer getBasePrice();
    Player.PlayerStatus getStatus();
    Integer getSoldPrice();
    TeamView getSoldTeam();
    PlayerStatsView getStats();

    interface TeamView {
        Long getId();
        String getTeamName();
    }
    
    interface PlayerStatsView {
        Integer getMatchesPlayed();
        Integer getMatchesWon();
        Integer getMatchesLost();
    }
}

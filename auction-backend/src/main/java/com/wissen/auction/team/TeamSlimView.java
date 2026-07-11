package com.wissen.auction.team;

public interface TeamSlimView {
    Long getId();
    String getTeamName();
    String getOwnerName();
    String getThemeColor();
    String getLocation();
    Integer getPurseRemaining();
    Integer getLogoSvgHash(); 
    Integer getLogoUrlHash();
}

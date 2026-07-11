package com.wissen.auction.player;

public interface AuctionQueueView {
    Long getId();
    String getFullName();
    Player.Gender getGender();
    Player.SkillLevel getSkillLevel();
    Integer getBasePrice();
    Player.PlayerStatus getStatus();
}

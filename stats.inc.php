<?php

/**
 *------
 * BGA framework: © Gregory Isabelli <gisabelli@boardgamearena.com> & Emmanuel Colin <ecolin@boardgamearena.com>
 * TrickOfTheRails implementation : @ David Edelstein <davidedelstein@gmail.com>
 *
 * This code has been produced on the BGA studio platform for use on http://boardgamearena.com.
 * See http://en.boardgamearena.com/#!doc/Studio for more information.
 * -----
 *
 * stats.inc.php
 *
 * TrickOfTheRails game statistics description
 *
 */

/*
    In this file, you are describing game statistics, that will be displayed at the end of the
    game.
    
    !! After modifying this file, you must use "Reload  statistics configuration" in BGA Studio backoffice
    ("Control Panel" / "Manage Game" / "Your Game")
    
    There are 2 types of statistics:
    _ table statistics, that are not associated to a specific player (ie: 1 value for each game).
    _ player statistics, that are associated to each players (ie: 1 value for each player in the game).

    Statistics types can be "int" for integer, "float" for floating point values, and "bool" for boolean
    
    Once you defined your statistics there, you can start using "initStat", "setStat" and "incStat" method
    in your game logic, using statistics names defined below.
    
    !! It is not a good idea to modify this file when a game is running !!

    If your game is already public on BGA, please read the following before any change:
    http://en.doc.boardgamearena.com/Post-release_phase#Changes_that_breaks_the_games_in_progress
    
    Notes:
    * Statistic index is the reference used in setStat/incStat/initStat PHP method
    * Statistic index must contains alphanumerical characters and no space. Example: 'turn_played'
    * Statistics IDs must be >=10
    * Two table statistics can't share the same ID, two player statistics can't share the same ID
    * A table statistic can have the same ID than a player statistics
    * Statistics ID is the reference used by BGA website. If you change the ID, you lost all historical statistic data. Do NOT re-use an ID of a deleted statistic
    * Statistic name is the English description of the statistic as shown to players
    
*/

$stats_type = array(

    // Statistics global to table
    "table" => array(

        "turns_number" => array("id"=> 10,
                    "name" => totranslate("Number of turns"),
                    "type" => "int" ),
        "b_and_o_railway_cards" => array("id" => 20,
                    "name" => totranslate("B&O cards placed"),
                    "type" => "int"),
        "b_and_o_railway_length" => array("id" => 21,
                    "name" => totranslate("B&O length"),
                    "type" => "int"),
        "b_and_o_railway_share_value" => array("id" => 22,
                    "name" => totranslate("B&O share value"),
                    "type" => "int"),
        "c_and_o_railway_cards" => array("id" => 30,
                    "name" => totranslate("C&O cards placed"),
                    "type" => "int"),
        "c_and_o_railway_length" => array("id" => 31,
                    "name" => totranslate("C&O length"),
                    "type" => "int"),
        "c_and_o_railway_share_value" => array("id" => 32,
                    "name" => totranslate("C&O share value"),
                    "type" => "int"),
        "erie_railway_cards" => array("id" => 40,
                    "name" => totranslate("Erie cards placed"),
                    "type" => "int"),
        "erie_railway_length" => array("id" => 41,
                    "name" => totranslate("Erie length"),
                    "type" => "int"),
        "erie_railway_share_value" => array("id" => 42,
                    "name" => totranslate("Erie share value"),
                    "type" => "int"),
        "nyc_railway_cards" => array("id" => 50,
                    "name" => totranslate("NYC cards placed"),
                    "type" => "int"),
        "nyc_railway_length" => array("id" => 51,
                    "name" => totranslate("NYC length"),
                    "type" => "int"),
        "nyc_railway_share_value" => array("id" => 52,
                    "name" => totranslate("NYC share value"),
                    "type" => "int"),
        "prr_railway_cards" => array("id" => 60,
                    "name" => totranslate("PRR cards placed"),
                    "type" => "int"),
        "prr_railway_length" => array("id" => 61,
                    "name" => totranslate("PRR length"),
                    "type" => "int"),
        "prr_railway_share_value" => array("id" => 62,
                    "name" => totranslate("PRR share value"),
                    "type" => "int"),
    ),
    
    // Statistics existing for each player
    "player" => array(

        "tricks_won" => array("id"=> 20,
                    "name" => totranslate("Number of tricks won"),
                    "type" => "int" ),
        "b_and_o_railway_shares" => array("id" => 30,
                    "name" => totranslate("Number of B&O shares"),
                    "type" => "int"),
        "c_and_o_railway_shares" => array("id" => 31,
                    "name" => totranslate("Number of C&O shares"),
                    "type" => "int"),
        "erie_railway_shares" => array("id" => 32,
                    "name" => totranslate("Number of Erie shares"),
                    "type" => "int"),
        "nyc_railway_shares" => array("id" => 33,
                    "name" => totranslate("Number of NYC shares"),
                    "type" => "int"),
        "prr_railway_shares" => array("id" => 34,
                    "name" => totranslate("Number of PRR shares"),
                    "type" => "int"),
        "b_and_o_railway_profits" => array("id" => 40,
                    "name" => totranslate("Profits from B&O shares"),
                    "type" => "int"),
        "c_and_o_railway_profits" => array("id" => 41,
                    "name" => totranslate("Profits from C&O shares"),
                    "type" => "int"),
        "erie_railway_profits" => array("id" => 42,
                    "name" => totranslate("Profits from Erie shares"),
                    "type" => "int"),
        "nyc_railway_profits" => array("id" => 43,
                    "name" => totranslate("Profits from NYC shares"),
                    "type" => "int"),
        "prr_railway_profits" => array("id" => 44,
                    "name" => totranslate("Profits from PRR shares"),
                    "type" => "int"),
    )
);

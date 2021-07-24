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
 * gameoptions.inc.php
 *
 * TrickOfTheRails game options description
 * 
 * In this file, you can define your game options (= game variants).
 *   
 * Note: If your game has no variant, you don't have to modify this file.
 *
 * Note²: All options defined in this file should have a corresponding "game state labels"
 *        with the same ID (see "initGameStateLabels" in trickoftherails.game.php)
 *
 * !! It is not a good idea to modify this file when a game is running !!
 *
 */

$game_options = array(
    // note: game variant ID should start at 100 (ie: 100, 101, 102, ...). The maximum is 199.
    100 => array(
        'name' => totranslate('Trick Lane setup'),    
        'values' => array(
            1 => array( 'name' => totranslate('Basic'), 'description' => totranslate('Standard Trick Lane (fixed order for City and Locomotive cards)')),
            2 => array( 'name' => totranslate('Expert Variant'), 'description' => totranslate('Placement of Locomotive and City cards in the Trick Lane is randomized'), 'alpha' => false, 'nobeginner' => true )
        ),
        'default' => 1
    ),
    101 => array (
        'name' => totranslate('Team Variant'),
        'values' => array (
            1 => array( 'name' => totranslate('No teams'), 'tmdisplay' => ('')),
            2 => array( 'name' => totranslate('Teams'), 'description' => totranslate('Players play as partners in teams of 2'), 'tmdisplay' => totranslate('Teams'), 'alpha' => false)
        ),
        'startcondition' => array(
            1 => array(),
            2 => array(
                array('type' => 'minplayers', 'value' => 4, 'message' => totranslate('Team Variant is only available for 4-player games')),
                array('type' => 'maxplayers', 'value' => 4, 'message' => totranslate('Team Variant is only available for 4-player games'))
            )
        ),
        'displaycondition' => array(
            // Note: do not display this option unless these conditions are met
            array( 'type' => 'otheroption',
                    'id' => 201, // ELO OFF hardcoded framework option
                    'value' => 1, // 1 if OFF
            )
        ),
        'notdisplayedmessage' => totranslate('Team Variant only available with ELO off'),
        'default' => 1,
    )
);

$game_preferences = array(
    100 => array(
        'name' => totranslate('My hand location'),
        'needReload' => true,
        'values' => array(
            1 => array( 'name' => totranslate( 'Top' )),
            2 => array( 'name' => totranslate( 'Bottom' ))
        ),
        'default' => 1
    ),
    101 => array(
        'name' => totranslate('Show current share values'),
        'needReload' => true,
        'values' => array(
            1 => array( 'name' => totranslate( "Don't show" )),
            2 => array( 'name' => totranslate( "Show" ))
        ),
        'default' => 1
    ),
    102 => array(
        'name' => totranslate('Play card automatically if there is only one card you can play'),
        'needReload' => false,
        'values' => array(
            0 => array( 'name' => totranslate( "Never" )),
            1 => array( 'name' => totranslate( "Final hand only" )),
            2 => array( 'name' => totranslate( "Always" ))
        ),
        'default' => 0
    )

);
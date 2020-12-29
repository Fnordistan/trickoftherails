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
 * states.inc.php
 *
 * TrickOfTheRails game states description
 *
 */

/*
   Game state machine is a tool used to facilitate game developpement by doing common stuff that can be set up
   in a very easy way from this configuration file.

   Please check the BGA Studio presentation about game state to understand this, and associated documentation.

   Summary:

   States types:
   _ activeplayer: in this type of state, we expect some action from the active player.
   _ multipleactiveplayer: in this type of state, we expect some action from multiple players (the active players)
   _ game: this is an intermediary state where we don't expect any actions from players. Your game logic must decide what is the next game state.
   _ manager: special type for initial and final state

   Arguments of game states:
   _ name: the name of the GameState, in order you can recognize it on your own code.
   _ description: the description of the current game state is always displayed in the action status bar on
                  the top of the game. Most of the time this is useless for game state with "game" type.
   _ descriptionmyturn: the description of the current game state when it's your turn.
   _ type: defines the type of game states (activeplayer / multipleactiveplayer / game / manager)
   _ action: name of the method to call when this game state become the current game state. Usually, the
             action method is prefixed by "st" (ex: "stMyGameStateName").
   _ possibleactions: array that specify possible player actions on this step. It allows you to use "checkAction"
                      method on both client side (Javacript: this.checkAction) and server side (PHP: self::checkAction).
   _ transitions: the transitions are the possible paths to go from a game state to another. You must name
                  transitions in order to use transition names in "nextState" PHP method, and use IDs to
                  specify the next game state for each transition.
   _ args: name of the method to call to retrieve arguments for this gamestate. Arguments are sent to the
           client side to be used on "onEnteringState" or to set arguments in the gamestate description.
   _ updateGameProgression: when specified, the game progression is updated (=> call to your getGameProgression
                            method).
*/

//    !! It is not a good idea to modify this file when a game is running !!
// define contants for state ids
if (!defined('STATE_SETUP')) { // ensure this block is only invoked once, since it is included multiple times
    define("STATE_SETUP", 1);
    define("STATE_NEW_TRICK", 2);
    define("STATE_PLAY_CARD", 3);
    define("STATE_NEXT_PLAYER", 4);
    define("STATE_RESOLVE_TRICK", 10);
    define("STATE_ADD_LOCOMOTIVE", 20);
    define("STATE_ADD_RAILWAY", 25);
    define("STATE_NEXT_RAILWAY", 26);
    define("STATE_ADD_CITY", 30);
    define("STATE_ADD_SHARES", 40);
    define("STATE_SCORE", 98);
    define("STATE_END_GAME", 99);
 }
 
$machinestates = array(

    // The initial state. Please do not modify.
    STATE_SETUP => array(
        "name" => "gameSetup",
        "description" => "",
        "type" => "manager",
        "action" => "stGameSetup",
        "transitions" => array( "" => STATE_NEW_TRICK )
    ),

    STATE_NEW_TRICK => array(
    		"name" => "newTrick",
    		"description" => "",
            "type" => "game",
            "action" => "stNewTrick",
            "updateGameProgression" => true,
    		"transitions" => array( "" => STATE_PLAY_CARD )
    ),
    
    STATE_PLAY_CARD => array(
        "name" => "playerTurn",
        "description" => clienttranslate('${actplayer} must ${card_action}'),
        "descriptionmyturn" => clienttranslate('${you} must ${card_action}'),
        "type" => "activeplayer",
        "possibleactions" => array( "playCard" ),
        "args" => "argPlayCards",
        "transitions" => array( "" => STATE_NEXT_PLAYER )
    ),

    STATE_NEXT_PLAYER => array(
        "name" => "nextPlayer",
        "description" => "",
        "type" => "game",
        "action" => "stNextPlayer",
        "transitions" => array( "nextPlayer" => STATE_PLAY_CARD, "resolveTrick" => STATE_RESOLVE_TRICK )
    ),

    STATE_RESOLVE_TRICK => array(
        "name" => "endTrick",
        "description" => "",
        "type" => "game",
        "action" => "stResolveTrick",
        "transitions" => array( "locomotive" => STATE_ADD_LOCOMOTIVE, "city" => STATE_ADD_CITY, "share" => STATE_ADD_SHARES )
    ),

    STATE_ADD_LOCOMOTIVE => array(
        "name" => "addLocomotive",
        "description" => clienttranslate('${actplayer} places ${locomotive}'),
        "descriptionmyturn" => clienttranslate('${you} must place ${locomotive}'),
        "type" => "activeplayer",
        "possibleactions" => array( "placeLocomotive" ),
        "args" => "argPlaceLocomotive",
        "transitions" => array( "" => STATE_ADD_RAILWAY)
    ),

    STATE_ADD_CITY => array(
        "name" => "addCity",
        "description" => clienttranslate('${actplayer} places ${city}'),
        "descriptionmyturn" => clienttranslate('${you} must place ${city}'),
        "type" => "activeplayer",
        "possibleactions" => array( "placeCity" ),
        "args" => "argPlaceCity",
        "transitions" => array( "" => STATE_ADD_RAILWAY)
    ),

    STATE_ADD_RAILWAY => array(
        "name" => "addRailway",
        "description" => clienttranslate('${actplayer} adds ${company} (${val}) to the ${company} railway.'),
        "descriptionmyturn" => clienttranslate('${you} must add ${company} (${val}) to the ${company} railway.'),
        "type" => "activeplayer",
        "args" => "argAddRailway",
        "possibleactions" => array( "addRailwayCard" ),
        "transitions" => array( "" => STATE_NEXT_RAILWAY ) 
    ),

    STATE_NEXT_RAILWAY => array(
        "name" => "nextRailway",
        "description" => "",
        "type" => "game",
        "action" => "stNextRailway",
        "transitions" => array( "nextPlayer" => STATE_ADD_RAILWAY, "nextTrick" => STATE_NEW_TRICK, "endGame" =>  STATE_SCORE )
    ),

    STATE_ADD_SHARES => array(
        "name" => "addShares",
        "description" => "",
        "type" => "game",
        "action" => "stAddShares",
        "transitions" => array( "nextTrick" => STATE_NEW_TRICK, "endGame" =>  STATE_SCORE)
    ),

    STATE_SCORE => array(
        "name" => "scoring",
        "description" => "Adding scores...",
        "type" => "game",
        "action" => "stScoring",
        "updateGameProgression" => true,
        "transitions" => array( "" => STATE_END_GAME )
    ),

    // Final state.
    // Please do not modify (and do not overload action/args methods).
    STATE_END_GAME => array(
        "name" => "gameEnd",
        "description" => clienttranslate("End of game"),
        "type" => "manager",
        "action" => "stGameEnd",
        "args" => "argGameEnd"
    )

);
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
  * trickoftherails.game.php
  *
  * This is the main file for your game logic.
  *
  * In this PHP file, you are going to defines the rules of the game.
  *
  */


require_once( APP_GAMEMODULE_PATH.'module/table/table.game.php' );

class TrickOfTheRails extends Table
{
	function __construct( )
	{
        // Your global variables labels:
        //  Here, you can assign labels to global variables you are using for this game.
        //  You can use any number of global variables with IDs between 10 and 99.
        //  If your game has options (variants), you also have to associate here a label to
        //  the corresponding ID in gameoptions.inc.php.
        // Note: afterwards, you can get/set the global variables with getGameStateValue/setGameStateInitialValue/setGameStateValue
        parent::__construct();
        
        self::initGameStateLabels( array( 
            "trickRR" => 10,
            "wonLastTrick" => 20,
        ) );

        $this->rrcards = self::getNew("module.common.deck");
        $this->rrcards->init("CARDS_RR");

        $this->trickcards = self::getNew("module.common.deck");
        $this->trickcards->init("CARDS_TRICK");

	}
	
    protected function getGameName( )
    {
		// Used for translations and stuff. Please do not modify.
        return "trickoftherails";
    }	

    /*
        setupNewGame:
        
        This method is called only once, when a new game is launched.
        In this method, you must setup the game according to the game rules, so that
        the game is ready to be played.
    */
    protected function setupNewGame( $players, $options = array() )
    {    
        // Set the colors of the players with HTML color code
        // The default below is red/green/blue/orange/brown
        // The number of colors defined here must correspond to the maximum number of players allowed for the gams
        $gameinfos = self::getGameinfos();
        $default_colors = $gameinfos['player_colors'];
 
        // Create players
        // Note: if you added some extra field on "player" table in the database (dbmodel.sql), you can initialize it there.
        $sql = "INSERT INTO player (player_id, player_color, player_canal, player_name, player_avatar) VALUES ";
        $values = array();
        foreach( $players as $player_id => $player )
        {
            $color = array_shift( $default_colors );
            $values[] = "('".$player_id."','$color','".$player['player_canal']."','".addslashes( $player['player_name'] )."','".addslashes( $player['player_avatar'] )."')";
        }
        $sql .= implode( $values, ',' );
        self::DbQuery( $sql );
        self::reattributeColorsBasedOnPreferences( $players, $gameinfos['player_colors'] );
        self::reloadPlayersBasicInfos();
        
        /************ Start the game initialization *****/

        // Init global values with their initial values
         // Set current trick color to zero (= no trick color)
         self::setGameStateInitialValue( 'trickRR', 0 );
         self::setGameStateInitialValue( 'wonLastTrick', 0 );

        // Init game statistics
        // (note: statistics used in this file must be defined in your stats.inc.php file)
        //self::initStat( 'table', 'table_teststat1', 0 );    // Init a table statistics
        //self::initStat( 'player', 'player_teststat1', 0 );  // Init a player statistics (for all players)

        // Create cards
        $rrcards = array();
        foreach ( $this->railroads as $rr_id => $railroad ) {
            // Railroad rows
            for ($value = 1; $value <= 10; $value++) {
                $rrcards[] = array ('type' => $rr_id, 'type_arg' => $value, 'nbr' => 1 );
            }
        }
        $this->rrcards->createCards( $rrcards, 'deck' );

        // Create the trick deck, which varies by number of players
        $players_nbr = count( $players );
        
        $trickcards = array();

        for ($ix = 1; $ix <= 5; $ix++) {
            // locomotives
            $trickcards[] = array('type' => 6, 'type_arg' => $ix, 'nbr' => 1);
            // exchange cards
            $trickcards[] = array('type' => $ix, 'type_arg' => 11, 'nbr' => 1);
            //  also stick Station cards here, though we'll immediately move them
            $trickcards[] = array('type' => $ix, 'type_arg' => 12, 'nbr' => 1);
        }

        // number of cards in trick lane, and also starting hand size
        $tricklanelen = 0;

        switch ($players_nbr) {
            case 3:
                // use 3 Reservation and City cards
                $trickcards[] = array('type' => 6, 'type_arg' => 9, 'nbr' => 3);
                for ($col = 6; $col <= 8; $col++) {
                    $trickcards[] = array('type' => 6, 'type_arg' => $col, 'nbr' => 1);
                }
                $tricklanelen = 15;
                break;
            case 4:
                // only 1 Reservation and City card
                $trickcards[] = array('type' => 6, 'type_arg' => 9, 'nbr' => 1);
                // the City card used is randomly determined
                $trickcards[] = array('type' => 6, 'type_arg' => bga_rand(6,8), 'nbr' => 1);
                $tricklanelen = 11;
                break;
            case 5:
                // no Reservation or City cards
                $tricklanelen = 9;
                break;
            default:
                // WTF happened?
                throw new BgaVisibleSystemException("Invalid player count: {$players_nbr}");
        }

        // Shuffle main deck
        $this->rrcards->shuffle('deck');
        // Deal cards to each player
        $players = self::loadPlayersBasicInfos();
        foreach ( $players as $player_id => $player ) {
            $rrcards = $this->rrcards->pickCards($tricklanelen, 'deck', $player_id);
        }


        // create trick deck
        $this->trickcards->createCards($trickcards, 'deck');
        // before shuffling trick deck remove Stations and put them in railway lines
        foreach ( $this->railroads as $rr_id => $railroad ) {
            $stations = $this->trickcards->getCardsOfType($rr_id, 12);
            // annoying iteration through a one-element assocative array...
            foreach ($stations as $station) {
                $this->trickcards->moveCard($station['id'], $railroad['abbr'].'_railway');
            }
        }

        // now shuffle
        $this->trickcards->shuffle('deck');
        $tricklane = $this->trickcards->pickCardsForLocation($tricklanelen, 'deck', 'trickrewards');


        // Activate first player (which is in general a good idea :) )
        $this->activeNextPlayer();

        /************ End of the game initialization *****/
    }

    /*
        getAllDatas: 
        
        Gather all informations about current game situation (visible by the current player).
        
        The method is called each time the game interface is displayed to a player, ie:
        _ when the game starts
        _ when a player refreshes the game page (F5)
    */
    protected function getAllDatas()
    {
        $result = array();
    
        $current_player_id = self::getCurrentPlayerId();    // !! We must only return informations visible by this player !!
    
        // Get information about players
        // Note: you can retrieve some extra field you added for "player" table in "dbmodel.sql" if you need it.
        $sql = "SELECT player_id id, player_score score FROM player ";
        $result['players'] = self::getCollectionFromDb( $sql );
  
        // Cards in player hand
        $result['hand'] = $this->rrcards->getCardsInLocation( 'hand', $current_player_id );

        // Cards played onto the table
        $result['currenttrick'] = $this->rrcards->getCardsInLocation( 'currenttrick');
        // Cards in tricklane
        $result['tricklanecards'] = $this->trickcards->getCardsInLocation( 'trickrewards' );

        foreach ( $this->railroads as $rr_id => $railroad ) {
            $result[$railroad['abbr'].'_railway_cards'] = $this->rrcards->getCardsInLocation( $railroad['abbr'].'_railway' );
            $result[$railroad['abbr'].'_railway_cards'] = $this->trickcards->getCardsInLocation( $railroad['abbr'].'_railway' );
        }


        return $result;
    }

    /*
        getGameProgression:
        
        Compute and return the current game progression.
        The number returned must be an integer beween 0 (=the game just started) and
        100 (= the game is finished or almost finished).
    
        This method is called each time we are in a game state with the "updateGameProgression" property set to true 
        (see states.inc.php)
    */
    function getGameProgression()
    {
        // TODO: compute and return the game progression

        return 0;
    }


//////////////////////////////////////////////////////////////////////////////
//////////// Utility functions
////////////    

    /*
        In this space, you can put any utility methods useful for your game logic
    */



//////////////////////////////////////////////////////////////////////////////
//////////// Player actions
//////////// 

    /*
        Each time a player is doing some game action, one of the methods below is called.
        (note: each method below must match an input method in trickoftherails.action.php)
    */

    /**
     * When someone plays a card to a trick.
     */
    function playCard( $card_id )
    {
        self::checkAction( 'playCard' ); 

        $card_played = $this->rrcards->getCard($card_id);
        $player_id = self::getActivePlayerId();
        

        // am I the first to play this trick?
        // note: 'color' is really the railroad number (1-5)
        $trick_color = self::getGameStateValue( 'trickRR' );
        if ($trick_color == 0) {
            self::setGameStateValue( 'trickRR', $card_played['type']);
        } else {
            if ($card_played['type'] != $trick_color) {
                // do I have a card of that color in my hand?
                $cards_in_hand = $this->rrcards->getCardsInLocation( 'hand', $player_id );
                foreach ($cards_in_hand as $card) {
                    if ($card['type'] == $trick_color) {
                        throw new BgaUserException ( self::_( "You must play a ".$this->railroads[$trick_color]['name']." (".$this->railroads[$trick_color]['color'].") card" ));
                    }
                }
            }
        }
        
        $wt = $this->rrcards->countCardsInLocation( 'currenttrick' );
        $this->rrcards->insertCard( $card_id, 'currenttrick', $wt );
        // update our trick table
        self::DbQuery("
        INSERT INTO TRICK_ROW (player_id, card_id) VALUES (".$player_id.",".$card_id.")
        ");

        // Notify all players about the card played
        self::notifyAllPlayers('playCard', clienttranslate('${player_name} plays ${rr_name} (${rr_color}) ${card_value}'), array (
            'i18n' => array ('rr_name', 'rr_color','card_value' ),
            'card_id' => $card_id,
            'player_id' => self::getActivePlayerId(),
            'player_name' => self::getActivePlayerName(),
            'card_value' => $this->values_label [$card_played ['type_arg']],
            'rr' => $card_played['type'],
            'rr_name' => $this->railroads [$card_played ['type']] ['name'],
            'rr_color' => $this->railroads [$card_played ['type']] ['color'] ));
        // Next player
        $this->gamestate->nextState();
          
    }

    function placeLocomotive( $card_id ) {
        self::checkAction( 'placeLocomotive' );

    }

    function placeCity( $card_id ) {
        self::checkAction( 'placeCity' );

    }

    function addRailwayCard( $card_id ) {
        self::checkAction( 'addRailwayCard' );

    }
    

//////////////////////////////////////////////////////////////////////////////
//////////// Game state arguments
////////////

    /*
        Here, you can create methods defined as "game state arguments" (see "args" property in states.inc.php).
        These methods function is to return some additional information that is specific to the current
        game state.
    */

    function argPlayCards()
    {
        $cardToPlay = 0;
        $currentTrick = self::getGameStateValue( 'trickRR' );
        if ($currentTrick == 0) {
            $cardToPlay = clienttranslate("lead the trick (play any card)");
        } else {
            $cardToPlay = clienttranslate("play a ".$this->railroads[$currentTrick]['name']." (".$this->railroads[$currentTrick]['color'].") card if possible");
        }
        return array(
            "i18n" => array( 'cardToPlay'),
            'cardToPlay' => $cardToPlay,
        );
    }    

//////////////////////////////////////////////////////////////////////////////
//////////// Game state actions
////////////

    /*
        Here, you can create methods defined as "game state actions" (see "action" property in states.inc.php).
        The action method of state X is called everytime the current game state is set to X.
    */

    /**
     * Start a new trick.
     */
    function stNewTrick() {
        // clear previous tricks played
        self::DbQuery("DELETE FROM TRICK_ROW");

        // reset trick
        self::setGameStateValue( 'trickRR', 0 );

        // who leads the new trick?
        $leadPlayer = self::getGameStateValue( 'wonLastTrick' );
        if ($leadPlayer != 0) {
            $this->gamestate->changeActivePlayer( $leadPlayer );
        }

        $this->gamestate->nextState( "" );
    }

    /**
     * Next card played in trick.
     */
    function stNextPlayer() {
        // if this was the last player
        if ( $this->rrcards->countCardInLocation( 'currenttrick' ) == self::getPlayersNumber() ) {
            // end of trick
            // Who won?
            $color = self::getGameStateValue( 'trickRR' );

            $bestCard = 0;
            $bestVal = 0;
            foreach ($this->rrcards->getCardsInLocation( 'currenttrick') as $cardPlayed) {
                if ($cardPlayed['type'] == $color) {
                    if ($cardPlayed['type_arg'] > $bestVal) {
                        $bestCard = $cardPlayed;
                        $bestVal = $cardPlayed['type_arg'];
                    }
                }
            }
            // should not happen!
            if ($bestCard == 0) {
                throw new BgaVisibleSystemException( "no winner of trick determined!" );
            } else {
                $winner = self::getUniqueValueFromDB("
                    SELECT player_id FROM TRICK_ROW
                    WHERE card_id =".$bestCard['id']
                );
            }
            $this->gamestate->changeActivePlayer( $winner );

            self::notifyAllPlayers('winTrick', clienttranslate('${player_name} wins the trick with ${rr_name} ${card_value}'), array (
                'i18n' => array ('rr_name', 'rr_color','card_value' ),
                'player_id' => self::getActivePlayerId(),
                'player_name' => self::getActivePlayerName(),
                'card_value' => $this->values_label [$bestCard ['type_arg']],
                'rr_name' => $this->railroads [$bestCard ['type']] ['name'],
                'rr_color' => $this->railroads [$bestCard ['type']] ['color'] ));

            $this->gamestate->nextState( 'resolveTrick' );        
        } else {
            $player_id = self::activeNextPlayer();
            self::giveExtraTime( $player_id );

            $this->gamestate->nextState( 'nextPlayer' );        
        }
    }

    /**
     * Winner gets reward
     */
    function stResolveTrick() {
        $trickCard = $this->trickcards->getCardOnTop('trickrewards', 0);

        if ($trickCard['type'] == 6) {
            if ($trickCard['type_arg'] <= 5) {
                $reward = "locomotive";
            } else if ($trickCard['type_arg']  <= 8) {
                $reward = "city";
            } else {
                // shouldn't get here!
                throw new BgaVisibleSystemException("Invalid Trick Lane Card");
            }
        } else {
            // if it's not the last row, it's either an Exchange or Railway card
            $reward = "share";
        }
        $this->gamestate->nextState( $reward );
    }

    function stNextRailway() {
        // // if there is another player to play
        // $this->gamestate->nextState( 'nextPlayer' );
        // // no more players, not the last trick
        // $this->gamestate->nextState( 'nextTrick' );
        // that was the last trick
        $this->gamestate->nextState( 'endGame' );

    }

    function stAddShares() {
        // add the shares everyone played to their piles

        // // is there another trick?
        // $this->gamestate->nextState( "nextTrick" );
        // go to scoring
        $this->gamestate->nextState( "endGame" );
    }


    function stScoring() {

        $this->gamestate->nextState( "" );
    }

//////////////////////////////////////////////////////////////////////////////
//////////// Zombie
////////////

    /*
        zombieTurn:
        
        This method is called each time it is the turn of a player who has quit the game (= "zombie" player).
        You can do whatever you want in order to make sure the turn of this player ends appropriately
        (ex: pass).
        
        Important: your zombie code will be called when the player leaves the game. This action is triggered
        from the main site and propagated to the gameserver from a server, not from a browser.
        As a consequence, there is no current player associated to this action. In your zombieTurn function,
        you must _never_ use getCurrentPlayerId() or getCurrentPlayerName(), otherwise it will fail with a "Not logged" error message. 
    */

    function zombieTurn( $state, $active_player )
    {
    	$statename = $state['name'];
    	
        if ($state['type'] === "activeplayer") {
            switch ($statename) {
                default:
                    $this->gamestate->nextState( "zombiePass" );
                	break;
            }

            return;
        }

        if ($state['type'] === "multipleactiveplayer") {
            // Make sure player is in a non blocking status for role turn
            $this->gamestate->setPlayerNonMultiactive( $active_player, '' );
            
            return;
        }

        throw new BgaVisibleSystemException( "Zombie mode not supported at this game state: ".$statename );
    }
    
///////////////////////////////////////////////////////////////////////////////////:
////////// DB upgrade
//////////

    /*
        upgradeTableDb:
        
        You don't have to care about this until your game has been published on BGA.
        Once your game is on BGA, this method is called everytime the system detects a game running with your old
        Database scheme.
        In this case, if you change your Database scheme, you just have to apply the needed changes in order to
        update the game database and allow the game to continue to run with your new version.
    
    */
    
    function upgradeTableDb( $from_version )
    {
        // $from_version is the current version of this game database, in numerical form.
        // For example, if the game was running with a release of your game named "140430-1345",
        // $from_version is equal to 1404301345
        
        // Example:
//        if( $from_version <= 1404301345 )
//        {
//            // ! important ! Use DBPREFIX_<table_name> for all tables
//
//            $sql = "ALTER TABLE DBPREFIX_xxxxxxx ....";
//            self::applyDbUpgradeToAllDB( $sql );
//        }
//        if( $from_version <= 1405061421 )
//        {
//            // ! important ! Use DBPREFIX_<table_name> for all tables
//
//            $sql = "CREATE TABLE DBPREFIX_xxxxxxx ....";
//            self::applyDbUpgradeToAllDB( $sql );
//        }
//        // Please add your future database scheme changes here
//
//


    }    
}

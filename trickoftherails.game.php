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

define('LASTROW', 6);
define('RESERVATION', 9);
define('EXCHANGE', 11);
define('RAILROAD_STATION', 12);

define('TRICKLANE', "tricklane");

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
            'handSize' => 5,// number of cards and tricklane cards dealt
            'currentTrickIndex' => 10, // index of next card to take in trick lane. Can't be turn # because of paired Loc6/∞
            'trickRR' => 20,// company of current trick
            'leadCard' => 21, // for keeping track of the lead card that was played for each hand
            'wonLastTrick' => 30, // player id who won last trick
            "trickLaneOption" => 100, // if expert option set
            "teamsOption" => 101, // if partners variant set
        ) );

        // all the cards in one deck, which can keep track of where everything is
        $this->cards = self::getNew("module.common.deck");
        $this->cards->init("CARDS");
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
            self::initStat('player', 'tricks_won', 0, $player_id);
            foreach ($this->railroads as $rr) {
                self::initStat('player', $rr['railway'].'_shares', 0, $player_id);
                self::initStat('player', $rr['railway'].'_profits', 0, $player_id);
            }
        }
        $sql .= implode( $values, ',' );
        self::DbQuery( $sql );
        self::reattributeColorsBasedOnPreferences( $players, $gameinfos['player_colors'] );
        self::reloadPlayersBasicInfos();
        
        /************ Start the game initialization *****/

        /**** Stats */
        self::initStat('table', 'turns_number', 0);
        foreach ($this->railroads as $rr) {
            self::initStat('table', $rr['railway'].'_length', 0);
            self::initStat('table', $rr['railway'].'_share_value', 0);
            self::initStat('table', $rr['railway'].'_cards', 0);
        }
        // Init global values with their initial values
         // Set current trick color to zero (= no trick color)
         self::setGameStateInitialValue( 'trickRR', 0 );
         self::setGameStateInitialValue( 'leadCard', 0 );
         self::setGameStateInitialValue( 'wonLastTrick', 0 );
         //  starts at -1, will become 0 with first new trick
         self::setGameStateInitialValue( 'currentTrickIndex', -1 );

        $players_nbr = count( $players );
        switch ($players_nbr) {
            case 3:
                $handsize = 15;
                break;
            case 4:
                $handsize = 11;
                break;
            case 5:
                $handsize = 9;
                break;
            default:
                // WTF happened?
                throw new BgaVisibleSystemException("Invalid player count: {$players_nbr}");// NOI18N
        }
        self::setGameStateInitialValue( 'handSize', $handsize );

        // Create the Railroad cards deck
        $railroad_cards = $this->createRailroadCards();
        $this->setupRailroadDeck($railroad_cards);

        // Create the trick deck, which varies by number of players
        $trick_cards = $this->createTrickCards($players_nbr);
        $this->setupTrickLane($players_nbr, $trick_cards);

        // Activate first player
        self::activeNextPlayer();

        if ($this->isTeamsVariant()) {
            // sanity check
            if ($players_nbr != 4) {
                throw new BgaVisibleSystemException("Invalid player count for Teams variant: {$players_nbr}");// NOI18N
            }
            $this->createTeams();
        }

        /************ End of the game initialization *****/
    }

    /**
     * Set up the 2-player teams
     */
    protected function createTeams() {
        $players = $this->loadPlayersBasicInfos();
        foreach ($players as $player) {
            $team = $player['player_no'] % 2 == 0 ? 2 : 1;
            self::DbQuery( "UPDATE player SET team=$team WHERE player_id=".$player['player_id'] );
        }
    }

    /**
     * Create the array of Railroad cards.
     */
    protected function createRailroadCards() {
        // Create cards
        $railroad_cards = array();
        foreach ( $this->railroads as $rr_id => $railroad ) {
            // Railroad rows
            //  also stick Station cards here, though we'll immediately move them
            for ($value = 1; $value <= 12; $value++) {
                if ($value != EXCHANGE) {
                    $railroad_cards[] = array ('type' => $rr_id, 'type_arg' => $value, 'nbr' => 1);
                }
            }
        }
        return $railroad_cards;
    }

    /**
     * Setup the Railroad Deck. Deal cards to each player, and remaining to the Railways.
     */
    protected function setupRailroadDeck($railroad_cards) {
        $this->cards->createCards( $railroad_cards, 'deck' );

        // before shuffling main rr deck, remove Stations and put them in railway lines
        foreach ( $this->railroads as $rr_id => $railroad ) {
            // a one-element assocative array...
            $stations = $this->cards->getCardsOfType($rr_id, RAILROAD_STATION);
            $station = current($stations);
            // Locomotive will be location 0
            // set station at location 1
            $this->cards->moveCard($station['id'], $railroad['railway'], 1);
        }

        // now shuffle
        $this->cards->shuffle('deck');
        // Deal cards to each player
        $players = self::loadPlayersBasicInfos();
        $handsize = self::getGameStateValue('handSize');
        foreach ( $players as $player_id => $player ) {
            $rrcards = $this->cards->pickCards($handsize, 'deck', $player_id);
        }

        // deal out remaining cards to appropriate railway line
        foreach ($this->cards->getCardsInLocation( 'deck') as $rrcard) {
            $railway = $this->railroads[$rrcard['type']]['railway'];
            $pos = 1+$this->cards->countCardInLocation($railway);
            $this->cards->moveCard($rrcard['id'], $railway, $pos);
        }
    }

    /**
     * Create the trick lane according to player size.
     */
    protected function createTrickCards($players_nbr) {
        $trick_cards = array();
        for ($ix = 1; $ix <= 5; $ix++) {
            // locomotives
            $trick_cards[] = array('type' => LASTROW, 'type_arg' => $ix, 'nbr' => 1);
            // exchange cards
            $trick_cards[] = array('type' => $ix, 'type_arg' => EXCHANGE, 'nbr' => 1);
        }

        switch ($players_nbr) {
            case 3:
                // use 3 Reservation and City cards
                $trick_cards[] = array('type' => LASTROW, 'type_arg' => RESERVATION, 'nbr' => 3);
                for ($col = 6; $col <= 8; $col++) {
                    $trick_cards[] = array('type' => LASTROW, 'type_arg' => $col, 'nbr' => 1);
                }
                break;
            case 4:
                // only 1 Reservation and City card
                $trick_cards[] = array('type' => LASTROW, 'type_arg' => RESERVATION, 'nbr' => 1);
                // the City card used is randomly determined
                $trick_cards[] = array('type' => LASTROW, 'type_arg' => bga_rand(6,8), 'nbr' => 1);
                break;
            case 5:
                // no Reservation or City cards
                break;
            default:
                // WTF happened?
                throw new BgaVisibleSystemException("Invalid player count: {$players_nbr}");// NOI18N
        }

        return $trick_cards;
    }


    /**
     * Create the trick deck.
     * Set up the Locomotives, Exchange, City, and Reservation cards that make the starting Trick Lane.
     */
    protected function setupTrickLane($players_nbr, $trick_cards) {
        // create trick deck
        $this->cards->createCards($trick_cards, 'trickdeck');

        // Lay out the trick lane

        // 3 players:
        // E C E C E C E 3 E 4 R 5 R 6/∞ R

        // 4 players:
        // E C E 3 E 4 E 5 E 6/∞ R

        // 5 players
        // E 3 E 4 E 5 E 6/∞ E

        // only used with Expert games
        $expert_rand = array();
        switch ($players_nbr) {
            case 3:
                $first_loco_card = 7;
                $expert_rand = array(1, 3, 5, 7, 9, 11, 13);
                break;
            case 4:
                $first_loco_card = 3;
                $expert_rand = array(1, 3, 5, 7, 9);
                break;
            case 5:
                $first_loco_card = 1;
                $expert_rand = array(1, 3, 5, 7);
                break;
            default:
                // WTF happened?
                throw new BgaVisibleSystemException("Invalid player count: {$players_nbr}");// NOI18N
        }

        if ($this->isExpertVariant()) {
            $this->expertShuffle($players_nbr, $expert_rand);
        } else {
            $this->basicShuffle($players_nbr, $first_loco_card);
        }
    }

    /**
     * For standard games, set up the Trick Lane in a fixed order.
     */
    protected function basicShuffle($players_nbr, $first_loco_card) {
        // First randomize the Exchange cards
        $exchange_rand = range(1,5);
        shuffle($exchange_rand);
        for ($e = 0; $e < 5; $e++) {
            // one-member array
            $x_card = current($this->cards->getCardsOfType($exchange_rand[$e], EXCHANGE));
            $slot = $e*2;
            // 5-player games, last exchange card is pushed to the end
            if (($players_nbr == 5) && ($e == 4)) {
                $slot = 9;
            }
            $this->cards->moveCard($x_card['id'], TRICKLANE, $slot);
        }
        // For a 3-player game, cities are shuffled and put in slots 1, 3, and 5
        $city_rand = array(1, 3, 5);
        shuffle($city_rand);

        // For a 3-player game, Reserve cards are put in slots 10, 12, and 15
        $reserves = array(10, 12, 15);
        // In a 4 player game, one Reserve card goes in slot 11
        $reserve_slot_4 = 11;

        // locomotives
        // 3 => 7,9,11,13,14
        // 4 => 3,5,7,9,10
        // 5 => 1,3,5,7,8
        foreach ($this->cards->getCardsOfType(LASTROW) as $lastrow) {
            switch ($lastrow['type_arg']) {
                case 1: // Loco 3
                case 2: // Loco 4
                case 3: // Loco 5
                case 4: // Loco 6
                    $this->cards->moveCard($lastrow['id'], TRICKLANE, $first_loco_card+(2*($lastrow['type_arg']-1)));
                    break;
                case 5: // Loco ∞
                    $this->cards->moveCard($lastrow['id'], TRICKLANE, $first_loco_card+7);
                    break;
                case 6: // City cards - put them in random slots
                case 7:
                case 8:
                    switch ($players_nbr) {
                        case 3:
                            // insert next shuffled city card
                            $this->cards->moveCard($lastrow['id'], TRICKLANE, array_pop($city_rand));
                            break;
                        case 4:
                            // There's only one city card in 4-player games (type_arg should have been selected randomly 6-8)
                            // It always goes in slot 1
                            $this->cards->moveCard($lastrow['id'], TRICKLANE, 1);
                            break;
                        default:
                            // shouldn't be any City cards in 5-player game!
                            throw new BgaVisibleSystemException("Should not be City cards in a 5-player game!");// NOI18N
                    }
                    break;
                case 9: // Reservation cards
                    switch ($players_nbr) {
                        case 3:
                            $this->cards->moveCard($lastrow['id'], TRICKLANE, array_pop($reserves));
                            break;
                        case 4:
                            // only 1 Reservation card in a 4-player game
                            $this->cards->moveCard($lastrow['id'], TRICKLANE, $reserve_slot_4);
                            break;
                        default:
                            // shouldn't be any Reservation cards in 5-player game!
                            throw new BgaVisibleSystemException("Should not be Reservation cards in a 5-player game!");// NOI18N
                    }
                    break;
                default:
                    throw new BgaVisibleSystemException("Invalid Card found! {$lastrow['id']}");// NOI18N
            }
       }
    }

    /**
     * If 'Expert' mode, randomly shuffle City and Locomotive cards.
     */
    protected function expertShuffle($players_nbr, $expert_rand) {
        // shuffle the city and loco cards
        shuffle($expert_rand);

        // pick the loco[6] first so we know where the loco[∞] goes
        $loco_6 = array_pop($expert_rand);
        $loco_unl = $loco_6+1;

        // place the Exchange cards
        // First randomize them
        $exchange_rand = range(1,5);
        shuffle($exchange_rand);
        for ($e = 0; $e < 5; $e++) {
            // one-member array
            $ex_card = current($this->cards->getCardsOfType($exchange_rand[$e], EXCHANGE));
            $ex_slot = $e*2;
            
            if ($ex_slot >= $loco_unl) {
                $ex_slot++;
            }
            $this->cards->moveCard($ex_card['id'], TRICKLANE, $ex_slot);
        }

        // For a 3-player game, Reserve cards are put in slots 10, 12, and 14 (actually 15, but we have to shift because of the random unl loc position)
        $reserves = array(10, 12, 14);
        // In a 4 player game, one Reserve card goes in slot 11
        $reserve_slot_4 = 11;

        foreach ($this->cards->getCardsOfType(LASTROW) as $lastrow) {
            switch ($lastrow['type_arg']) {
                case 1: // Loco 3
                case 2: // Loco 4
                case 3: // Loco 5
                    $loco_slot = array_pop($expert_rand);
                    if ($loco_slot > $loco_unl) {
                        $loco_slot++;
                    }
                    $this->cards->moveCard($lastrow['id'], TRICKLANE, $loco_slot);
                    break;
                case 4: // Loco 6
                    $this->cards->moveCard($lastrow['id'], TRICKLANE, $loco_6);
                    break;
                case 5: // Loco ∞
                    $this->cards->moveCard($lastrow['id'], TRICKLANE, $loco_unl);
                    break;
                case 6: // City cards - put them in random slots
                case 7:
                case 8:
                    switch ($players_nbr) {
                            case 3:
                            case 4:
                                // insert next shuffled city card
                                $city_slot = array_pop($expert_rand);
                                if ($city_slot > $loco_unl) {
                                    $city_slot++;
                                }
                                $this->cards->moveCard($lastrow['id'], TRICKLANE, $city_slot);
                                break;
                            default:
                                // shouldn't be any City cards in 5-player game!
                                throw new BgaVisibleSystemException("Should not be City cards in a 5-player game!");// NOI18N
                    }
                    break;
                    case 9: // Reservation cards
                        switch ($players_nbr) {
                            case 3:
                                $reserve_slot = array_pop($reserves);
                                if ($reserve_slot > $loco_unl) {
                                    $reserve_slot++;
                                }
                                $this->cards->moveCard($lastrow['id'], TRICKLANE, $reserve_slot);
                                break;
                            case 4:
                                // only 1 Reservation card in a 4-player game, and it will always be 11
                                $this->cards->moveCard($lastrow['id'], TRICKLANE, $reserve_slot_4);
                                break;
                            default:
                                // shouldn't be any Reservation cards in 5-player game!
                                throw new BgaVisibleSystemException("Should not be Reservation cards in a 5-player game!");// NOI18N
                        }
                        break;
                    default:
                        throw new BgaVisibleSystemException("Invalid Card found! {$lastrow['id']}");// NOI18N
            }
        }
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
        $result['hand'] = $this->cards->getCardsInLocation( 'hand', $current_player_id );
        // all shares, including discards
        $result['shares'] = array_merge($this->cards->getCardsInLocation('shares'), $this->getDiscardedShares());

        // Cards played onto the table
        $result['currenttrick'] = $this->cards->getCardsInLocation( 'currenttrick');
        $result['lead'] = self::getGameStateValue('leadCard');
        $result['trick'] = self::getGameStateValue('trickRR');
        // Cards in tricklane
        $result['tricklanecards'] = $this->cards->getCardsInLocation( 'tricklane' );

        foreach ( $this->railroads as $rr_id => $railroad ) {
            $result[$railroad['railway'].'_cards'] = $this->cards->getCardsInLocation( $railroad['railway'] );
        }

        // get knowledge of who played what card
        // returns player_id => card_id associative DB
        $cards_sql = "SELECT player_id, card_id FROM TRICK_ROW";
        $result['cards_played'] = self::getCollectionFromDb($cards_sql, true);

        $result['expert'] = $this->isExpertVariant();
        // null if not teams variant
        $result['teams'] = $this->getTeams();

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
    function getGameProgression() {
        $initialTricks = self::getGameStateValue('handSize');
        $tricksLeft = $initialTricks - self::getStat('turns_number');
        return 100*($initialTricks-$tricksLeft)/$initialTricks;
    }

//////////////////////////////////////////////////////////////////////////////
//////////// Utility functions
////////////    

    /**
     * Is this the Expert variant?
     */
    public function isExpertVariant() {
        return $this->getGameStateValue('trickLaneOption') == 2;
    }

    /**
     * Is this the teams option?
     */
    public function isTeamsVariant() {
        return $this->getGameStateValue('teamsOption') == 2;
    }

    /**
     * Returns associative array of teams if this is teams variant, otherwise returns null
     */
    public function getTeams() {
        if ($this->isTeamsVariant()) {
            return $this->getCollectionFromDB("SELECT player_id, team from player", true);
        } else {
            return null;
        }
    }

    /**
     * Does this player_id have a card in hand of current trick color?
     * Return true if yes, false if no.
     */
    function hasCurrentTrick($player_id) {
        $cards_in_hand = $this->cards->getCardsInLocation( 'hand', $player_id );
        $trick_rr = self::getGameStateValue( 'trickRR' );
        foreach ($cards_in_hand as $card) {
            if ($card['type'] == $trick_rr) {
                return true;
            }
        }
        return false;
    }

    /**
     * Return the card_id of the most recent card played to the trickrow by the current active player.
     */
    function getActivePlayersCard() {
        $mycard = self::getUniqueValueFromDB("
        SELECT card_id
        FROM TRICK_ROW
        WHERE player_id=".self::getActivePlayerId());

        return $mycard;
    }

    /**
     * **** Should no longer be needed as the UI checks if a card is already there. ****
     * 
     * Checks whether a locomotive has already been placed here.
     * Given a ${rr}_railway" location.
     * Returns true if there is no locomotive already there, false otherwise.
     */
    function checkLocomotiveSlot( $railway ) {
        $sql = self::getUniqueValueFromDB("
            SELECT *
            FROM CARDS
            WHERE card_location ='".$railway."' AND card_location_arg = 0
        ");
        return ($sql == null);
    }

    /**
     * Returns true if this is a Reservation card
     */
    function isReservationCard($card) {
        return $card['type'] == LASTROW && $card['type_arg'] == RESERVATION;
    }

    /**
     * Convenience function, gets all discarded shares, not including Reservation cards.
     */
    function getDiscardedShares() {
        $discarded = array();
        foreach ($this->cards->getCardsInLocation('discard') as $d) {
            if (!$this->isReservationCard($d)) {
                $discarded[] = $d;
            }
        }
        return $discarded;
    }

    /**
     * Score the values of all railways. Puts them in the stats.
     * Returns a 2-element array of {$locomotive, {path}} arrays with locomotive as element 0
     */
    function scoreRailways() {
        $paths = array();
        foreach ($this->railroads as $rr => $rw) {
            $path = array();
            $railway = $rw['railway'];
            $railwaycards = self::getNonEmptyCollectionFromDB("
            SELECT card_location_arg location_arg, card_type type, card_type_arg type_arg, card_id id
            FROM CARDS
            WHERE card_location = '".$railway."'"
            );
            ksort($railwaycards);

            $locomotive = $railwaycards[0];
            // number of hops - 0 for the ∞ loco
            $loco_dist = 0;
            if ($locomotive['type_arg'] < 5) {
                $loco_dist = $locomotive['type_arg']+2;
            }

            // number of cards in the railway, not counting locomotive
            $num_rw_cards = count($railwaycards);
            $rw_len = $num_rw_cards-1;

            self::setStat($rw_len, $railway."_cards");

            $profit = 0;
            $route_start = 0;
            $route_end = 0;
            $scored_cards = 0;

            $path[] = $locomotive;
            if ($loco_dist == 0 || $loco_dist >= $rw_len) {
                $scored_cards = $rw_len;
                // count all the card values
                for ($i = 1; $i <= $scored_cards; $i++) {
                    $next_card = $railwaycards[$i];
                    $profit += $this->stationValue($next_card);
                }
                $route_start = 1;
                $route_end = $rw_len;
                array_push($path, array_slice($railwaycards, 1, $rw_len));
            } else {
                $scored_cards = $loco_dist;
                // start with first loco distance, then successively add next and discard previous
                // to find longest route
                $max = 0;
                $lastscore = 0;
                $route_start = 1;
                $route_end = $loco_dist;
                // get first route
                for ($i = 1; $i <= $loco_dist; $i++) {
                    $next_card = $railwaycards[$i];
                    $lastscore += $this->stationValue($next_card);
                }
                $max = $lastscore;
                // check the next route by adding the next card and discarding the previous
                for ($j = 2; ($j+$loco_dist) <= $num_rw_cards; $j++ ) {
                    $nextscore = $lastscore;
                    // subtract value of last card
                    $prev_card = $railwaycards[$j-1];
                    $nextscore -= $this->stationValue($prev_card);
                    // add value of next card in lie
                    $end_card = $railwaycards[$j+$loco_dist-1];
                    $nextscore += $this->stationValue($end_card);
                    if ($nextscore > $max) {
                        $max = $nextscore;
                        $route_start = $j;
                        $route_end = $j+$loco_dist-1;
                    }
                    $lastscore = $nextscore;
                }
                array_push($path, array_slice($railwaycards, $route_start, $loco_dist));

                $profit = $max;
            }
            // subtract value of locomotive
            $loco_pen = $this->stationValue($locomotive);
            $share_value = $profit + $loco_pen;
            $share_value = max(0, $share_value);

            self::setStat($share_value, $railway."_share_value");
            self::setStat($scored_cards, $railway."_length");
            $paths[] = $path;
        }
        return $paths;
    }

    /**
     * Given card values (row, column) that start from 1, get the station value of that card
     * from our 0-indexed double array.
     */
    function stationValue($card) {
        $x = $card['type'];
        $y = $card['type_arg'];
        return $this->station_values[$x-1][$y-1];
    }

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

        $card_played = $this->cards->getCard($card_id);
        $railroad = $card_played['type'];
        $player_id = self::getActivePlayerId();
        
        // am I the first to play this trick?
        $plays_card = clienttranslate("plays");
        $trick_rr = self::getGameStateValue( 'trickRR' );
        if ($trick_rr == 0) {
            // I'm the lead
            self::setGameStateValue( 'trickRR', $railroad);
            self::setGameStateValue( 'leadCard', $card_played['id']);
            $plays_card = clienttranslate("leads the trick with");
        } else {
            if ($railroad != $trick_rr) {
                // do I have a card of that color in my hand?
                if ($this->hasCurrentTrick($player_id)) {
                    $compname = $this->railroads[$trick_rr]['nametr'];
                    throw new BgaUserException( self::_( 'You must play a ${compname} card' ));
                }
            }
        }
        // assign incrementing weights to ensure they stay in order
        $wt = $this->cards->countCardsInLocation( 'currenttrick' );
        $this->cards->insertCard( $card_id, 'currenttrick', $wt );
        // update our trick table
        self::DbQuery("
        INSERT INTO TRICK_ROW (player_id, card_id) VALUES (".$player_id.",".$card_id.")
        ");

        // Notify all players about the card played
        // ${rr} and ${card_value} at the end aresubstituted on the client-side with js hacks
        self::notifyAllPlayers('cardPlayed', '${player_name} ${action} ${company} ${card_value_label}${rr}${card_value}', array ( // NOI18N
            'i18n' => array ('action', 'company', 'card_value_label' ),
            'card_id' => $card_id,
            'player_id' => self::getActivePlayerId(),
            'player_name' => self::getActivePlayerName(),
            'action' => $plays_card,
            'card_value' => $card_played ['type_arg'],
            'card_value_label' => $this->values_label [$card_played ['type_arg']],
            'rr' => $railroad,
            'company' => $this->railroads [$railroad] ['name']));
        // Next player
        $this->gamestate->nextState();
    }

    /**
     * Player chooses a place to play Locomotive
     */
    function placeLocomotive( $rr ) {
        self::checkAction( 'placeLocomotive' );

        $loconum = $this->doLocomotivePlacement($rr);

        // by default, everyone adds station
        $nextState = "addStation";
        // if this was Locomotive [6], the last one is automatically placed in the remaining empty slot
        if ($loconum == 4) {
            // unless we're expert variant, in which case we manually place it
            if ($this->isExpertVariant()) {
                // we get to also place the ∞ loco
                // need to increment trick index to ∞ card
                self::incGameStateValue('currentTrickIndex', 1);
                $nextState = "addUnlLocomotive";
            } else {
                // get the railways that already have locomotives
                $placedRRs = self::getCollectionFromDB("
                SELECT card_location railway FROM CARDS
                WHERE card_location_arg = 0 and card_type = 6 AND card_type_arg <= 5
                ", true);

                $ri = 0;
                foreach ($this->railroads as $rri => $rw) {
                    $lastrr = $rw['railway'];
                    if (!array_key_exists($lastrr, $placedRRs)) {
                        $ri = $rri;
                        break;
                    }
                }

                if ($ri == 0) {
                    throw new BgaVisibleSystemException("No railway with empty locomotive slot found!");// NOI18N
                }

                // need to increment trick index to ∞ card
                self::incGameStateValue('currentTrickIndex', 1);
                $this->doLocomotivePlacement($ri);
            }
        }

        // all players add their cards to railway (or in Expert, may be adding ∞ loco)
        $this->gamestate->nextState($nextState);
    }

    /**
     * Actual Locomotive card placement on specified Railway.
     * Return the type_arg (loco card#) of the locomotive placed, so we know if it's the next-to-last one
     */
    function doLocomotivePlacement( $rr ) {
        // TODO- saw a bug where this wound up being 10 in zombie mode? Cannot reproduce
        $lococard = current($this->cards->getCardsInLocation('tricklane', self::getGameStateValue('currentTrickIndex')));
        $locomotive = $this->trick_type[$lococard['type_arg']]['name'];
        $railway = $this->railroads[$rr]['railway'];

        // Should no longer be necessary as the js interface checks?
        // Keep it in case someone tries something shady with JS
        if (!$this->checkLocomotiveSlot($railway)) {
            throw new BgaUserException( self::_( "You must choose a railway that does not already have a locomotive." ));
        }

        // place it on location 0
        $this->cards->moveCard($lococard['id'], $railway, 0);

        // Notify all players about Locomotive placement
        self::notifyAllPlayers('locomotivePlaced', clienttranslate('${player_name} places ${locomotive} on the ${company} railway${rr}'), array (
            'i18n' => array ('locomotive', 'company'),
            'player_id' => self::getActivePlayerId(),
            'player_name' => self::getActivePlayerName(),
            'card_id' => $lococard['id'],
            'locomotive' => $locomotive,
            'loc_num' => $lococard['type_arg'],
            'rr' => $rr,
            'company' => $this->railroads[$rr]['name']));

        return $lococard['type_arg'];
    }

    /**
     * pass true for start of railray, false for end
     */
    function addRailwayCard( $is_start ) {
        self::checkAction( 'addRailwayCard' );
        // get the card I played to play area
        $mycard_id = $this->getActivePlayersCard();
        // card we're going to insert in front or back
        $railwaycard = $this->cards->getCard($mycard_id);

        $railway = $this->railroads[$railwaycard['type']]['railway'];
        $company = $this->railroads[$railwaycard['type']]['name'];
        $card_value = $railwaycard['type_arg'];

        if ($is_start) {
            $this->cards->insertCard($railwaycard['id'], $railway, 1);
        } else {
            $this->cards->insertCardOnExtremePosition( $railwaycard['id'], $railway, true );
        }

        // Notify all players about Locomotive placement
        self::notifyAllPlayers('railwayCardAdded', clienttranslate('${player_name} adds ${card_value_label} to ${endpoint} of the ${company} railway${rr}${card_value}'), array (
            'i18n' => array ('card_value_label', 'endpoint', 'company'),
            'player_id' => self::getActivePlayerId(),
            'player_name' => self::getActivePlayerName(),
            'card_id' => $mycard_id,
            'card_value' => $card_value,
            'card_value_label' => $this->values_label[$card_value],
            'rr' => $railwaycard['type'],
            'company' => $company,
            'endpoint' => $is_start ? 'start' : 'end',
            'railway' => $railway));

        // Next player
        $this->gamestate->nextState();
    }

    /**
     * Passed the railway to add it to, and whether at start or end of line.
     */
    function placeCity( $railway, $is_start ) {
        self::checkAction( 'placeCity' );
        $citycard = current($this->cards->getCardsInLocation('tricklane', self::getGameStateValue('currentTrickIndex')));

        if ($is_start) {
            $this->cards->insertCard($citycard['id'], $railway, 1);
        } else {
            $this->cards->insertCardOnExtremePosition( $citycard['id'], $railway, true );
        }
        $rr = -1;
        // which rr# is this?
        foreach ($this->railroads as $rri => $rw) {
            if ($rw['railway'] == $railway) {
                $rr = $rri;
                break;
            }
        }
        // should not happen! something went wrong in zombie mode
        if ($rr == -1) {
            throw new BgaVisibleSystemException( "No railway found for $railway during ".self::getActivePlayerName()." turn" );// NOI18N
        }

        // Notify all players about City placement
        // ${rr} at the end is substituted by js on the client-side
        self::notifyAllPlayers('cityAdded', clienttranslate('${player_name} adds ${city} to ${endpoint} of the ${company} railway${rr}'), array (
            'i18n' => array ('city', 'endpoint', 'company'),
            'player_id' => self::getActivePlayerId(),
            'player_name' => self::getActivePlayerName(),
            'card_id' => $citycard['id'],
            'city' => $this->trick_type[$citycard['type_arg']]['name'],
            'city_type' => $citycard['type_arg'],
            'rr' => $rr,
            'company' => $this->railroads[$rr]['name'],
            'endpoint' => $is_start ? clienttranslate("start") : clienttranslate("end"),
            'railway' => $railway));

        // go to placing trick cards played
        $this->gamestate->nextState();
    }

//////////////////////////////////////////////////////////////////////////////
//////////// Game state arguments
////////////

    /*
        Here, you can create methods defined as "game state arguments" (see "args" property in states.inc.php).
        These methods function is to return some additional information that is specific to the current
        game state.
    */

    function argPlayCards() {
        $company = "";
        $rr = self::getGameStateValue( 'trickRR' );
        $action = "";
        $qualifier = "";
        $round_type = self::getStat('turns_number') % 2 == 0 ? self::_("Operating Round") : self::_("Stock Round");

        if ($rr == 0) {
            $action = clienttranslate("lead the trick");
            $qualifier = "";
            $company = "";
        } else if ($this->hasCurrentTrick(self::getActivePlayerId())) {
            $action = clienttranslate("play a");
            $qualifier = clienttranslate("card");
            $company = $this->railroads[$rr]['name'];
        } else {
            $action = clienttranslate("play any card (no");
            $qualifier = clienttranslate("cards in hand)");
            $company = $this->railroads[$rr]['name'];
        }
        return array(
            "i18n" => array('round_type', 'card_action', 'qualifier', 'company'),
            'round_type' => $round_type,
            'card_action' => $action,
            'qualifier' => $qualifier,
            'rr' => $rr,
            'company' => $company,
        );
    }

    function argPlaceLocomotive() {
        $lococard = current($this->cards->getCardsInLocation('tricklane', self::getGameStateValue('currentTrickIndex')));
        $locomotive = $this->trick_type[$lococard['type_arg']]['name'];

        return array(
            "i18n" => array( 'locomotive'),
            'locomotive' => $locomotive,
        );
    }

    function argPlaceCity() {
        $citycard = current($this->cards->getCardsInLocation('tricklane', self::getGameStateValue('currentTrickIndex')));
        $city = $this->trick_type[$citycard['type_arg']]['name'];

        return array(
            "i18n" => array( 'city'),
            'city' => $city
        );
    }

    function argAddRailway() {
        $mycard_id = $this->getActivePlayersCard();
        
        $rrcard = $this->cards->getCard($mycard_id);

        return array(
            "i18n" => array( 'rr', 'card_value_label', 'company'),
            'rr' => $rrcard['type'],
            'card_value' => $rrcard['type_arg'],
            'card_value_label' => $this->values_label[$rrcard['type_arg']],
            'company' => $this->railroads[$rrcard['type']]['name']
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
        self::setGameStateValue( 'leadCard', 0 );

        // initial stats
        self::incStat(1, 'turns_number');
        self::incGameStateValue('currentTrickIndex', 1);

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
        if ( $this->cards->countCardInLocation( 'currenttrick' ) == self::getPlayersNumber() ) {
            // end of trick
            // Who won?
            $color = self::getGameStateValue( 'trickRR' );

            $bestCard = 0;
            $bestVal = 0;
            foreach ($this->cards->getCardsInLocation( 'currenttrick') as $cardPlayed) {
                if ($cardPlayed['type'] == $color) {
                    if ($cardPlayed['type_arg'] > $bestVal) {
                        $bestCard = $cardPlayed;
                        $bestVal = $cardPlayed['type_arg'];
                    }
                }
            }
            // should not happen!
            if ($bestCard == 0) {
                throw new BgaVisibleSystemException( "no winner of trick determined!" );// NOI18N
            } else {
                $winner = self::getUniqueValueFromDB("
                    SELECT player_id FROM TRICK_ROW
                    WHERE card_id =".$bestCard['id']
                );
            }
            self::setGameStateValue( 'wonLastTrick', $winner);
            self::incStat(1, 'tricks_won', $winner);

            $this->gamestate->changeActivePlayer( $winner );

            // ${rr}${card_value} at the end are substituted on the client side with js hacks
            self::notifyAllPlayers('winTrick', clienttranslate('${player_name} wins trick with ${company} ${card_value_label}${rr}${card_value}'), array (
                'i18n' => array ('company', 'card_value_label' ),
                'player_id' => self::getActivePlayerId(),
                'player_name' => self::getActivePlayerName(),
                'card_value' => $bestCard ['type_arg'],
                'card_value_label' => $this->values_label [$bestCard ['type_arg']],
                'rr' => $bestCard['type'],
                'company' => $this->railroads [$bestCard ['type']] ['name']));

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
        $rewardCard = current($this->cards->getCardsInLocation('tricklane', self::getGameStateValue('currentTrickIndex')));

        if ($rewardCard['type'] == LASTROW) {
            if ($rewardCard['type_arg'] <= 5) {
                $reward = "locomotive";
            } else if ($rewardCard['type_arg']  <= 8) {
                $reward = "city";
            } else {
                // shouldn't get here!
                throw new BgaVisibleSystemException('Invalid Trick Lane card: type='.$rewardCard['type'].', type_arg='.$rewardCard['type_arg']); // NOI18N
            }
        } else {
            // if it's not the last row, it's either an Exchange or Railway card
            $reward = "share";
        }
        $this->gamestate->nextState( $reward );
    }

    function stNextRailway() {
        // are there still cards to play?
        $to_state = "";

        $remaining = $this->cards->countCardInLocation('currenttrick');
        if ($remaining > 0) {
            $to_state = 'nextPlayer';
            $player_id = self::activeNextPlayer();
            self::giveExtraTime( $player_id );
        } else {
            // is there another trick?
            if ($this->cards->countCardInLocation('tricklane') > 0) {
                $to_state = "nextTrick";
            } else {
                // go to scoring
                $to_state = "endGame";
            }
        }

        $this->gamestate->nextState( $to_state );
    }

    /**
     * Triggered after winning a RR or Exchange from Trick Lane.
     */
    function stAddShares() {
        $rewardCard = current($this->cards->getCardsInLocation('tricklane', self::getGameStateValue('currentTrickIndex')));
        $winner = self::getGameStateValue( 'wonLastTrick' );
        // assoc player => cardplayed
        $tricksPlayed = self::getCollectionFromDB( "SELECT player_id player, card_id id FROM TRICK_ROW", true );

        $players = self::loadPlayersBasicInfos();
        // add the shares everyone played to their piles
        foreach ($tricksPlayed as $player => $trick_id) {
            // the card the winner played is exchanged or discarded
            if ($player == $winner) {
                // Are there any Reservation cards?
                $reservation = null;
                foreach ($this->cards->getCardsInLocation('tricklane', null, 'location_arg') as $tricklanecard) {
                    if ($this->isReservationCard($tricklanecard)) {
                        $reservation = $tricklanecard;
                        // stop at the first one
                        break;
                    }
                }
                if ($reservation == null) {
                    // no reservation card, so card winner played is discarded
                    $this->cards->moveCard($trick_id, 'discard');
                } else {
                    // replace the Reservation card with the card played,
                    $reserve_slot = $reservation['location_arg'];
                    $this->cards->moveCard($reservation['id'], 'discard');
                    $this->cards->moveCard($trick_id, 'tricklane', $reserve_slot);
                }
                // notify everyone winner discards/exchanges a card with Reservation
                $discarded = $this->cards->getCard($trick_id);
                if ($reservation != null) {
                    // ${rr}${card_value} at the end are replaced with js substitution on the client side
                    self::notifyAllPlayers('reservationSwapped', clienttranslate('${player_name} replaces Reservation card with ${company} ${card_value_label} in Trick Lane${rr}${card_value}'), array (
                        'i18n' => array ('company', 'card_value_label' ),
                        'player_id' => $player,
                        'player_name' => $players[$player]['player_name'],
                        'card_id' => $discarded['id'],
                        'rr' => $discarded['type'],
                        'card_value' => $discarded['type_arg'],
                        'card_value_label' => $this->values_label[$discarded['type_arg']],
                        'reservation_id' => $reservation['id'],
                        'reservation_loc' => $reservation['location_arg'],
                        'company' => $this->railroads [$discarded['type']] ['name']));
                } else {
                    // ${rr}${card_value} at the end are replaced with js substitution on the client side
                    self::notifyAllPlayers('discardedShare', clienttranslate('${player_name} discards ${company} ${card_value_label}${rr}${card_value}'), array (
                        'i18n' => array ('company', 'card_value_label' ),
                        'player_id' => $player,
                        'player_name' => $players[$player]['player_name'],
                        'card_id' => $discarded['id'],
                        'rr' => $discarded['type'],
                        'card_value' => $discarded['type_arg'],
                        'card_value_label' => $this->values_label[$discarded['type_arg']],
                        'company' => $this->railroads [$discarded['type']] ['name']));
                }

                // winner adds card from tricklane to his shares
                // THIS COULD BE A RR card or an Exchange Card!
                $share = $rewardCard;
                $this->cards->moveCard($share['id'], 'shares', $winner);
            } else {
                // for other players, their card played gets added to shares
                $share = $this->cards->getCard($trick_id);
                $this->cards->moveCard($share['id'], 'shares', $player);
            }
            // ${rr}${card_value} at the end are replaced with js substitution on the client side
            self::notifyAllPlayers('shareAdded', clienttranslate('${player_name} adds ${card_value_label} to ${company} shares${rr}${card_value}'), array (
                'i18n' => array ('company', 'card_value_label' ),
                'player_id' => $player,
                'player_name' => $players[$player]['player_name'],
                'card_id' => $share['id'],
                'rr' => $share['type'],
                'card_value' => $share['type_arg'],
                'card_value_label' => $this->values_label[$share['type_arg']],
                'company' => $this->railroads[$share['type']] ['name']));
        }

        // is there another trick?
        if ($this->cards->countCardInLocation('tricklane') > 0) {
            $this->gamestate->nextState( "nextTrick" );
        } else {
            // go to scoring
            $this->gamestate->nextState( "endGame" );
        }
    }

    /**
     * Create array of Station Values corresponding to each card in array
     */
    function stationValuesList($cards) {
        $svs = array();
        foreach ($cards as $card) {
            $sv = $this->stationValue($card);
            $svs[] = $sv;
        }
        return $svs;
    }

    /**
     * Takes each rr path (2-element array of {$locomotive, {$path}} arrays)  and sends notifications that display the RR paths.
     */
    function displayRRScoring($rr_paths) {
        $rri = 1;
        foreach ($rr_paths as $path) {
            $locomotive = $path[0];
            $rrcards = $path[1];
            $station_values = $this->stationValuesList($rrcards);
            $loco_value = $this->stationValue($locomotive);
            self::notifyAllPlayers('railroadScored', clienttranslate('scoring ${company} railway'), array (
                'i18n' => array ('company'),
                'company' => $this->railroads[$rri]['name'],
                'rr' => $rri,
                // DO NOT USE 'locomotive' as arg, gets replaced in logs!
                'train' => $locomotive,
                'train_value' => $loco_value,
                'stations' => $rrcards,
                'station_values' => $station_values,
            ));
            $rri++;
        }
    }


    /**
     * End of game, scoring done here.
     */
    function stScoring() {
        // first we calculate the values of every Railroad
        $rr_paths = $this->scoreRailways();

        $this->displayRRScoring($rr_paths);

        $player_scores = array();
        $highscore = 0;
        // now calculate how many shares of each RR each player has
        $players = self::loadPlayersBasicInfos();
        foreach( $players as $player_id => $player ) {
            $score = 0;

            $shares = self::getNonEmptyCollectionFromDB("
            SELECT card_id card_id, card_type rr
            FROM CARDS
            WHERE card_location = 'shares' AND card_location_arg = $player_id
            ", true);

            foreach($this->railroads as $rr => $rw) {
                $railway = $rw['railway'];
                $share_value = self::getStat($railway."_share_value");

                // how many shares does this player have?
                $rr_shares = 0;
                foreach( $shares as $cid => $rrsh ) {
                    if ($rrsh['rr'] == $rr) {
                        $rr_shares++;
                    }
                }
                $rr_profit = $share_value * $rr_shares;
                $score += $rr_profit;

                self::setStat($rr_shares, $railway."_shares", $player_id);
                self::setStat($rr_profit, $railway."_profits", $player_id);
            }
            $player_scores[$player['player_name']] = $score;
            $highscore = max($highscore, $score);

            self::DbQuery( "UPDATE player SET player_score=$score WHERE player_id=$player_id" );
        }

        // for teams, add the partners' scores
        if ($this->isTeamsVariant()) {
            for ($t = 1; $t <=2; $t++) {
                $teamscore = self::getUniqueValueFromDB( "SELECT SUM(player_score) FROM player WHERE team=$t", true );
                // now set each player's score to the teamscore
                self::DbQuery( "UPDATE player SET player_score=$teamscore WHERE team=$t" );
                $highscore = max($highscore, $teamscore);
            }
        }
        $score_table = $this->createFinalScoreTable();
        $winner_label = $this->isTeamsVariant() ? $this->createTeamWinnerList($highscore) : $this->createWinnerList($player_scores, $highscore);

        $this->notifyAllPlayers( "tableWindow", '', array(
            "id" => 'finalScoring',
            "title" => clienttranslate("Final Score"),
            "table" => $score_table,
            "header" => $winner_label,
            "closing" => clienttranslate( "Choo! Choo!" )
        ) ); 

        $this->gamestate->nextState( "" );
    }

    /**
     * Simple string function for header
     */
    function createWinnerList($player_scores, $highscore) {
        $winners = array();
        foreach ($player_scores as $player_name => $score) {
            if ($score >= $highscore) {
                $winners[] = $player_name;
            }
        }
        $winner_str = $winners[0];
        if (count($winners) > 1) {
            for ($i = 1; $i < count($winners); $i++) {
                $winner_str = $winner_str." ".$winners[$i];
            }
            $winner_str = clienttranslate("Winners: ").$winner_str;
        } else {
            $winner_str = clienttranslate("Winner: ").$winner_str;
        }
        return $winner_str;
    }

    /**
     * Create string for winning team
     */
    function createTeamWinnerList($highscore) {
        $player_scores = self::getNonEmptyCollectionFromDB( "SELECT player_name, player_score score, team FROM player" );
        $winners = array();
        $team = 0;
        foreach ($player_scores as $player) {
            if ($player['score'] == $highscore) {
                $winners[] = $player['player_name'];
                $team = $player['team'];
            }
        }
        $teamlbl = $team == 1 ? clienttranslate("One") : clienttranslate("Two");
        $winnerlbl = $winners[0].", ".$winners[1];
        $teamwinners = clienttranslate('Team ${teamlbl} Winners: ${winnerlbl}');
        return $teamwinners;
    }

    /**
     * Create the table for final score display.
     */
    function createFinalScoreTable() {
        $table = array();
        // row 1
        $table_header = array();
        $table_header[] = array('str' => clienttranslate("Company"), 
                                'args' => array(), 
                                'type' => 'header');
        $table_header[] = array('str' => clienttranslate("Share Value"),
                                'args' => array(),
                                'type' => 'header');
        // array of rows
        $profit_rows = array();
        foreach( $this->railroads as $rr => $comp) {
            $next_row = array();
            // put company name on left column
            // ${rr} is our hack for the client-side to turn it into the rr icon
            $next_row[] = array('str' => '${company}${rr}',
                                'i18n' => array ('company'),
                                'args' => array( 'company' => $comp['name'], 'rr' => $rr),
                                'type' => 'header');
            // and its profits
            $next_row[] = self::getStat($comp['railway']."_share_value");
            $profit_rows[] = $next_row;
        }
        $total_profits = array(clienttranslate("Profits"));
        // empty cell
        $total_profits[] = "";

        // now iterate players
        $players = self::loadPlayersBasicInfos();
        // order players by teams
        if ($this->isTeamsVariant()) {
            $teams = $this->getTeams();
            $players = $this->sortPlayersByTeams($players, $teams);
        }
        $team1score = 0;
        $team2score = 0;
        foreach( $players as $player ) {
            $player_id = $player['player_id'];
            $score = 0;
            $teamstr = "";
            if ($this->isTeamsVariant()) {
                $team = $teams[$player_id];
                $teamstr = clienttranslate(' (Team ${team})');
            }
            $table_header[] = array('str' => '${player_name}${teamstr}',
                                    'args' => array( 'player_name' => $player['player_name'], 'teamstr' => $teamstr),
                                    'type' => 'header');

            $row = 0;
            foreach( $this->railroads as $rr2 => $company) {
                $shares = self::getStat($company['railway']."_shares", $player_id);
                $profit = self::getStat($company['railway']."_profits", $player_id);
                $profit_rows[$row++][] = array('str' => '${profit} (${shares} shares)',
                                                'i18n' => array ('profit', 'shares' ),
                                                'args' => array('shares' => $shares, 'profit' => $profit));
                $score += $profit;
            }
            $total_profits[] = $score;
            if ($this->isTeamsVariant()) {
                $team = $teams[$player_id];
                if ($team == 1) {
                    $team1score += $score;
                } else {
                    $team2score += $score;
                }
            }
        }
        $table[] = $table_header;
        foreach ($profit_rows as $p) {
            $table[] = $p;
        }
        $table[] = $total_profits;
        if ($this->isTeamsVariant()) {
            $team_row = array();
            $team_row[] = array('str' => clienttranslate('Team Scores'), 'args' => array(), 'type' => 'header' );
            $team_row[] = array('str' => ' ', 'args' => array(), 'type' => 'header' );
            $team_row[] = array('str' => clienttranslate('Team 1'), 'args' => array(), 'type' => 'header' );
            $team_row[] = array('str' => clienttranslate('${team1}'), 'args' => array('team1' => $team1score), 'type' => 'header' );
            $team_row[] = array('str' => clienttranslate('Team 2'), 'args' => array(), 'type' => 'header' );
            $team_row[] = array('str' => clienttranslate('${team2}'), 'args' => array('team2' => $team2score), 'type' => 'header' );
            $table[] = $team_row;
        }

        return $table;
    }

    /**
     * Make sure players are sorted by teams
     */
    function sortPlayersByTeams($players, $teams) {
        $team1 = array();
        $team2 = array();
        // player_id => team
        foreach( $players as $player_id => $player ) {
            if ($teams[$player_id] == 1) {
                $team1[$player_id] = $player;
            } else if ($teams[$player_id] == 2) {
                $team2[$player_id] = $player;
            } else {
                // something happened!
                throw new BgaVisibleSystemException("Player $player_id not in team!"); // NOI18N
            }
        }
        return array_merge($team1, $team2);
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
        // zombie has to play a acard
        if ($statename == 'playerTurn') {
            $trick_rr = self::getGameStateValue( 'trickRR' );
            if ($trick_rr == 0) {
                // zombie leads with highest card in their hand
                $sql = "SELECT card_id id, MAX(card_type_arg) val FROM CARDS WHERE card_location = 'hand' AND card_location_arg = $active_player";
                $zombiecard = self::getUniqueValueFromDB( $sql );
            } else {
                // play highest card in the trick color
                $sql = "SELECT card_id id, MAX(card_type_arg) FROM CARDS WHERE card_location = 'hand' AND card_location_arg = $active_player AND card_type = $trick_rr";
                $zombiecard = self::getUniqueValueFromDB( $sql );
                if ($zombiecard == null) {
                    // play any card, play lowest card
                    $sql = "SELECT card_id id, MIN(card_type_arg) FROM CARDS WHERE card_location = 'hand' AND card_location_arg = $active_player";
                    $zombiecard = self::getUniqueValueFromDB( $sql );
                }
            }
            $this->playCard($zombiecard);
            return;
        }
        if ($statename == 'addLocomotive') {
            // get all railways that already have locomotives
            $sql = "SELECT card_location railway, card_id FROM CARDS WHERE card_type = 6 AND card_type_arg <= 5 AND card_location_arg = 0";
            $occupied = self::getCollectionFromDb($sql, true);

            // choose first empty one
            foreach ($this->railroads as $rr => $rw) {
                if (!array_key_exists($rw['railway'], $occupied)) {
                    $this->placeLocomotive($rr);
                    return;
                }
            }
            // shouldn't happen...
            throw new BgaVisibleSystemException("Zombie mode: Failed to find unoccupied railway");// NOI18N
            return;
        }
        if ($statename == 'addCity') {
            // add to random railway
            $randomrw = bga_rand(1,5);
            $rw = $this->railroads[$randomrw]['railway'];
            // flip a coin, start or end
            $flip = bga_rand(1,2);
            $this->placeCity($rw, $flip == 1);
            return;
        }
        if ($statename == 'addRailway') {
            // flip a coin, start or end
            $flip = bga_rand(1,2);
            $this->addRailwayCard($flip == 1);
            return;
        }

        /** Really shouldn't be hitting anything below? */

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

        throw new BgaVisibleSystemException( 'Zombie mode not supported at this game state: $statename');// NOI18N
    }
    
    function isZombie($player_id) {
        return self::getUniqueValueFromDB(self::format("
            SELECT player_zombie FROM player WHERE player_id={player_id}
        ", array('player_id' => $player_id)));
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

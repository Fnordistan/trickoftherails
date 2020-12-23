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
 * trickoftherails.view.php
 *
 * This is your "view" file.
 *
 * The method "build_page" below is called each time the game interface is displayed to a player, ie:
 * _ when the game starts
 * _ when a player refreshes the game page (F5)
 *
 * "build_page" method allows you to dynamically modify the HTML generated for the game interface. In
 * particular, you can set here the values of variables elements defined in trickoftherails_trickoftherails.tpl (elements
 * like {MY_VARIABLE_ELEMENT}), and insert HTML block elements (also defined in your HTML template file)
 *
 * Note: if the HTML of your game interface is always the same, you don't have to place anything here.
 *
 */
  
  require_once( APP_BASE_PATH."view/common/game.view.php" );
  
  class view_trickoftherails_trickoftherails extends game_view
  {
    function getGameName() {
        return "trickoftherails";
    }    
  	function build_page( $viewArgs )
  	{		
  	    // Get players & players number
        $players = $this->game->loadPlayersBasicInfos();
        $players_nbr = count( $players );

        /*********** Place your code below:  ************/

        $template = self::getGameName() . "_" . self::getGameName();

        // this will make our My Hand text translatable
        $this->tpl['MY_HAND'] = self::_("My hand");
        $this->tpl['SHOW_SHARES_TEXT'] = self::_("Show All Player Shares");

        // this will inflate our player block with actual players data
        $this->page->begin_block($template, "SHARES");
        foreach ( $players as $player_id => $player) {
            $this->page->insert_block("SHARES", array (
                "PLAYER" => $player_id,
                "PLAYER_NAME" => $player['player_name']
            ));
        }

        $RAILCOS = array( 'b_and_o', 'c_and_o', 'erie', 'nyc', 'prr' );
        
        $this->page->begin_block($template, "RAILROAD");
        foreach ( $RAILCOS as $rr) {
            $this->page->insert_block("RAILROAD", array ("RR" => $rr));
        }

        /*
        
        // Examples: set the value of some element defined in your tpl file like this: {MY_VARIABLE_ELEMENT}

        // Display a specific number / string
        $this->tpl['MY_VARIABLE_ELEMENT'] = $number_to_display;


        // Display some HTML content of your own:
        $this->tpl['MY_VARIABLE_ELEMENT'] = self::raw( $some_html_code );



        /*********** Do not change anything below this line  ************/
  	}
  }
  


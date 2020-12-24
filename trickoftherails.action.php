<?php
/**
 *------
 * BGA framework: © Gregory Isabelli <gisabelli@boardgamearena.com> & Emmanuel Colin <ecolin@boardgamearena.com>
 * TrickOfTheRails implementation : @ David Edelstein <davidedelstein@gmail.com>
 *
 * This code has been produced on the BGA studio platform for use on https://boardgamearena.com.
 * See http://en.doc.boardgamearena.com/Studio for more information.
 * -----
 * 
 * trickoftherails.action.php
 *
 * TrickOfTheRails main action entry point
 *
 *
 * In this file, you are describing all the methods that can be called from your
 * user interface logic (javascript).
 *       
 * If you define a method "myAction" here, then you can call it from your javascript code with:
 * this.ajaxcall( "/trickoftherails/trickoftherails/myAction.html", ...)
 *
 */
  
  
  class action_trickoftherails extends APP_GameAction
  { 
    // Constructor: please do not modify
   	public function __default()
  	{
  	    if( self::isArg( 'notifwindow') )
  	    {
            $this->view = "common_notifwindow";
  	        $this->viewArgs['table'] = self::getArg( "table", AT_posint, true );
  	    }
  	    else
  	    {
            $this->view = "trickoftherails_trickoftherails";
            self::trace( "Complete reinitialization of board game" );
      }
  	} 
  	
    /**
     * Either lead or follow
     */
    public function playCard() {
      self::setAjaxMode();     
      $card_id = self::getArg( "id", AT_posint, true );
      $this->game->playCard( $card_id );
      self::ajaxResponse( );
    }

    /**
     * Place locomotive. Passed int representing rr#
     */
    public function placeLocomotive() {
      self::setAjaxMode();
      $rr = self::getArg( "rr", AT_posint, true );
      $this->game->placeLocomotive( $rr );
      self::ajaxResponse( );
    }

    public function placeCity() {
      self::setAjaxMode();
      $railway = self::getArg( "sRR", AT_alphanum, true);
      $start = self::getArg( "bStart", AT_bool, true);
      $this->game->placeCity( $railway, $start );
      self::ajaxResponse( );
    }

    public function addRailwayCard() {
      self::setAjaxMode();
      $start = self::getArg( "bStart", AT_bool, true);
      $this->game->addRailwayCard( $start );
      self::ajaxResponse( );
    }

  }
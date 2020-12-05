/**
 *------
 * BGA framework: © Gregory Isabelli <gisabelli@boardgamearena.com> & Emmanuel Colin <ecolin@boardgamearena.com>
 * TrickOfTheRails implementation : @ David Edelstein <davidedelstein@gmail.com>
 *
 * This code has been produced on the BGA studio platform for use on http://boardgamearena.com.
 * See http://en.boardgamearena.com/#!doc/Studio for more information.
 * -----
 *
 * trickoftherails.js
 *
 * TrickOfTheRails user interface script
 * 
 * In this file, you are describing the logic of your user interface, in Javascript language.
 *
 */

define([
    "dojo","dojo/_base/declare",
    "ebg/core/gamegui",
    "ebg/counter",
    "ebg/stock"
],
function (dojo, declare) {
    return declare("bgagame.trickoftherails", ebg.core.gamegui, {
        constructor: function(){
            console.log('trickoftherails constructor');
              
            // Here, you can init the global variables of your user interface
            console.log('trick of the rails constructor');
            this.cardwidth = 114;
            this.cardheight = 171;
        },
        
        /*
            setup:
            
            This method must set up the game user interface according to current game situation specified
            in parameters.
            
            The method is called each time the game interface is displayed to a player, ie:
            _ when the game starts
            _ when a player refreshes the game page (F5)
            
            "gamedatas" argument contains all datas retrieved by your "getAllDatas" PHP method.
        */
        
        setup: function( gamedatas )
        {
            console.log( "Starting game setup" );
            
            // Setting up player boards
            for( var player_id in gamedatas.players )
            {
                var player = gamedatas.players[player_id];
                         
                // TODO: Setting up players boards if needed
            }
            
            // Player hand
            this.playerHand = new ebg.stock();
            this.playerHand.create( this, $('myhand'), this.cardwidth, this.cardheight );
            // card sprites is actually 6x12, but railroads are in first 5 rows, and value cards are in cols 1-10
            this.playerHand.image_items_per_row = 12;

            // Now set up trick lane
            // We specify no weight because we don't want it sorted
            this.trickLane = new ebg.stock();
            this.trickLane.create(this, $('trickrewards'), this.cardwidth, this.cardheight );
            this.trickLane.image_items_per_row = 12;

            // Create RR and Trick card types:
            for( var rr = 1; rr <= 6; rr++ )
            {
                for (var vv = 1; vv <= 11; vv++ )
                {
                    // Build card type id
                    var card_type_id = this.getUniqueTypeForCard( rr, vv );

                    if (rr == 6) {
                        // only Locomotives, Cities, and Reservation cards on last row
                        if (vv <= 9) {
                            this.trickLane.addItemType( card_type_id, 0, g_gamethemeurl+'img/cards_sprites.jpg', card_type_id );
                        }
                    } else {
                        if (vv == 11) {
                            // it's an Exchange card
                            this.trickLane.addItemType( card_type_id, 0, g_gamethemeurl+'img/cards_sprites.jpg', card_type_id );
                        } else {
                            this.playerHand.addItemType( card_type_id, card_type_id, g_gamethemeurl+'img/cards_sprites.jpg', card_type_id );
                        }
                    }
                }
            }

            // Cards in player's hand
            for ( var i in this.gamedatas.hand) {
                var card = this.gamedatas.hand[i];
                var rr = card.type;
                var value = card.type_arg;
                this.playerHand.addToStockWithId(this.getUniqueTypeForCard(rr, value), card.id);
            }

            // // Cards played on table
            // for (i in this.gamedatas.cardsontable) {
            //     var card = this.gamedatas.cardsontable[i];
            //     var rr = card.type;
            //     var value = card.type_arg;
            //     var player_id = card.location_arg;
            //     this.playCardOnTable(player_id, rr, value, card.id);
            // }

            for (var i in this.gamedatas.tricklanecards) {
                var card = this.gamedatas.tricklanecards[i];
                var tt = card.type;
                var value = card.type_arg;
                this.trickLane.addToStockWithId(this.getUniqueTypeForCard(tt, value), card.id);
            }

            dojo.connect( this.playerHand, 'onChangeSelection', this, 'onPlayerHandSelectionChanged' );


            // Setup game notifications to handle (see "setupNotifications" method below)
            this.setupNotifications();

            console.log( "Ending game setup" );
        },
       

        ///////////////////////////////////////////////////
        //// Game & client states
        
        // onEnteringState: this method is called each time we are entering into a new game state.
        //                  You can use this method to perform some user interface changes at this moment.
        //
        onEnteringState: function( stateName, args )
        {
            console.log( 'Entering state: '+stateName );
            
            switch( stateName )
            {
            
            /* Example:
            
            case 'myGameState':
            
                // Show some HTML block at this game state
                dojo.style( 'my_html_block_id', 'display', 'block' );
                
                break;
           */
           
           
            case 'dummmy':
                break;
            }
        },

        // onLeavingState: this method is called each time we are leaving a game state.
        //                 You can use this method to perform some user interface changes at this moment.
        //
        onLeavingState: function( stateName )
        {
            console.log( 'Leaving state: '+stateName );
            
            switch( stateName )
            {
            
            /* Example:
            
            case 'myGameState':
            
                // Hide the HTML block we are displaying only during this game state
                dojo.style( 'my_html_block_id', 'display', 'none' );
                
                break;
           */
           
           
            case 'dummmy':
                break;
            }               
        }, 

        // onUpdateActionButtons: in this method you can manage "action buttons" that are displayed in the
        //                        action status bar (ie: the HTML links in the status bar).
        //        
        onUpdateActionButtons: function( stateName, args )
        {
            console.log( 'onUpdateActionButtons: '+stateName );
                      
            if( this.isCurrentPlayerActive() )
            {            
                switch( stateName )
                {
/*               
                 Example:
 
                 case 'myGameState':
                    
                    // Add 3 action buttons in the action status bar:
                    
                    this.addActionButton( 'button_1_id', _('Button 1 label'), 'onMyMethodToCall1' ); 
                    this.addActionButton( 'button_2_id', _('Button 2 label'), 'onMyMethodToCall2' ); 
                    this.addActionButton( 'button_3_id', _('Button 3 label'), 'onMyMethodToCall3' ); 
                    break;
*/
                }
            }
        },        

        ///////////////////////////////////////////////////
        //// Utility methods

        /**
         * Gets a unique identifier for each  card
         * @param int $rr 
         * @param int $v
         * @returns int
         */
        getUniqueTypeForCard: function(rr, v)
        {
            return (rr-1)*12+(v-1);
        },

        /**
         * 
         * @param {*} player_id 
         * @param {*} rr 
         * @param {*} value 
         * @param {*} card_id 
         */
        playCardOnTable : function(player_id, rr, value, card_id) {
            // player_id => direction
            dojo.place(this.format_block('jstpl_cardontable', {
                x : this.cardwidth * (value - 1),
                y : this.cardheight * (rr - 1),
                player_id : player_id
            }), 'cardsontable');

            if (player_id != this.player_id) {
                // Some opponent played a card
                // Move card from player panel
                this.placeOnObject('cardsontable', 'overall_player_board_' + player_id);
            } else {
                // You played a card. If it exists in your hand, move card from there and remove
                // corresponding item

                if ($('myhand_item_' + card_id)) {
                    this.placeOnObject('cardsontable', 'myhand_item_' + card_id);
                    this.playerHand.removeFromStockById(card_id);
                }
            }

            // In any case: move it to its final destination
            this.slideToObject('cardsontable', 'playertablecard_' + player_id).play();
        },

        ///////////////////////////////////////////////////
        //// Player's action
        
        /*
        
            Here, you are defining methods to handle player's action (ex: results of mouse click on 
            game objects).
            
            Most of the time, these methods:
            _ check the action is possible at this game state.
            _ make a call to the game server
        
        */
        
       onPlayerHandSelectionChanged : function() {
        var items = this.playerHand.getSelectedItems();

        if (items.length > 0) {
            if (this.checkAction('playCard', true)) {
                // Can play a card

                var card_id = items[0].id;
                console.log("on playCard "+card_id);

                this.playerHand.unselectAll();
            } else if (this.checkAction('giveCards')) {
                // Can give cards => let the player select some cards
            } else {
                this.playerHand.unselectAll();
            }
        }
    },


        /* Example:
        
        onMyMethodToCall1: function( evt )
        {
            console.log( 'onMyMethodToCall1' );
            
            // Preventing default browser reaction
            dojo.stopEvent( evt );

            // Check that this action is possible (see "possibleactions" in states.inc.php)
            if( ! this.checkAction( 'myAction' ) )
            {   return; }

            this.ajaxcall( "/trickoftherails/trickoftherails/myAction.html", { 
                                                                    lock: true, 
                                                                    myArgument1: arg1, 
                                                                    myArgument2: arg2,
                                                                    ...
                                                                 }, 
                         this, function( result ) {
                            
                            // What to do after the server call if it succeeded
                            // (most of the time: nothing)
                            
                         }, function( is_error) {

                            // What to do after the server call in anyway (success or failure)
                            // (most of the time: nothing)

                         } );        
        },        
        
        */

        
        ///////////////////////////////////////////////////
        //// Reaction to cometD notifications

        /*
            setupNotifications:
            
            In this method, you associate each of your game notifications with your local method to handle it.
            
            Note: game notification names correspond to "notifyAllPlayers" and "notifyPlayer" calls in
                  your trickoftherails.game.php file.
        
        */
        setupNotifications: function()
        {
            console.log( 'notifications subscriptions setup' );
            
            // TODO: here, associate your game notifications with local methods
            
            // Example 1: standard notification handling
            // dojo.subscribe( 'cardPlayed', this, "notif_cardPlayed" );
            
            // Example 2: standard notification handling + tell the user interface to wait
            //            during 3 seconds after calling the method in order to let the players
            //            see what is happening in the game.
            // dojo.subscribe( 'cardPlayed', this, "notif_cardPlayed" );
            // this.notifqueue.setSynchronous( 'cardPlayed', 3000 );
            // 
        },  
        
        // TODO: from this point and below, you can write your game notifications handling methods
        
        /*
        Example:
        
        notif_cardPlayed: function( notif )
        {
            console.log( 'notif_cardPlayed' );
            console.log( notif );
            
            // Note: notif.args contains the arguments specified during you "notifyAllPlayers" / "notifyPlayer" PHP call
            
            // TODO: play the card in the user interface.
        },    
        
        */
   });             
});

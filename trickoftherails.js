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

ROWS = 6;
COLS = 12;

const B_O = 0;
const C_O = 1;
const ERIE = 2;
const NYC = 3;
const PRR = 4;
const RR_INDEXES = [B_O, C_O, ERIE, NYC, PRR];
const RR_PREFIXES = ["b_and_o", "c_and_o", "erie", "nyc", "prr"];

const EXCHANGE = 11;
const STATION = 12;

const CARD_SPRITES = 'img/cards_sprites.jpg';


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
            for( const player_id in gamedatas.players )
            {
                var player = gamedatas.players[player_id];
                         
                // TODO: Setting up players boards if needed
            }
            
            // Player hand
            this.playerHand = new ebg.stock();
            this.playerHand.create( this, $('myhand'), this.cardwidth, this.cardheight );
            this.playerHand.setSelectionMode(1);
            // card sprites is actually 6x12, but railroads are in first 5 rows, and value cards are in cols 1-10
            this.playerHand.image_items_per_row = 12;

            // Now set up trick lane
            // We specify no weight because we don't want it sorted
            this.trickLane = new ebg.stock();
            this.trickLane.create(this, $('trickrewards'), this.cardwidth, this.cardheight );
            this.trickLane.setSelectionMode(0);
            this.trickLane.image_items_per_row = 12;

            // where cards are played for the current trick
            this.currentTrick = new ebg.stock();
            this.currentTrick.create(this, $('currenttrick'), this.cardwidth, this.cardheight );
            this.currentTrick.setSelectionMode(0);
            this.currentTrick.image_items_per_row = 12;
            // WARNING: undocumented feature! To be really safe, we should write our own function to preserve weights of items added
            this.currentTrick.order_items = false;

            // and create the stocks for all five railways
            this.railWays = [];
            for (const rr of RR_PREFIXES)
            {
                var railway = new ebg.stock();
                railway.create(this, $(rr+'_railway'), this.cardwidth, this.cardheight );
                railway.setSelectionMode(0);
                railway.image_items_per_row = 12;
                this.railWays.push(railway);
            }

            // Create card types
            for( let rr = 1; rr <= ROWS; rr++ )
            {
                for (let vv = 1; vv <= COLS; vv++ )
                {
                    // Build card type id
                    var card_type_id = this.getUniqueTypeForCard( rr, vv );

                    // on last row, only Locomotives, Cities, and Reservation cards
                    if (rr == ROWS) {
                        if (vv <= 9) {
                            this.trickLane.addItemType( card_type_id, 0, g_gamethemeurl+'img/cards_sprites.jpg', card_type_id );
                            // railways don't get exchange cards
                            if (vv < 9) {
                                // adding the Locomotive and City cards to railways
                                for (const ri of RR_INDEXES) {
                                    this.railWays[ri].addItemType( card_type_id, card_type_id, g_gamethemeurl+'img/cards_sprites.jpg', card_type_id );
                                }
                            }
                        }
                    } else {
                        if (vv == STATION) {
                            // add Station to each railway
                            this.railWays[rr-1].addItemType( card_type_id, card_type_id, g_gamethemeurl+'img/cards_sprites.jpg', card_type_id );
                        } else if (vv == EXCHANGE) {
                            // it's an Exchange card
                            this.trickLane.addItemType( card_type_id, 0, g_gamethemeurl+'img/cards_sprites.jpg', card_type_id );
                        } else {
                            this.playerHand.addItemType( card_type_id, card_type_id, g_gamethemeurl+'img/cards_sprites.jpg', card_type_id );
                            this.currentTrick.addItemType( card_type_id, card_type_id, g_gamethemeurl+'img/cards_sprites.jpg', card_type_id );
                            this.railWays[rr-1].addItemType( card_type_id, card_type_id, g_gamethemeurl+'img/cards_sprites.jpg', card_type_id );
                        }
                    }
                }
            }

            // Cards in player's hand
            for ( const i in this.gamedatas.hand ) {
                let card = this.gamedatas.hand[i];
                let rr = card.type;
                let value = card.type_arg;
                this.playerHand.addToStockWithId(this.getUniqueTypeForCard(rr, value), card.id);
            }

            // Cards played on table
            for ( const i in this.gamedatas.currenttrick) {
                let card = this.gamedatas.currenttrick[i];
                let rr = card.type;
                let value = card.type_arg;
                let player_id = card.location_arg;
                this.currentTrick.addToStockWithId(this.getUniqueTypeForCard(rr, value), card.id);
            }

            // the trick lane
            for (const i in this.gamedatas.tricklanecards) {
                let card = this.gamedatas.tricklanecards[i];
                let tt = card.type;
                let value = card.type_arg;
                this.trickLane.addToStockWithId(this.getUniqueTypeForCard(tt, value), card.id);
            }

            // cards in each railway Station for each railways
            for (const ri in RR_INDEXES) {
                for (const rw in RR_PREFIXES) {
                    let railwaycards = RR_PREFIXES[rw]+'_railway_cards';
                    console.log(rw + ' = ' + railwaycards);
                    for (const rr in this.gamedatas.railwaycards) {
                        let railwaycard = this.gamedatas.railwaycards[rr];
                        let tt = railwaycard.type;
                        let value = railwaycard.type_arg;
                        this.railWays[rw].addToStockWithId(this.getUniqueTypeForCard(tt, value), railwaycard.id);
                    }
                }
            }

            dojo.query('.stockitem').addClass("nice_card");

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
         * Gets a unique identifier for each card. Every card will have this exact number every game, all game.
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
        playToTrick : function(player_id, rr, value, card_id) {
            if (player_id != this.player_id) {
                // Some opponent played a card
                // Move card from player panel

            } else {
                // You played a card. If it exists in your hand, move card from there and remove
                // corresponding item

                if ($('myhand_item_' + card_id)) {
                    var card_type = this.getUniqueTypeForCard(rr,value);

                    this.currentTrick.addToStockWithId(card_type, card_id, 'myhand_item_'+card_id);
                    this.playerHand.removeFromStockById(card_id, 'currenttrick_item_'+card_id);
                }
            }

            // In any case: move it to its final destination
            // this.slideToObject('myhand_item_'+card_id, 'currenttrick').play();
            dojo.addClass('currenttrick_item_'+card_id, "nice_card");
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
                // type is (rr - 1) * 12 + (value - 1)
                var type = items[0].type;
                var rr = Math.floor(type / 12) + 1;
                var value = type % 12 + 1;
                    
                this.playToTrick(this.player_id, rr, value, card_id);

                this.playerHand.unselectAll();
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

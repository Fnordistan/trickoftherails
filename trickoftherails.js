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
const RAILROADS = ["B&O", "C&O", "Erie", "NYC", "PRR"];


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
            this.playerHand.image_items_per_row = COLS;
            // hitch adding railroad as a class to each hand
            this.playerHand.onItemCreate = dojo.hitch(this, this.setUpRRCard);

            // Now set up trick lane
            this.trickLane = new ebg.stock();
            this.trickLane.create(this, $('tricklane'), this.cardwidth, this.cardheight );
            this.trickLane.setSelectionMode(0);
            this.trickLane.image_items_per_row = COLS;

            // where cards are played for the current trick
            this.cardsPlayed = new ebg.stock();
            this.cardsPlayed.create(this, $('currenttrick'), this.cardwidth, this.cardheight );
            this.cardsPlayed.setSelectionMode(0);
            this.cardsPlayed.image_items_per_row = COLS;
            // hitch adding railroad as a class to each hand
            this.cardsPlayed.onItemCreate = dojo.hitch(this, this.setUpRRCard);

            // and create the Stock items for all five railways
            this.railWays = [];
            for (const rr of RR_PREFIXES)
            {
                var railway = new ebg.stock();
                railway.create(this, $(rr+'_railway'), this.cardwidth, this.cardheight );
                railway.setSelectionMode(0);
                railway.image_items_per_row = COLS;
                // for some reason they display vertically in rr_lane if this isn't set
                railway.autowidth = true;
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
                            this.railWays[rr-1].addItemType( card_type_id, 0, g_gamethemeurl+'img/cards_sprites.jpg', card_type_id );
                        } else if (vv == EXCHANGE) {
                            // it's an Exchange card
                            // We actually need to add THREE duplicates here because in a 3-player game, they will have different weights
                            this.trickLane.addItemType( card_type_id, 0, g_gamethemeurl+'img/cards_sprites.jpg', card_type_id );
                        } else {
                            this.playerHand.addItemType( card_type_id, card_type_id, g_gamethemeurl+'img/cards_sprites.jpg', card_type_id );
                            this.cardsPlayed.addItemType( card_type_id, 0, g_gamethemeurl+'img/cards_sprites.jpg', card_type_id );
                            this.railWays[rr-1].addItemType( card_type_id, 0, g_gamethemeurl+'img/cards_sprites.jpg', card_type_id );
                            // tricklanes can also hold RR cards
                            this.trickLane.addItemType( card_type_id, 0, g_gamethemeurl+'img/cards_sprites.jpg', card_type_id );
                        }
                    }
                }
            }

            // Cards in player's hand
            for ( const i in gamedatas.hand ) {
                let mycard = gamedatas.hand[i];
                let rr = mycard.type;
                let value = mycard.type_arg;
                this.playerHand.addToStockWithId(this.getUniqueTypeForCard(rr, value), mycard.id);
            }

            // Cards played on table
            for ( const i in gamedatas.currenttrick) {
                let tcard = gamedatas.currenttrick[i];
                let rr = tcard.type;
                let value = tcard.type_arg;
                let ctype = this.getUniqueTypeForCard(rr, value);
                this.cardsPlayed.item_type[ctype].weight = parseInt(tcard.location_arg);
                this.cardsPlayed.addToStockWithId(ctype, tcard.id);
            }

            // the trick lane
            debugger;
            for (const i in gamedatas.tricklanecards) {
                let tlcard = gamedatas.tricklanecards[i];
                let tt = tlcard.type;
                let value = tlcard.type_arg;
                let ctype = this.getUniqueTypeForCard(tt, value);
                this.trickLane.item_type[ctype].weight = parseInt(tlcard.location_arg);
                this.trickLane.addToStockWithId(ctype, tlcard.id);
            }

            let rw = 0;
            for (railwaycards of [gamedatas.b_and_o_railway_cards, gamedatas.c_and_o_railway_cards, gamedatas.erie_railway_cards, gamedatas.nyc_railway_cards, gamedatas.prr_railway_cards]) {
                for (const i in railwaycards) {
                    let railwaycard = railwaycards[i];
                    let tt = railwaycard.type;
                    let value = railwaycard.type_arg;
                    let ctype = this.getUniqueTypeForCard(tt, value);
                    this.railWays[rw].item_type[ctype].weight = parseInt(railwaycard.location_arg);
                    this.railWays[rw].addToStockWithId(ctype, railwaycard.id);
                }
                rw++;
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
         * 
         * @param int $rr 
         * @param int $v
         * @returns int card_id
         */
        getUniqueTypeForCard: function(rr, v)
        {
            return ((rr-1)*12)+(v-1);
        },

        /**
         * Reverse of above function. Gets the Type/Arg from the card id.
         * 
         * @param {*} card_id 
         * @returns two-member array, type and type_arg (rr/value)
         */
        getTypeAndValue: function(card_id) {
            return [Math.floor(card_id/12)+1, (card_id % 12) +1];
        },


        /**
         * Someone played a trick card.
         * @param {*} player_id 
         * @param {*} card_id 
         * @param {*} rr number indicating rr type (row)
         * @param {*} card_value 
         */
        playTrickCard: function(player_id, card_id, rr, card_value ) {
            var card_type = this.getUniqueTypeForCard(rr, card_value);
            // have to explicitly set weight while sliding into place or it goes into wrong order before refresh from Db
            this.cardsPlayed.item_type[card_type].weight = this.cardsPlayed.count();

            if( player_id != this.player_id )
            {
                // Some opponent played a card
                this.cardsPlayed.addToStockWithId(card_type, card_id, 'player_board_'+player_id);
                // // highlight all my cards of that color
                // dojo.query('#myhand .'+RAILROADS[rr-1]).style('opacity', 0.5);
            }
            else
            {
                // You played a card. If it exists in your hand, move card from there and remove
                // corresponding item
                if ($('myhand_item_' + card_id)) {
                    this.cardsPlayed.addToStockWithId(card_type, card_id, 'myhand_item_'+card_id);
                    this.playerHand.removeFromStockById(card_id, 'currenttrick_item_'+card_id);
                }
            }

            dojo.addClass('currenttrick_item_'+card_id, "nice_card");
        },

        /**
         * Someone won a trick.
         */
        winTrick: function(player_id) {

        },

        /**
         * Each card invokes this when added to a player hand or the RR.
         * Adds tooltips and a class equal to the name of the RR.
         * @param {*} card_div 
         * @param {*} card_id 
         * @param {*} myhand_item 
         */
        setUpRRCard: function(card_div, card_id, myhand_item) {
               // Add a special tooltip on the card:
               [$type, $type_arg] = this.getTypeAndValue(card_id);
               this.addTooltip( card_div.id, _(RAILROADS[$type-1] + " - " + $type_arg), '');
                // add RR name to every class
               dojo.addClass( card_div, RAILROADS[$type-1]);
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
                console.log("selected card "+card_id);

                this.ajaxcall( "/trickoftherails/trickoftherails/playCard.html", { 
                    id: card_id,
                    lock: true 
                    }, this, function( result ) {  }, function( is_error) { } );                        

                this.playerHand.unselectAll();
            } else {
                this.playerHand.unselectAll();
            }
        }
    },


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
            dojo.subscribe('playCard', this, "notif_playCard");
            dojo.subscribe('winTrick', this, "notif_winTrick");
        },  
        
        /**
         * When someone plays to a trick
         * @param {*} notif 
         */
        notif_playCard : function(notif) {
            // Play a trick on the table
            this.playTrickCard(notif.args.player_id, notif.args.card_id, notif.args.rr, notif.args.card_value);
        },

        /**
         * Someone won a trick.
         * @param {*} notif 
         */
        notif_winTrick : function(notif) {
            this.winTrick(notif.args.player_id);
        },
   });             
});

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
const RR_COLORS = ['#004D7A', '#80933F', '#EDB630', '#B8B7AE', '#9A1D20'];
const RAILROADS = ["B&O", "C&O", "Erie", "NYC", "PRR"];

const RESERVATION = 9;
const EXCHANGE = 11;
const STATION = 12;

// this is kind of a hack - we know this specific
// card type is the Reservation card (row 6, position 9)
const RESERVATION_CARD_TYPE = 68;

const CARD_SPRITES = 'img/cards_sprites.jpg';

define([
    "dojo","dojo/_base/declare","dojo/dom", "dojo/on",
    "ebg/core/gamegui",
    "ebg/counter",
    "ebg/stock"
],
function (dojo, declare) {
    return declare("bgagame.trickoftherails", ebg.core.gamegui, {
        constructor: function(){
            // Here, you can init the global variables of your user interface
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

            // this will be an array of arrays by player_id => array of rr share piles
            this.sharePiles = [];
            // Setting up player boards
            for( const player_id in gamedatas.players )
            {
                var player = gamedatas.players[player_id];
                this.sharePiles[player_id] = [];
            }

            // where cards are played for the current trick
            // must come before player hand!
            this.cardsPlayed = new ebg.stock();
            this.cardsPlayed.create(this, $('currenttrick'), this.cardwidth, this.cardheight );
            this.cardsPlayed.setSelectionMode(0);
            this.cardsPlayed.extraClasses='nice_card';
            this.cardsPlayed.image_items_per_row = COLS;
            // this.cardsPlayed.item_margin = 15;
            // hitch adding railroad as a class to each hand
            this.cardsPlayed.onItemCreate = dojo.hitch(this, this.setUpRRCard);

            
            // Player hand
            this.playerHand = new ebg.stock();
            this.playerHand.create( this, $('myhand'), this.cardwidth, this.cardheight );
            this.playerHand.image_items_per_row = COLS;
            this.playerHand.extraClasses='nice_card';
            // hitch adding railroad as a class to each hand
            this.playerHand.onItemCreate = dojo.hitch(this, this.setUpRRCard);
            this.updateHand(this.isCurrentPlayerActive() && this.checkAction('playCard', true));

            // Now set up trick lane
            this.trickLane = new ebg.stock();
            this.trickLane.create(this, $('tricklane'), this.cardwidth, this.cardheight );
            this.trickLane.setSelectionMode(0);
            this.trickLane.image_items_per_row = COLS;
            this.trickLane.extraClasses='nice_card';
            this.trickLane.onItemCreate = dojo.hitch(this, this.setUpTrickLaneCard);

            // create the Stock items for all five railways
            this.railWays = [];
            // this will be an array by rr_shares => player
            for (const rr of RR_PREFIXES)
            {
                var railway = new ebg.stock();
                railway.create(this, $(rr+'_railway'), this.cardwidth, this.cardheight );
                railway.setSelectionMode(0);
                railway.image_items_per_row = COLS;
                railway.extraClasses='nice_card';
                railway.onItemCreate = dojo.hitch(this, this.setUpRRCard);
                // for some reason they display vertically in rr_lane if this isn't set
                railway.autowidth = true;
                this.railWays.push(railway);

                // create Stock items for each share pile
                var rr_shares = rr+"_shares";
                // Setting up player shares
                for( const player_id in gamedatas.players ) {
                    var shares = new ebg.stock();
                    var share_id = player_id+'_'+rr_shares;
                    shares.create(this, $(share_id), this.cardwidth, this.cardheight );
                    shares.setSelectionMode(0);
                    shares.image_items_per_row = COLS;
                    shares.autowidth = true;
                    shares.extraClasses='nice_card';
                    shares.setOverlap( 25, 0 );
                    shares.onItemCreate = dojo.hitch(this, this.setUpRRCard);
                    this.sharePiles[player_id].push(shares);
                }
            }

            // Create card types
            for( var rr = 1; rr <= ROWS; rr++ )
            {
                for (var vv = 1; vv <= COLS; vv++ )
                {
                    // Build card type id
                    // we can use 0 value for card id here, it only really matters
                    // later for specific Reservation cards
                    var card_type_id = this.getUniqueTypeForCard(rr, vv );

                    // on last row, only Locomotives, Cities, and Reservation cards
                    if (rr == ROWS) {
                        if (vv <= 9) {
                            this.trickLane.addItemType( card_type_id, 0, g_gamethemeurl+CARD_SPRITES, card_type_id );
                            if (vv == RESERVATION) {
                                // we need to handle special case of Reservation cards
                                // We create three cards with different item types but the same image position
                                // we can just increment up because we know Reservation card is the LAST id
                                // (need to change this if we start using card back)
                                for (var rv = 0; rv < 3; rv++) {
                                    this.trickLane.addItemType( card_type_id+rv, 0, g_gamethemeurl+CARD_SPRITES, card_type_id );
                                }
                            }else {
                                // adding the Locomotive and City cards to railways
                                for (const ri of RR_INDEXES) {
                                    this.railWays[ri].addItemType( card_type_id, card_type_id, g_gamethemeurl+CARD_SPRITES, card_type_id );
                                }
                            }
                        }
                    } else {
                        if (vv == STATION) {
                            // add Station to each railway
                            this.railWays[rr-1].addItemType( card_type_id, 0, g_gamethemeurl+CARD_SPRITES, card_type_id );
                        } else if (vv == EXCHANGE) {
                            // it's an Exchange card
                            this.trickLane.addItemType( card_type_id, 0, g_gamethemeurl+CARD_SPRITES, card_type_id );
                            this.populateSharePiles(card_type_id, g_gamethemeurl+CARD_SPRITES);
                        } else {
                            this.playerHand.addItemType( card_type_id, card_type_id, g_gamethemeurl+CARD_SPRITES, card_type_id );
                            this.cardsPlayed.addItemType( card_type_id, 0, g_gamethemeurl+CARD_SPRITES, card_type_id );
                            this.railWays[rr-1].addItemType( card_type_id, 0, g_gamethemeurl+CARD_SPRITES, card_type_id );
                            this.populateSharePiles(card_type_id, g_gamethemeurl+CARD_SPRITES);
                            // tricklanes can also hold RR cards
                            this.trickLane.addItemType( card_type_id, 0, g_gamethemeurl+CARD_SPRITES, card_type_id );
                        }
                    }
                }
            }

            // Cards in player's hand
            for ( const h in gamedatas.hand ) {
                var mycard = gamedatas.hand[h];
                var rr = mycard.type;
                var value = mycard.type_arg;
                this.playerHand.addToStockWithId(this.getUniqueTypeForCard(rr, value), mycard.id);
            }

            // everyone's stock shares
            for (const s in gamedatas.shares) {
                var sharecard = gamedatas.shares[s];
                var owner = sharecard.location_arg;
                var rr = sharecard.type;
                var val = sharecard.type_arg;
                var ctype = this.getUniqueTypeForCard(rr, val);
                this.sharePiles[owner][rr-1].addToStockWithId(ctype, sharecard.id);
            }

            // Cards played on table
            for ( const i in gamedatas.currenttrick) {
                var tcard = gamedatas.currenttrick[i];
                var rr = tcard.type;
                var value = tcard.type_arg;
                var ctype = this.getUniqueTypeForCard(rr, value);
                this.cardsPlayed.item_type[ctype].weight = parseInt(tcard.location_arg);
                this.cardsPlayed.addToStockWithId(ctype, tcard.id);
            }

            // the trick lane
            // Special counter for Reservation cards
            var rsv = 0;
            for (const i in gamedatas.tricklanecards) {
                var tlcard = gamedatas.tricklanecards[i];
                var tt = tlcard.type;
                var value = tlcard.type_arg;
                var ctype = this.getUniqueTypeForCard(tt, value);
                if (ctype == RESERVATION_CARD_TYPE) {
                    ctype += rsv++;
                }
                this.trickLane.item_type[ctype].weight = parseInt(tlcard.location_arg);
                this.trickLane.addToStockWithId(ctype, tlcard.id);
            }

            // the railway lines
            var rw = 0;
            for (railwaycards of [gamedatas.b_and_o_railway_cards, gamedatas.c_and_o_railway_cards, gamedatas.erie_railway_cards, gamedatas.nyc_railway_cards, gamedatas.prr_railway_cards]) {
                for (const i in railwaycards) {
                    var railwaycard = railwaycards[i];
                    var tt = railwaycard.type;
                    var value = railwaycard.type_arg;
                    if (railwaycard.location_arg == 0) {
                        // Locomotives go to the loco slot
                        this.placeLocomotiveCard(parseInt(value), parseInt(rw)+1);
                    } else {
                        var ctype = this.getUniqueTypeForCard(tt, value);
                        this.railWays[rw].item_type[ctype].weight = parseInt(railwaycard.location_arg);
                        this.railWays[rw].addToStockWithId(ctype, railwaycard.id);
                    }
                }
                rw++;
            }

            // dojo.query('.stockitem').addClass("nice_card");

            dojo.connect( this.playerHand, 'onChangeSelection', this, 'onPlayerHandSelectionChanged' );

            for (loconode of dojo.query('.locomotive_slot')) {
                var handle = dojo.connect(loconode, 'onclick', this, 'onLocomotiveSelected');
            }

            for (endnode of dojo.query('.railway_endpoint')) {
                dojo.connect(endnode, 'onclick', this, 'onEndpointSelected');
            }

            dojo.connect(dojo.byId('shares_button'), 'onclick', this, 'onShowShares');

            // Setup game notifications to handle (see "setupNotifications" method below)
            this.setupNotifications();
        },

        ///////////////////////////////////////////////////
        //// Game & client states
        
        // onEnteringState: this method is called each time we are entering into a new game state.
        //                  You can use this method to perform some user interface changes at this moment.
        //
        onEnteringState: function( stateName, args )
        {
            switch( stateName )
            {
            
                case 'playerTurn':
                    this.updateHand(this.isCurrentPlayerActive());
                break;

                case 'dummmy':
                break;
            }
        },

        // onLeavingState: this method is called each time we are leaving a game state.
        //                 You can use this method to perform some user interface changes at this moment.
        //
        onLeavingState: function( stateName )
        {
            switch( stateName )
            {
            
            case 'playerTurn':
                this.updateHand(false);
                break;
           
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
                      
            // if( this.isCurrentPlayerActive() )
            // {            
            //     switch( stateName )
            //     {
            //      case 'playerTurn':
            //          this.updateHand(true);
                    
            //         // // Add 3 action buttons in the action status bar:
            //         // this.addActionButton( 'button_1_id', _('Button 1 label'), 'onMyMethodToCall1' ); 
            //         // this.addActionButton( 'button_2_id', _('Button 2 label'), 'onMyMethodToCall2' ); 
            //         // this.addActionButton( 'button_3_id', _('Button 3 label'), 'onMyMethodToCall3' ); 
            //         break;
            //     }
            // }
        },        

        ///////////////////////////////////////////////////
        //// Utility methods

        /**
         * Gets a unique identifier for each card. Every card will have this exact number every game, all game.
         * 
         * @param int $rr 
         * @param int $v
         * @returns int card_type
         */
        getUniqueTypeForCard: function(rr, v)
        {
            return ((rr-1)*12) + (v-1);
        },

        /**
         * Reverse of above function. Gets the Type/Arg from the card id.
         * 
         * @param {*} card_type 
         * @returns two-member array, type and type_arg (rr/value)
         */
        getTypeAndValue: function(card_type) {
            if (card_type >= RESERVATION_CARD_TYPE) {
                return [ROWS, RESERVATION];
            }
            return [Math.floor(card_type/12)+1, (card_type % 12) +1];
        },

        /**
         * Each card invokes this when added to a player hand or the RR.
         * Adds tooltips and a class equal to the name of the RR.
         * @param {*} card_div 
         * @param {*} card_type
         * @param {*} myhand_item 
         */
        setUpRRCard: function(card_div, card_type, myhand_item) {
               // Add a special tooltip on the card:
               var [type, type_arg] = this.getTypeAndValue(card_type);
               var tooltip;
               if (type_arg == STATION) {
                   tooltip = RAILROADS[type-1]+ " Station";
               } else {
                   tooltip = RAILROADS[type-1] + " (" + type_arg + ")";
               }
               this.addTooltip( card_div.id, _(tooltip), '');
                // add RR name to every class
               dojo.addClass( card_div, RAILROADS[type-1]);
        },

        /**
         * For tooltips for Locomotive cards
         * @param {*} type_arg 
         */
        getLocomotiveLabel: function(type_arg) {
            var label;
            switch (type_arg) {
                case 1:
                    label = "Locomotive [3]";
                    break;
                case 2:
                    label = "Locomotive [4]";
                    break;
                case 3:
                    label = "Locomotive [5]";
                    break;
                case 4:
                    label = "Locomotive [6]";
                    break;
                case 5:
                    label = "Locomotive [∞]";
                    break;
                default:
                    throw new Error("Unexpected Locomotive value: "+type_arg);
            }
            return label;
        },

        /**
         * Add StockItem to all share piles
         * @param {*} card_type_id
         * @param {*} sprite_url
         */
        populateSharePiles: function(card_type_id, sprite_url) {
            for( const player_id in this.gamedatas.players ) {
                for (const ri of RR_INDEXES) {
                    this.sharePiles[player_id][ri].addItemType( card_type_id, card_type_id, sprite_url, card_type_id );
                }
            }
        },

        /**
         * Add tooltip for the TrickLane cards
         * @param {*} card_div 
         * @param {*} card_id 
         * @param {*} myhand_item 
         */
        setUpTrickLaneCard: function(card_div, card_id, myhand_item) {
                // Add a special tooltip on the card:
                var [type, type_arg] = this.getTypeAndValue(card_id);
                // may be Exchange, Locomotive, City, or Reservation cards
                var tooltip;
                var is_rr = false;
                if (type == ROWS) {
                    switch (type_arg) {
                        case 1:
                        case 2:
                        case 3:
                        case 4:
                        case 5:
                            tooltip = this.getLocomotiveLabel(type_arg);
                            break;
                        case 6:
                            tooltip = "City (Pittsburgh)";
                            break;
                        case 7:
                            tooltip = "City (Baltimore)";
                            break;
                        case 8:
                            tooltip = "City (New York)";
                            break;
                        case 9:
                            tooltip = "Reservation Card";
                            break;
                        default:
                            throw new Error("Unexpected Trick Lane Card: type="+type+", type_arg="+type_arg+")");
                    }
                } else if (type_arg == EXCHANGE) {
                    tooltip = RAILROADS[type-1]+ " Exchange Card";
                } else {
                    // This is a RR card added to Trick Lane
                    this.setUpRRCard(card_div, card_id, myhand_item);
                    is_rr = true;
                }
                if (!is_rr) {
                    this.addTooltip( card_div.id, _(tooltip), '');
                }
        },

        /**
         * Put a Locomotive card in its railway.
         * @param {*} loc index of locomotive (type_arg)
         * @param {*} rr index of railway
         */
        placeLocomotiveCard: function(loc, rr) {
            // the id of the locomotive slot
            var loconode = RR_PREFIXES[rr-1]+'_locomotive';
            var x = -1 * (loc-1) * this.cardwidth;
            var y = -5 * this.cardheight;

            dojo.style(loconode, {
                "width": this.cardwidth + "px",
                "height": this.cardheight+"px",
                "background": "url("+g_gamethemeurl+CARD_SPRITES+") "+x+"px "+y +"px",
                "z-index": 1,
            });
            dojo.addClass( loconode, RAILROADS[rr-1]+ " nice_card");
            dojo.removeClass(loconode, "locomotive_slot");
            var tooltip = this.getLocomotiveLabel(loc);
            this.addTooltip( loconode, _(tooltip), '');
        },

        /**
         * Update the cards in this player's hand - assumes we have already determined if this is current player
         */
        updateHand: function(is_current_player) {
            if (is_current_player) {
                this.playerHand.setSelectionMode(1);

                if (this.cardsPlayed.count() != 0) {
                    var leadcard = this.cardsPlayed.items[0];
                    var [rr,val] = this.getTypeAndValue(leadcard.type);

                    var has_trick_color = false;
                    for (const c of this.playerHand.getAllItems()) {
                        var cid = c.id;
                        var ctype = c.type;
                        var [crr,cval] = this.getTypeAndValue(ctype);
                        var cdiv = this.playerHand.getItemDivId(cid);
                        if (crr == rr) {
                            has_trick_color = true;
                            dojo.addClass(cdiv, "trick_color");
                            dojo.removeClass(cdiv, "noselect");
                        } else {
                            dojo.addClass(cdiv, "noselect");
                            dojo.removeClass(cdiv, "trick_color");
                        }
                    }
                    // if we don't have any of the right color,
                    // we have to go back and remove the noselect
                    if (!has_trick_color) {
                        for (const c2 of this.playerHand.getAllItems()) {
                            var cdiv2 = this.playerHand.getItemDivId(c2.id);
                            dojo.addClass(cdiv2, "trick_color");
                            dojo.removeClass(cdiv2, "noselect");
                        }
                    }
                }
            } else {
                // cleanup any previous selection chrome
                for (const c of this.playerHand.getAllItems()) {
                    var cdiv = this.playerHand.getItemDivId(c.id);
                    dojo.removeClass(cdiv, "trick_color");
                    dojo.removeClass(cdiv, "noselect");
                }

                this.playerHand.setSelectionMode(0);
            }
            this.styleCardsPlayed();
        },

        /**
         * Gets the first card in cardsplayed and styles it
         */
        styleCardsPlayed: function() {
            var playct = this.cardsPlayed.count();
            // now style the lead card
            for (var i = 0; i < playct; i++) {
                var card = this.cardsPlayed.items[i];
                var card_div = this.cardsPlayed.getItemDivId(card.id);
                if (i == 0) {
                    var [rr,val] = this.getTypeAndValue(card.type);
                    dojo.style(card_div, {"border": "2px solid white", "box-shadow": "0px 0px 5px 5px "+RR_COLORS[rr-1]});
                } else {
                    dojo.addClass(card_div, "card_played_1");
                }

            }
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

        /**
         * When player clicks a Locomotive slot.
         * @param {*} event
         */
        onLocomotiveSelected : function(event) {
            if (this.checkAction('placeLocomotive', true)) {

                var loc_id = event.target.id;
                // find index
                var li = 1;
                for (var rrname of RR_PREFIXES) {
                    if (loc_id.startsWith(rrname)) {
                        break;
                    } else {
                        li++;
                    }
                }

                this.ajaxcall( "/trickoftherails/trickoftherails/placeLocomotive.html", { 
                    rr: li,
                    lock: true 
                    }, this, function( result ) {  }, function( is_error) { } );                        
            }
        },

        /**
         * When player clicks a start or endpoint on railway.
         * @param {*} event 
         */
        onEndpointSelected : function(event) {
            var endpoint_id = event.target.id;
            var ix = endpoint_id.lastIndexOf('_');
            var is_start = endpoint_id.endsWith("start");
            var railway = endpoint_id.substring(0, ix);

            if (this.checkAction('addRailwayCard', true)) {
                this.ajaxcall( "/trickoftherails/trickoftherails/addRailwayCard.html", { 
                    bStart: is_start,
                    lock: true 
                    }, this, function( result ) {  }, function( is_error) { } );
            } else if (this.checkAction('placeCity', true)) {
                this.ajaxcall( "/trickoftherails/trickoftherails/placeCity.html", { 
                    sRR: railway,
                    bStart: is_start,
                    lock: true 
                    }, this, function( result ) {  }, function( is_error) { } );
            }
        },

        /**
         * When show shares button is clicked
         * @param {*} event 
         */
        onShowShares : function(event) {
            var sharedisplay = dojo.getStyle("shares_wrapper", "display");
            // toggle display
            sharedisplay = (sharedisplay == 'none') ? 'block' : 'none';
            var button_text = (sharedisplay == 'none') ? "Show Player Shares" : "Hide Player Shares";
            dojo.setStyle(dojo.byId('shares_wrapper'), 'display', sharedisplay);
            $('shares_button').innerHTML = _(button_text);
        },


        ///////////////////////////////////////////////////
        //// Client-side reactions to notifications.

        /*
            setupNotifications:
            
            In this method, you associate each of your game notifications with your local method to handle it.
            
            Note: game notification names correspond to "notifyAllPlayers" and "notifyPlayer" calls in
                  your trickoftherails.game.php file.
        
        */
        setupNotifications: function()
        {
            dojo.subscribe('cardPlayed', this, "notif_cardPlayed");
            dojo.subscribe('discardedShare', this, "notif_discardedShare");
            dojo.subscribe('reservationSwapped', this, "notif_reservationSwapped");
            dojo.subscribe('shareAdded', this, "notif_shareAdded");
            dojo.subscribe('locomotivePlaced', this, "notif_locomotivePlaced");
            dojo.subscribe('railwayCardAdded', this, "notif_railwayCardAdded");
            dojo.subscribe('cityAdded', this, "notif_cityAdded");
        },  
        
        /**
         * Someone played a trick card.
         * @param {*} notif 
         */
        notif_cardPlayed : function(notif) {
            // Play a trick on the table
            var card_id = notif.args.card_id;
            var card_type = this.getUniqueTypeForCard(notif.args.rr, notif.args.card_value);
            // have to explicitly set weight while sliding into place or it goes into wrong order before refresh from Db
            this.cardsPlayed.item_type[card_type].weight = this.cardsPlayed.count();

            if( notif.args.player_id != this.player_id )
            {
                // Some opponent played a card
                this.cardsPlayed.addToStockWithId(card_type, card_id, 'player_board_'+notif.args.player_id);
            }
            else
            {
                // You played a card. If it exists in your hand, move card from there and remove
                // corresponding item
                if ($('myhand_item_' + card_id)) {
                    this.cardsPlayed.addToStockWithId(card_type, card_id, 'myhand_item_'+card_id);
                    this.playerHand.removeFromStockById(card_id, 'currenttrick_item_'+card_id);
                }
                // now disable my hand again
                this.updateHand(false);
            }
        },

        /**
         * Card swapped for Reservation card in Trick Lane.
         * @param {*} notif 
         */
        notif_reservationSwapped : function(notif) {
            var card_id = notif.args.card_id;
            var card_type = this.getUniqueTypeForCard(notif.args.rr, notif.args.card_value);

            // where the trick came from
            var trick_div = this.trickLane.getItemDivId(card_id);
            // where the Reservation card came from
            var reserve_div = this.trickLane.getItemDivId(notif.args.reservation_id);
            // remove the Reservation card
            this.trickLane.removeFromStockById(notif.args.reservation_id);
            // set the weight to that of the replaced Reservation card
            this.trickLane.item_type[card_type].weight = parseInt(notif.args.reservation_loc);
            // move the (winning) trick card from the play area to the Trick Lane
            this.trickLane.addToStockWithId(card_type, card_id, trick_div);
            this.cardsPlayed.removeFromStockById(card_id, reserve_div);
        },

        /**
         * A share was discarded by the winner.
         * @param {*} notif 
         */
        notif_discardedShare : function(notif) {
            this.cardsPlayed.removeFromStockById(notif.args.card_id);
        },

        /**
         * A share was added.
         * @param {*} notif 
         */
        notif_shareAdded : function(notif) {
            var player_id = notif.args.player_id;
            var card_id = parseInt(notif.args.card_id);
            var rr = parseInt(notif.args.rr);
            var val = parseInt(notif.args.card_value);
            var card_type = this.getUniqueTypeForCard(rr, val);
            // it was either in the cards played area, or won from the Trick Lane.
            if (this.cardsPlayed.getItemById(card_id) != null) {
                var card_div = this.cardsPlayed.getItemDivId(card_id);
                this.sharePiles[player_id][rr-1].addToStockWithId(card_type, card_id, card_div);
                var to_div = this.sharePiles[player_id][rr-1].getItemDivId(card_id);
                this.cardsPlayed.removeFromStockById(card_id, to_div);
            } else {
                var card_div = this.trickLane.getItemDivId(card_id);
                this.sharePiles[player_id][rr-1].addToStockWithId(card_type, card_id, card_div);
                var to_div = this.sharePiles[player_id][rr-1].getItemDivId(card_id);
                this.trickLane.removeFromStockById(card_id, to_div);
            }
        },

        /**
         * A Locomotive was placed.
         * @param {*} notif 
         */
        notif_locomotivePlaced : function(notif) {
            var card_id = parseInt(notif.args.card_id);
            // remove locomotive from Trick Lane, move to Railroad
            this.trickLane.removeFromStockById(card_id);
            this.placeLocomotiveCard(parseInt(notif.args.loc_num), parseInt(notif.args.railroad));
        },

        /**
         * Card was moved from trick area to railway line.
         * @param {*} notif 
         */
        notif_railwayCardAdded : function(notif) {
            var card_id = parseInt(notif.args.card_id);
            var rr = parseInt(notif.args.rr);
            var v = parseInt(notif.args.value);
            this.cardsPlayed.removeFromStockById(card_id);
            var card_type = this.getUniqueTypeForCard(rr, v);
            var card_div = this.cardsPlayed.getItemDivId(card_id);

            // have to explicitly set weight while sliding into place or it goes into wrong order before refresh from Db
            // We add increasingly negative weights when inserted in front, because otherwise 0 wts get unordered
            var wt = (notif.args.endpoint == "start") ? (-1*this.railWays[rr-1].count()) : this.railWays[rr-1].count();
            this.railWays[rr-1].item_type[card_type].weight = wt;

            this.railWays[rr-1].addToStockWithId(card_type, card_id, card_div);
        },

        /**
         * A City card was added to a railway line.
         * @param {*} notif 
         */
        notif_cityAdded : function(notif) {
            var card_id = parseInt(notif.args.card_id);
            var type_arg = parseInt(notif.args.city_type);
            var card_type = this.getUniqueTypeForCard(ROWS, type_arg);

            var railway = notif.args.railway;
            var rr = parseInt(notif.args.rr);
            var trick_div = this.trickLane.getItemDivId(card_id);

            // remove City from Trick Lane
            this.trickLane.removeFromStockById(card_id);
            // move it to the chosen Railroad lane
            // have to explicitly set weight while sliding into place or it goes into wrong order before refresh from Db
            // We add increasingly negative weights when inserted in front, because otherwise 0 wts get unordered
            var wt = (notif.args.endpoint == "start") ? (-1*this.railWays[rr-1].count()) : this.railWays[rr-1].count();
            this.railWays[rr-1].item_type[card_type].weight = wt;

            this.railWays[rr-1].addToStockWithId(card_type, card_id, trick_div);
        },

    });             
});


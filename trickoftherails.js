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

const ROWS = 6;
const COLS = 12;
const RR_PREFIXES = ["b_and_o", "c_and_o", "erie", "nyc", "prr"];
const RR_COLORS = ['#004D7A', '#80933F', '#EDB630', '#B8B7AE', '#9A1D20'];
const RAILROADS = ["B&O", "C&O", "Erie", "NYC", "PRR"];
const RAILHOUSE_H = 112.5;
const RAILHOUSE_W = 112.5;

/**
 * Enum for Railhouse icons.
 */
const RAILHOUSE_BUTTON = {
    /** It can be clicked */
    READY : 'ready',
    /** It's eligible to be clicked, and is being mouseovered */
    ACTIVE: 'active',
    /** It's not eligible to be clicked */
    DEFAULT: 'default',
    /** It has been clicked */
    CLICKED: 'clicked'
}

const RESERVATION = 9;
const EXCHANGE = 11;
const STATION = 12;
// this is kind of a hack - we know this specific
// card type is the Reservation card (row 6, position 9)
const RESERVATION_CARD_TYPE = 68;
// identifies the ∞ Locomotive (row 6, position 5)
const LOCOMOTIVE_UNLIMITED_TYPE = 64

const CARD_SPRITES = 'img/cards_sprites.jpg';

const DISCARD = 'discarded_shares';

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

        setup: function( gamedatas ) {
            dojo.destroy('debug_output');
            // this will be an array of arrays by player_id => array of rr share piles
            this.sharePiles = [];
            // array of arrays by player_id => array of RR counters
            this.shareCounters = [];
            // Setting up player boards
            for( const player_id in gamedatas.players )
            {
                var player = gamedatas.players[player_id];
     
                // Setting up player board
                var player_board_div = $('player_board_'+player_id);
                // create RR counters
                this.shareCounters[player_id] = [];
                for (const rri in RR_PREFIXES) {
                    var rr = RR_PREFIXES[rri];

                    dojo.place( this.format_block(' jstpl_rr_counter_block', {
                        "rr": rr,
                        "id": player_id
                    }), player_board_div);

                    var rr_counter = new ebg.counter();
                    rr_counter.create(rr+'_shares_counter_'+player_id);
                    this.shareCounters[player_id].push(rr_counter);
                    this.addTooltip(rr+'_counter_icon_'+player_id, dojo.string.substitute(_("${rr} Shares"), {rr: RAILROADS[rri]}), '');
                }

                // create share piles for each player
                this.sharePiles[player_id] = [];
                // color the labels
                var color = '#'+gamedatas.players[player_id].color;
                dojo.style($(player_id+'_share_label'), 'color', color);
            }
            this.sharePiles[DISCARD] = [];

            // where cards are played for the current trick
            // must come before player hand!
            this.cardsPlayed = new ebg.stock();
            this.cardsPlayed.create(this, $('cardsplayed'), this.cardwidth, this.cardheight );
            this.cardsPlayed.setSelectionMode(0);
            this.cardsPlayed.extraClasses='totr_nice_card';
            this.cardsPlayed.image_items_per_row = COLS;
            // this.cardsPlayed.item_margin = 15;
            // hitch adding railroad as a class to each hand
            this.cardsPlayed.onItemCreate = dojo.hitch(this, this.setUpCard);

            // Player hand
            if (!this.isSpectator) {
                this.playerHand = new ebg.stock();
                this.playerHand.create( this, $('myhand'), this.cardwidth, this.cardheight );
                this.playerHand.image_items_per_row = COLS;
                this.playerHand.extraClasses='totr_nice_card';
                this.playerHand.item_margin = 7;
                // this keeps selected but unselectable cards from changing
                this.playerHand.setSelectionAppearance('class');
                // hitch adding railroad as a class to each hand
                this.playerHand.onItemCreate = dojo.hitch(this, this.setUpCard);
                // setup card selection action
                dojo.connect( this.playerHand, 'onChangeSelection', this, 'onPlayerHandSelectionChanged' );
            } else {
                // Hide player hand area for spectators
                dojo.style('myhand_wrap', 'display', 'none');
            }

            // Now set up trick lane
            this.trickLane = new ebg.stock();
            this.trickLane.create(this, $('tricklane'), this.cardwidth, this.cardheight );
            this.trickLane.setSelectionMode(0);
            this.trickLane.image_items_per_row = COLS;
            this.trickLane.item_margin = 7;
            this.trickLane.extraClasses='totr_nice_card';
            this.trickLane.onItemCreate = dojo.hitch(this, this.setUpCard);

            // create the Stock items for all five railways
            this.railWays = [];
            // this will be an array by rr_shares => player
            for (const rr of RR_PREFIXES) {
                var railroad = this.createRailroadStock(rr);
                this.railWays.push(railroad);

                // create Stock items for each share pile
                var rr_shares = rr+"_shares";
                // Setting up player shares
                for( const player_id in gamedatas.players ) {
                    var shares = this.createPlayerSharesStock(player_id, rr_shares);
                    this.sharePiles[player_id].push(shares);
                }
                var discarded_shares = this.createPlayerSharesStock(DISCARD, rr_shares)
                this.sharePiles[DISCARD].push(discarded_shares);
            }

            // create all the Stock items
            this.setupAllCards();

            // now actually fetch game data and populate all the stock items
            this.populatePlayerHand();
            this.populateSharePiles();
            this.populateCardsPlayed();
            this.populateTrickLane();
            this.populateRailways();

            this.setupLocomotiveActions();
            this.setupRailhouseActions();
            this.setupHelpButtons();

            // Setup game notifications to handle (see "setupNotifications" method below)
            this.setupNotifications();
        },

        ///////////////////////////////////////////////////
        /// Setup functions
        //
        //


       /** Inject html into log items  */

        /* @Override */
        format_string_recursive : function(log, args) {
            try {
                if (log && args && !args.processed) {
                    args.processed = true;
                    
                    var rri = (args.rr) ? toint(args.rr)-1 : 0;
                    if (args.card_value_label) {
                        args.card_value_label = this.format_block('jstpl_card_value_label', {
                            "card_value_label": args.card_value_label,
                            "rr_color": RR_COLORS[rri]
                        });
                        // hack because we had to insert ${card_value}
                        log = log.replace('${card_value}', '');
                    }
                    if (args.company) {
                        args.company = this.format_block('jstpl_rr_name', {
                            "company": args.company,
                            "rr_color": RR_COLORS[rri]
                        }) + this.format_block('jstpl_rr_icon', {
                            "rr": RR_PREFIXES[rri]
                        });
                        // hack because we had to insert ${rr}
                        log = log.replace('${rr}', '');
                    }
                    if (args.locomotive) {
                        let re = /\[(.+)\]/;
                        var loc_str = args.locomotive;
                        loc_str = loc_str.replace(re, "<span class=\"totr_locomotive_value\">$1</span>");
                        args.locomotive = loc_str;
                    }
                }
            } catch (e) {
                console.error(log, args, "Exception thrown", e.stack);
            }
            return this.inherited(arguments);
        },

        /**
         * This creates all the cards that will populate our Stocks.
         */
        setupAllCards: function() {
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
                                for (var ri = 0; ri < 5; ri++) {
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
                            this.setupSharePiles(card_type_id, g_gamethemeurl+CARD_SPRITES);
                        } else {
                            if (!this.isSpectator) {
                                this.playerHand.addItemType( card_type_id, card_type_id, g_gamethemeurl+CARD_SPRITES, card_type_id );
                            }
                            this.cardsPlayed.addItemType( card_type_id, 0, g_gamethemeurl+CARD_SPRITES, card_type_id );
                            this.railWays[rr-1].addItemType( card_type_id, 0, g_gamethemeurl+CARD_SPRITES, card_type_id );
                            this.setupSharePiles(card_type_id, g_gamethemeurl+CARD_SPRITES);
                            // tricklanes can also hold RR cards
                            this.trickLane.addItemType( card_type_id, 0, g_gamethemeurl+CARD_SPRITES, card_type_id );
                        }
                    }
                }
            }
        },

        /**
         * Add StockItem to all share piles
         * @param {string} card_type_id
         * @param {string} sprite_url
         */
        setupSharePiles: function(card_type_id, sprite_url) {
            for (var ri = 0; ri < 5; ri++) {
                for( const player_id in this.gamedatas.players ) {
                    this.sharePiles[player_id][ri].addItemType( card_type_id, card_type_id, sprite_url, card_type_id );
                }
                this.sharePiles[DISCARD][ri].addItemType( card_type_id, card_type_id, sprite_url, card_type_id );
            }
        },

        /**
        * Actions clicking or hovering on locomotive slots
        */
        setupLocomotiveActions: function() {
            for (loconode of dojo.query('.totr_locomotive_slot')) {
                dojo.connect(loconode, 'onclick', this, 'onLocomotiveSelected');
                dojo.connect(loconode, 'mouseenter', this, 'onLocomotiveSlotActivate');
                dojo.connect(loconode, 'mouseleave', this, 'onLocomotiveSlotDeactivate');
            }
        },

        /**
         * Actions clicking or hovering on Railhouse icons
         */
        setupRailhouseActions: function() {
            for (rh_node of dojo.query('.totr_railhouse')) {
                dojo.connect(rh_node, 'onclick', this, 'onRailhouseSelected');
                dojo.connect(rh_node, 'mouseenter', this, 'onRailhouseActivate');
                dojo.connect(rh_node, 'mouseleave', this, 'onRailhouseDeactivate');
            }
        },

        /**
         * The Show/Hide shares button and the Station Values help card.
         */
        setupHelpButtons: function() {
            // Show/Hide Player shares button
            dojo.connect($('shares_button'), 'onclick', this, 'onShowShares');
            // Station Values help card
            this.addTooltipHtml( $('station_values'), '<div class="totr_large_station_values_card"></div>', 0 ); 
        },

        //// POPULATE Functions actually put the cards into the Stocks, from Db

        /**
         * Put the cards in current player's hand.
         */
        populatePlayerHand: function() {
            if (this.isSpectator) {
                return;
            }
            // Cards in player's hand
            for ( const h in this.gamedatas.hand ) {
                var mycard = this.gamedatas.hand[h];
                var rr = mycard.type;
                var value = mycard.type_arg;
                this.playerHand.addToStockWithId(this.getUniqueTypeForCard(rr, value), mycard.id);
            }
            this.updateHand(this.isCurrentPlayerActive() && this.checkAction('playCard', true), this.gamedatas.trick);
        },

        /**
         * Put all shares that have previously been added to piles.
         * Also set counters
         */
        populateSharePiles: function() {
            // everyone's stock shares
            // also find the discarded shares
            for (const s in this.gamedatas.shares) {
                var sharecard = this.gamedatas.shares[s];
                var owner = sharecard.location_arg;
                if (sharecard.location == 'discard') {
                    owner = DISCARD;
                }
                var rr = sharecard.type;
                var val = sharecard.type_arg;
                var ctype = this.getUniqueTypeForCard(rr, val);
                this.sharePiles[owner][rr-1].addToStockWithId(ctype, sharecard.id);
                if (owner != DISCARD) {
                    this.shareCounters[owner][rr-1].incValue(1);
                }
            }
        },

        /**
         * Put cards played on table.
         */
        populateCardsPlayed: function() {
            for (const i in this.gamedatas.currenttrick) {
                var tcard = this.gamedatas.currenttrick[i];
                var rr = tcard.type;
                var value = tcard.type_arg;
                var ctype = this.getUniqueTypeForCard(rr, value);
                this.cardsPlayed.item_type[ctype].weight = toint(tcard.location_arg);
                this.cardsPlayed.addToStockWithId(ctype, tcard.id);
            }
        },

        /**
         * Put cards in Trick Lane.
         */
        populateTrickLane: function() {
            // Special counter for Reservation cards
            var rsv = 0;
            for (const i in this.gamedatas.tricklanecards) {
                var tlcard = this.gamedatas.tricklanecards[i];
                var tt = tlcard.type;
                var value = tlcard.type_arg;
                var ctype = this.getUniqueTypeForCard(tt, value);
                if (ctype == RESERVATION_CARD_TYPE) {
                    ctype += rsv++;
                }
                this.trickLane.item_type[ctype].weight = toint(tlcard.location_arg);

                this.trickLane.addToStockWithId(ctype, tlcard.id);
            }
            this.rearrangeTrickLane();
        },

        /**
         * Rearranges all cards after the ∞ locomotive.
         */
        rearrangeTrickLane: function() {
            var unlimited_loco = false;
            var last_top = Number.MAX_SAFE_INTEGER;
            for (const i in this.trickLane.items) {
                const card = this.trickLane.items[i];
                var card_div = this.trickLane.getItemDivId(card.id);
                var top = dojo.getStyle(card_div, "top");
                if (card.type == LOCOMOTIVE_UNLIMITED_TYPE) {
                    unlimited_loco = true;
                    dojo.style(card_div, "z-index", 1);
                }
                if (unlimited_loco) {
                    if (!(last_top < top)) {
                        dojo.style(card_div, "transform", "translateX(-50px)");
                    }
                }
                last_top = top;
            }
        },

        /**
         * Put cards in the railway lines.
         */
        populateRailways: function() {
            var rw = 0;
            for (const rr of RR_PREFIXES) {
                var railwaycards = this.gamedatas[rr+'_railway_cards'];
                for (const i in railwaycards) {
                    var railwaycard = railwaycards[i];
                    var tt = railwaycard.type;
                    var value = railwaycard.type_arg;
                    if (railwaycard.location_arg == 0) {
                        // Locomotives go to the loco slot
                        this.placeLocomotiveCard(toint(value), rw+1);
                    } else {
                        var ctype = this.getUniqueTypeForCard(tt, value);
                        this.railWays[rw].item_type[ctype].weight = toint(railwaycard.location_arg);
                        this.railWays[rw].addToStockWithId(ctype, railwaycard.id);
                    }
                }
                rw++;
            }
        },

        ///////////////////////////////////////////////////
        //// Game & client states
        
        // onEnteringState: this method is called each time we are entering into a new game state.
        //                  You can use this method to perform some user interface changes at this moment.
        //
        onEnteringState: function( stateName, args )
        {
            switch( stateName ) {
            
                case 'playerTurn':
                    this.updateHand(this.isCurrentPlayerActive(), args.args.rr);
                break;
                case 'addRailway':
                    this.updateRailhouses(false, args.args.rr);
                break;
                case 'addCity':
                    this.updateRailhouses(true);
                break;
                // case 'addLocomotive':
                // break;
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
            case 'addRailway':
                this.updateRailhouses(false, 0);
                break;
            case 'addCity':
                this.updateRailhouses(false, 0);
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
         * @returns {number} card_type
         */
        getUniqueTypeForCard: function(rr, v) {
            return ((rr-1)*12) + (v-1);
        },

        /**
         * Reverse of above function. Gets the Type/Arg from the card id.
         * 
         * @param {int} card_type 
         * @returns {Array} [type, type_arg] (rr,value)
         */
        getTypeAndValue: function(card_type) {
            if (card_type >= RESERVATION_CARD_TYPE) {
                return [ROWS, RESERVATION];
            }
            return [Math.floor(card_type/12)+1, (card_type % 12) +1];
        },

        /**
         * Create a Stock for a RR company.
         * @param {int} rr
         * @returns {Stock}
         */
        createRailroadStock: function(rr) {
            var railroad = new ebg.stock();
            railroad.create(this, $(rr+'_railway'), this.cardwidth, this.cardheight );
            railroad.setSelectionMode(0);
            railroad.image_items_per_row = COLS;
            railroad.extraClasses='totr_nice_card';
            railroad.onItemCreate = dojo.hitch(this, this.setUpCard);
            // for some reason they display vertically in rr_lane if this isn't set
            railroad.autowidth = true;
            return railroad;
        },

        /**
         * Create the Stock for a player's shares of a company.
         * @param {string} player_id 
         * @param {string} company
         * @returns {Stock}
         */
        createPlayerSharesStock: function(player_id, company) {
            var shares = new ebg.stock();
            var share_id = player_id+'_'+company;
            shares.create(this, $(share_id), this.cardwidth, this.cardheight );
            shares.setSelectionMode(0);
            shares.image_items_per_row = COLS;
            shares.autowidth = true;
            shares.extraClasses='totr_nice_card';
            shares.setOverlap( 25, 0 );
            shares.onItemCreate = dojo.hitch(this, this.setUpCard);
            return shares;
        },

        /**
         * Adds tooltips to card.
         * @param {string} card_div
         * @param {string} card_type 
         * @param {string} myhand_item
         */
        setUpCard: function(card_div, card_type, myhand_item) {
            // Add a special tooltip on the card:
            var [type, type_arg] = this.getTypeAndValue(card_type);
            var rri = type-1;
            var tooltip;
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
                        tooltip = _("City (Pittsburgh)");
                        break;
                    case 7:
                        tooltip = _("City (Baltimore)");
                        break;
                    case 8:
                        tooltip = _("City (New York)");
                        break;
                    case 9:
                        tooltip = _("Reservation Card");
                        break;
                    default:
                        throw new Error("Unknown Card: type="+type+", type_arg="+type_arg+")");// NOI18N
                }
            } else if (type_arg == STATION) {
                tooltip = dojo.string.substitute(_("${rr} Station"), {rr: RAILROADS[rri]});
            } else if (type_arg == EXCHANGE) {
                tooltip = dojo.string.substitute(_("${rr} Exchange Card"), {rr: RAILROADS[rri]});
            } else {
                tooltip = dojo.string.substitute(_("${rr} (${val})"), {rr: RAILROADS[rri], val: type_arg});
            }
            this.addTooltip( card_div.id, tooltip, '');
        },

        /**
         * For tooltips for Locomotive cards
         * @param {int} type_arg
         * @returns {string} translated label string
         */
        getLocomotiveLabel: function(type_arg) {
            var label;
            switch (type_arg) {
                case 1:
                    label = _("Locomotive [3]");
                    break;
                case 2:
                    label = _("Locomotive [4]");
                    break;
                case 3:
                    label = _("Locomotive [5]");
                    break;
                case 4:
                    label = _("Locomotive [6]");
                    break;
                case 5:
                    label = _("Locomotive [∞]");
                    break;
                default:
                    throw new Error("Unexpected Locomotive value: "+type_arg);// NOI18N
            }
            return label;
        },

        /**
         * Put a Locomotive card in its railway.
         * @param {int} loc index of locomotive (type_arg)
         * @param {int} rr index of railway
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
            dojo.addClass( loconode, RAILROADS[rr-1]+" totr_nice_card");
            dojo.style(loconode, "margin", "5px");
            dojo.removeClass(loconode, "totr_locomotive_slot");
            dojo.removeAttr(loconode, "title");
            var tooltip = RAILROADS[rr-1] +' '+this.getLocomotiveLabel(loc);
            this.addTooltip( loconode, tooltip, '');
        },

        /**
         * Update the cards in this player's hand - assumes we have already determined if this is current player.
         * Highlights cards that are of the proper company and adds not-allowed cursor to others.
         * 
         * Must be activated on entry and exit of playerTurn, to switch selectability on and off.
         * @param {boolean} is_current_player
         * @param {int} trick_rr optional if is_current_player false, 0 means we're leading
         */
        updateHand: function(is_current_player, trick_rr) {
            if (this.isSpectator) {
                return;
            }
            if (is_current_player) {
                this.playerHand.setSelectionMode(1);

                if (trick_rr == 0) {
                    // we're leading, all cards can be played
                    for (const tc of this.playerHand.getAllItems()) {
                        var tcid = tc.id;
                        var tcdiv = this.playerHand.getItemDivId(tcid);
                        dojo.addClass(tcdiv, "totr_trick_color");
                        dojo.removeClass(tcdiv, "totr_noselect");
                    }
                } else {
                    var has_trick_color = false;
                    for (const c of this.playerHand.getAllItems()) {
                        var cid = c.id;
                        var ctype = c.type;
                        var [crr,cval] = this.getTypeAndValue(ctype);
                        var cdiv = this.playerHand.getItemDivId(cid);
                        if (crr == trick_rr) {
                            has_trick_color = true;
                            dojo.addClass(cdiv, "totr_trick_color");
                            dojo.removeClass(cdiv, "totr_noselect");
                        } else {
                            dojo.addClass(cdiv, "totr_noselect");
                            dojo.removeClass(cdiv, "totr_trick_color");
                        }
                    }
                    // if we don't have any of the right color,
                    // we have to go back and remove the totr_noselect
                    if (!has_trick_color) {
                        for (const c2 of this.playerHand.getAllItems()) {
                            var cdiv2 = this.playerHand.getItemDivId(c2.id);
                            dojo.addClass(cdiv2, "totr_trick_color");
                            dojo.removeClass(cdiv2, "totr_noselect");
                        }
                    }
                }
            } else {
                // cleanup any previous selection chrome
                for (const c of this.playerHand.getAllItems()) {
                    var cdiv = this.playerHand.getItemDivId(c.id);
                    dojo.removeClass(cdiv, "totr_trick_color");
                    dojo.removeClass(cdiv, "totr_noselect");
                }

                this.playerHand.setSelectionMode(0);
            }
        },


        // /**
        //  * Decorates the lead card and moves over the remaining cards in the cardsPlayed area.
        //  */
        // decorateLeadCard: function() {
        //     var lead_id = this.gamedatas.lead;
        //     console.log('lead_id from gamedatas: ' + lead_id);
        //     if (lead_id == 0) {
        //     // in the case where we are in playerTurn state and haven't refreshed or pulled from Db,
        //     // the lead card is card 0
        //         if (this.cardsPlayed.count() != 0) {
        //             lead_id = this.cardsPlayed.items[0].id;
        //             console.log('lead_id from cardsPlayed: ' + lead_id);
        //         }
        //     }
        //     if (lead_id != 0) {
        //         lead_card = this.cardsPlayed.getItemById(lead_id);
        //         // it might have already been sent to discard or railway
        //         console.log('lead card found: ' + lead_card);
        //         if (lead_card != null) {
        //             for (var i = 0; i < this.cardsPlayed.count(); i++) {
        //                 var card = this.cardsPlayed.items[i];
        //                 var card_div = this.cardsPlayed.getItemDivId(card.id);
        //                 var cardcls = card.id == lead_id ? "card_lead" : "card_played_not_lead";
        //                 dojo.addClass(card_div, cardcls);
        //             }
        //         }
        //     }
        // },

        /**
         * Activate eligible railhouse icons if this is the current player.
         * Otherwise reset all to default.
         * 
         * @param {boolean} is_city are we placing a city?
         * @param {int} rr optional: railroad to activate. 0 means none
         */
        updateRailhouses: function(is_city, rr) {
            var mode = RAILHOUSE_BUTTON.DEFAULT;
            for (var i = 0; i < 5; i++) {
                var railhouse_start = RR_PREFIXES[i]+"_start";
                var railhouse_end = RR_PREFIXES[i]+"_end";
                var rri = i+1;
                if (this.isCurrentPlayerActive()) {
                    // for city, all endpoints are ready
                    if (is_city) {
                        mode = RAILHOUSE_BUTTON.READY;
                    } else {
                        // if we're adding the card played, it's only the railhouses from that line
                        // all other cards should be deactivated
                        mode = (rri == rr) ? RAILHOUSE_BUTTON.READY : RAILHOUSE_BUTTON.DEFAULT;
                    }
                }
                this.setRailhouseButton(railhouse_start, rri, mode);
                this.setRailhouseButton(railhouse_end, rri, mode);
            }
        },

        /**
         * For determining the railway line the current player can add a card to.
         * @returns {int} the number of the rr company, or 0 if no card in cardsplayed.
         */
        getRailroadCompanyPlayed: function() {
            var company = 0;
            var cardct = this.cardsPlayed.count();
            if (cardct > 0) {
                var card_id = this.gamedatas.cards_played[this.player_id];
                for (var i = 0; i < cardct; i++) {
                    if (this.cardsPlayed.items[i].id == card_id) {
                        var [rr,val] = this.getTypeAndValue(this.cardsPlayed.items[i].type);
                        company = rr;
                        break;
                    }
                }
            }
            return company;
        },

        /**
         * Given a prefix, get the index (integer 1 to 5)
         * @param {string} railway 
         * @returns {int} -1 if none found
         */
        getIndexByRR: function(railway) {
            var ix = 0;
            for (const rr of RR_PREFIXES) {
                if (railway == rr) {
                    return ix;
                }
                ix++;
            }
            return -1;
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

                    this.ajaxcall( "/trickoftherails/trickoftherails/playCard.html", { 
                        id: card_id,
                        lock: true 
                    }, this, function( result ) {  }, function( is_error) { } );                        
    
                    var card_div = this.playerHand.getItemDivId(card_id);
                    // if ($(card_div).classList.contains('totr_noselect')) {
                    //     console.log('not this card, dummy! ' + card_id);
                    // }
                }
                this.playerHand.unselectAll();
            }
        },

        /**
         * When player clicks a Locomotive slot.
         * @param {Object} event
         */
        onLocomotiveSelected : function(event) {
            if (this.checkAction('placeLocomotive', true) && this.isEmptyLocomotiveSlot(event)) {

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
         * Light up Locomotive slot being hovered over.
         * @param {Object} event 
         */
        onLocomotiveSlotActivate : function(event) {
            if (this.checkAction('placeLocomotive', true) && this.isEmptyLocomotiveSlot(event)) {
                var loc_id = event.target.id;
                dojo.addClass(loc_id, "totr_locomotive_slot_active");
            }
        },

        /**
         * Unhighlight slot.
         * @param {Object} event 
         */
        onLocomotiveSlotDeactivate : function(event) {
            var loc_id = event.target.id;
            dojo.removeClass(loc_id, "totr_locomotive_slot_active");
        },

        /**
         * Checks whether a Locomotive slot being selected already has a card.
         * @param {Object} event 
         * @returns {boolean} true if no card here
         */
        isEmptyLocomotiveSlot: function(event) {
            var is_empty = false;
            if (this.checkAction('placeLocomotive', true)) {
                var loco_el = event.target;
                is_empty = !loco_el.classList.contains('totr_nice_card');
            }
            return is_empty;
        },

        /**
         * When player clicks a start or endpoint on railway.
         * @param {Object} event 
         */
        onRailhouseSelected : function(event) {
            var endpoint_id = event.target.id;
            var ix = endpoint_id.lastIndexOf('_');
            var is_start = endpoint_id.endsWith("start");
            var comp = endpoint_id.substring(0, ix);

            // railway cards, check it's a valid endpoint
            if (this.checkAction('addRailwayCard', true) && this.isReadyRailhouse(event)) {
                this.setRailhouseButton(endpoint_id, this.getIndexByRR(comp)+1, RAILHOUSE_BUTTON.CLICKED);
                this.ajaxcall( "/trickoftherails/trickoftherails/addRailwayCard.html", { 
                    bStart: is_start,
                    lock: true 
                    }, this, function( result ) {  }, function( is_error) { } );
            } else if (this.checkAction('placeCity', true)) {
                this.setRailhouseButton(endpoint_id, this.getIndexByRR(comp)+1, RAILHOUSE_BUTTON.CLICKED);
                this.ajaxcall( "/trickoftherails/trickoftherails/placeCity.html", { 
                    sRR: comp+'_railway',
                    bStart: is_start,
                    lock: true 
                    }, this, function( result ) {  }, function( is_error) { } );
            }
        },

        /**
         * Highlights a chosen endpoint.
         * @param {Object} event 
         */
        onRailhouseActivate : function(event) {
            if (this.isReadyRailhouse(event)) {
                var endpoint_id = event.target.id;
                var ix = endpoint_id.lastIndexOf('_');
                var railway = endpoint_id.substring(0, ix);
                var rri = this.getIndexByRR(railway);
                this.setRailhouseButton(endpoint_id, rri+1, RAILHOUSE_BUTTON.ACTIVE);
            }
        },

        /**
         * Puts a Railhouse back in READY state upon leaving.
         * @param {Object} event
         */
        onRailhouseDeactivate : function(event) {
            if (this.isReadyRailhouse(event)) {
                var endpoint_id = event.target.id;
                // restore the ready icon
                var ix = endpoint_id.lastIndexOf('_');
                var railway = endpoint_id.substring(0, ix);
                var rri = this.getIndexByRR(railway);
                this.setRailhouseButton(endpoint_id, rri+1, RAILHOUSE_BUTTON.READY);
            }
        },

        /**
         * Checks whether the Railhouse is currently Ready (meaning it was previously activated).
         * @param {Object} event 
         * @returns {boolean} true if the target of the event is "ready" to be clicked
         */
        isReadyRailhouse: function(event) {
            return event.target.classList.contains('totr_ready_railhouse');
        },

        /**
         * When show shares button is clicked, toggles it from "Show" to "Hide."
         * @param {Object} event 
         */
        onShowShares : function(event) {
            var sharedisplay = dojo.getStyle("shares_wrapper", "display");
            // toggle display
            sharedisplay = (sharedisplay == 'none') ? 'block' : 'none';
            var button_text = (sharedisplay == 'none') ? _("Show Player Shares") : _("Hide Player Shares");
            dojo.setStyle($('shares_wrapper'), 'display', sharedisplay);
            $('shares_button').innerHTML = button_text;
        },

        /**
         * Sets the  appearance of an unselected railhouse.
         * @param {string} railhouse_id the node id
         * @param {int} rr index (1-5)
         * @param {enum} should be a RailhouseButton MODE
         */
        setRailhouseButton: function(railhouse_id, rr, mode) {
            var position_string = "0px 0px";
            switch (mode) {
                case RAILHOUSE_BUTTON.DEFAULT:
                    position_string = "0px 0px";
                    dojo.removeClass(railhouse_id, "totr_ready_railhouse");
                    break;
                case RAILHOUSE_BUTTON.READY:
                    position_string = -(RAILHOUSE_W*rr)+"px 0px";
                    dojo.addClass(railhouse_id, "totr_ready_railhouse");
                    break;
                case RAILHOUSE_BUTTON.ACTIVE:
                    position_string = -(RAILHOUSE_W*rr)+"px "+(-RAILHOUSE_H)+"px";
                    break;
                case RAILHOUSE_BUTTON.CLICKED:
                    position_string = -(RAILHOUSE_W*rr)+"px "+(-2*RAILHOUSE_H)+"px";
                    // temporarily depress to match clicked position
                    dojo.style(railhouse_id, "transform", "translateX(4px) translateY(4px)");
                    break;
                default:
                    // this is an error, should not happen!
                    console.log("ERROR: Unknown Railhouse Button mode: " + mode + " for " + railhouse_id + ": " + rr);
            }
            dojo.style(railhouse_id, "background-position", position_string);
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
         * @param {Object} notif 
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
                    this.playerHand.removeFromStockById(card_id, 'cardsplayed_item_'+card_id);
                }
                // now disable my hand again
                this.updateHand(false);
            }
        },

        /**
         * Card swapped for Reservation card in Trick Lane.
         * @param {Object} notif 
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
            this.trickLane.item_type[card_type].weight = toint(notif.args.reservation_loc);
            // move the (winning) trick card from the play area to the Trick Lane
            this.trickLane.addToStockWithId(card_type, card_id, trick_div);
            this.cardsPlayed.removeFromStockById(card_id, reserve_div);
            // now we need to rearrange because of unlimited loc
            this.rearrangeTrickLane();
        },

        /**
         * A share was discarded (automatically) by the winner.
         * @param {Object} notif 
         */
        notif_discardedShare : function(notif) {
            var card_id = toint(notif.args.card_id);
            var rr = toint(notif.args.rr);
            var val = toint(notif.args.card_value);
            var card_type = this.getUniqueTypeForCard(rr, val);
            var card_div = this.cardsPlayed.getItemDivId(card_id);
            this.sharePiles[DISCARD][rr-1].addToStockWithId(card_type, card_id, card_div);
            var to_div = this.sharePiles[DISCARD][rr-1].getItemDivId(card_id);
            this.cardsPlayed.removeFromStockById(card_id, to_div);
        },

        /**
         * A share was added to a Stock pile.
         * @param {Object} notif 
         */
        notif_shareAdded : function(notif) {
            var player_id = notif.args.player_id;
            var card_id = toint(notif.args.card_id);
            var rr = toint(notif.args.rr);
            var val = toint(notif.args.card_value);
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
            // add to counter
            this.shareCounters[player_id][rr-1].incValue(1);
        },

        /**
         * A Locomotive was placed.
         * @param {Object} notif
         */
        notif_locomotivePlaced : function(notif) {
            var card_id = toint(notif.args.card_id);
            var rr = toint(notif.args.rr);
            var loc_div = RR_PREFIXES[rr-1]+'_locomotive';
            this.placeLocomotiveCard(toint(notif.args.loc_num), rr);
            // remove locomotive from Trick Lane, move to Railroad
            this.trickLane.removeFromStockById(card_id, loc_div);
            // to prevent last card(s) from being shifted unnecessarily
            if (notif.args.loc_num == 5) {
                this.rearrangeTrickLane();
            }
        },

        /**
         * Card was moved from trick area to railway line.
         * @param {Object} notif 
         */
        notif_railwayCardAdded : function(notif) {
            var card_id = toint(notif.args.card_id);
            var rr = toint(notif.args.rr);
            var v = toint(notif.args.card_value);
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
         * @param {Object} notif 
         */
        notif_cityAdded : function(notif) {
            var card_id = toint(notif.args.card_id);
            var type_arg = toint(notif.args.city_type);
            var card_type = this.getUniqueTypeForCard(ROWS, type_arg);

            var railway = notif.args.railway;
            var rr = toint(notif.args.rr);
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


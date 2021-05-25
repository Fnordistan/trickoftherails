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
const RAILROADS = ["B&O", "C&O", "Erie", "NYC", "PRR"];
const RR_COLORS = ["004D7A", "80933F", "EDB630", "B8B7AE", "9A1D20", "E2DAB4"];

const RAILHOUSE_H = 75;
const RAILHOUSE_W = 75;

// ms used to set synchronous delay between scoring rrs in endgame
const SCORING_DELAY = 3000;
// individual player settings for auto play
const PREF_AUTO_PLAY = 102;

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

// must match values in material.inc.php!
const STATION_VALUES = [
  /** B&O */    [10, 10, 10, 20, 20, 20, 20, 30, 30, 40, 0, 10],
  /** C&O */    [40, 30, 30, 20, 20, 20, 20, 10, 10, 10, 0, 10],
  /** Erie */   [30, 20, 20, 10, 30, 10, 20, 20, 40, 10, 0, 10],
  /** NYC */    [20, 20, 30, 10, 20, 40, 10, 20, 30, 10, 0, 10],
  /** PRR */    [10, 20, 20, 30, 40, 30, 20, 20, 10, 10, 0, 10],
  /** LASTROW*/ [-40, -50, -60, -70, -80, 20, 30, 40, 0, 0, 0, 0]
];

const DISCARD = 'discarded_shares';

// places cards can go
const LOCATION = {
    TRICK_LANE: "tricklane",
    SHARE_PILE: "share_pile",
    PLAYER_HAND: "player_hand",
    CURRENT_TRICK: "current_trick",
    RAILWAY: "railway_line"
}

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
            this.cardwidth = 76;
            this.cardheight = 114;
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
            // shows current Share Values
            this.currentShareValues = [];
            // Setting up player boards
            var teams = this.gamedatas.teams;
            this.round_type = this.gamedatas.round;
            this.turn_number = this.gamedatas.turn;
            this.game_length = this.gamedatas.game_length;

            for ( const player_id in gamedatas.players ) {
                // Setting up player board
                var player_board_div = $('player_board_'+player_id);

                if (teams) {
                    dojo.place( this.format_block( 'jstpl_team_heading', {
                        "team": teams[player_id],
                        "id": player_id
                    }), player_board_div);
                }
    
                // create RR counters
                this.shareCounters[player_id] = [];
                for (const rri in RR_PREFIXES) {
                    var rr = RR_PREFIXES[rri];

                    dojo.place( this.format_block( 'jstpl_rr_counter_block', {
                        "rr": rr,
                        "id": player_id,
                        "scale": 2
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
            this.cardsPlayed.onItemCreate = dojo.hitch(this, this.setUpCurrentTrickCard);

            // Player hand
            var myhand = document.createElement("DIV");
            myhand.id = "myhand";

            var myhand_wrap = "myhand_wrap_top";
            var myhand_wrap_hide = "myhand_wrap_bottom";
            if (this.prefs[100].value == 2) {
                myhand_wrap = "myhand_wrap_bottom";
                myhand_wrap_hide = "myhand_wrap_top";
            }

            document.getElementById(myhand_wrap).appendChild(myhand);
            document.getElementById(myhand_wrap_hide).remove();

            if (!this.isSpectator) {
                this.playerHand = new ebg.stock();
                this.playerHand.create( this, $('myhand'), this.cardwidth, this.cardheight );
                this.playerHand.image_items_per_row = COLS;
                this.playerHand.extraClasses='totr_nice_card';
                this.playerHand.item_margin = 7;
                // this keeps selected but unselectable cards from changing
                this.playerHand.setSelectionAppearance('class');
                // hitch adding railroad as a class to each hand
                this.playerHand.onItemCreate = dojo.hitch(this, this.setUpPlayerHandCard);
                // setup card selection action
                dojo.connect( this.playerHand, 'onChangeSelection', this, 'onPlayerHandSelectionChanged' );
            } else {
                // Hide player hand area for spectators
                dojo.style(myhand_wrap, 'display', 'none');
            }

            // Now set up trick lane
            this.trickLane = new ebg.stock();
            this.trickLane.create(this, $('tricklane'), this.cardwidth, this.cardheight );
            this.trickLane.setSelectionMode(0);
            this.trickLane.image_items_per_row = COLS;
            this.trickLane.item_margin = 7;
            this.trickLane.extraClasses='totr_nice_card';

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

            this.reservation_cards = gamedatas.reservation_cards;
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

            this.displayShareValues();

            // Setup game notifications to handle (see "setupNotifications" method below)
            this.setupNotifications();
            this.setupPreference();
        },

        ///////////////////////////////////////////////////
        /// Setup functions

       /** Inject html into log items  */
        /* @Override */
        format_string_recursive : function(log, args) {
            try {
                if (log && args && !args.processed) {
                    args.processed = true;

                    var rri = (args.rr) ? parseInt(args.rr)-1 : 0;
                    var rr_label = RR_PREFIXES[rri];
                    if (args.card_value_label) {
                        args.card_value_label = this.format_block('jstpl_card_value_label', {
                            "card_value_label": args.card_value_label,
                            "rrname": rr_label
                        });
                        // hack because we had to insert ${card_value}
                        log = log.replace('${card_value}', '');
                    }
                    if (args.company) {
                        var compstr = this.format_block('jstpl_rr_name', {
                            "company": args.company,
                            "rrname": rr_label
                        }) + this.format_block('jstpl_rr_icon', {
                            "rrname": rr_label
                        });
                        args.company = compstr;
                        if (args.action) {
                            // interpolation inside the action
                            args.action = args.action.replace('${company}', compstr);
                        }
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
            for (var rr in RR_PREFIXES) {
                var loconode = RR_PREFIXES[rr]+'_locomotive';
                dojo.connect($(loconode), 'onclick', this, 'onLocomotiveSelected');
                dojo.connect($(loconode), 'mouseenter', this, 'onLocomotiveSlotActivate');
                dojo.connect($(loconode), 'mouseleave', this, 'onLocomotiveSlotDeactivate');
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
            const played = {};
            for (const pid in this.gamedatas.cards_played) {
                played[this.gamedatas.cards_played[pid]] = pid;
            }
            for (const i in this.gamedatas.currenttrick) {
                var tcard = this.gamedatas.currenttrick[i];
                var rr = tcard.type;
                var value = tcard.type_arg;
                var ctype = this.getUniqueTypeForCard(rr, value);
                this.cardsPlayed.item_type[ctype].weight = parseInt(tcard.location_arg);
                this.cardsPlayed.addToStockWithId(ctype, tcard.id);
                this.addPlayerLabel(i, played[i]);
            }
        },

        /**
         * Place a label showing who played each card
         */
        addPlayerLabel: function(id, player_id) {
            const card_div = document.getElementById('cardsplayed_item_'+id);
            const player = this.gamedatas.players[player_id];
            card_div.style['border'] = "3px solid #"+ player['color'];
            dojo.place(this.format_block('jstpl_player_label', {pid: player_id, pname: player['name'], color: player['color']}), card_div);
        },

        /**
         * Put cards in Trick Lane.
         */
        populateTrickLane: function() {
            // first we need to know, because of tooltip text, if any reservation cards are in the lane
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
                this.trickLane.item_type[ctype].weight = parseInt(tlcard.location_arg);
                this.trickLane.addToStockWithId(ctype, tlcard.id);
                var card_div = this.trickLane.getItemDivId(tlcard.id);
                if (ctype == LOCOMOTIVE_UNLIMITED_TYPE) {
                    dojo.addClass(card_div, "totr_unl_loc");
                }
                this.addTooltipToCard(card_div, ctype, LOCATION.TRICK_LANE);
            }
        },

        /**
         * Checks whether there are Reservation Cards in the Trick Lane.
         */
        existsReservationCard: function() {
            return this.reservation_cards > 0;
        },

        /**
         * Put cards in the railway lines.
         */
        populateRailways: function() {
            var rw = 0;
            for (const rr of RR_PREFIXES) {
                var railwaycards = this.gamedatas[rr+'_railway_cards'];
                var has_loco = false;
                for (const i in railwaycards) {
                    var railwaycard = railwaycards[i];
                    var tt = railwaycard.type;
                    var value = railwaycard.type_arg;
                    if (railwaycard.location_arg == 0) {
                        // Locomotives go to the loco slot
                        this.placeLocomotiveCard(parseInt(value), rw+1);
                        has_loco = true;
                    } else {
                        var ctype = this.getUniqueTypeForCard(tt, value);
                        this.railWays[rw].item_type[ctype].weight = parseInt(railwaycard.location_arg);
                        this.railWays[rw].addToStockWithId(ctype, railwaycard.id);
                    }
                }
                this.addTitleTags(rw, rr, has_loco);
                rw++;
            }
        },

        /**
         * Sets "title" styles for all the fixed icons on railway lines.
         * @param {int} ri 
         * @param {string} rr prefix
         * @param {bool} has_loco is there a loco card?
         */
        addTitleTags: function(ri, rr, has_loco) {
            var company = RAILROADS[ri];
            document.getElementById(rr+"_logo").title = dojo.string.substitute(_("${company} railway"), {company: company});
            if (!has_loco) {
                document.getElementById(rr+"_locomotive").title = dojo.string.substitute(_("${company} locomotive space"), {company: company});
            }
            document.getElementById(rr+"_start").title = dojo.string.substitute(_("${company} railway start"), {company: company});
            document.getElementById(rr+"_end").title = dojo.string.substitute(_("${company} railway end"), {company: company});
        },

        /**
         * If player preference to show current share values has been set.
         */
        displayShareValues: function() {
            if (this.prefs[101].value == 2) {
                $curr_share_vals = this.gamedatas.current_share_values;

                for (const s in $curr_share_vals) {
                    const rri = s-1;
                    const rr = RR_PREFIXES[rri];

                    dojo.place( this.format_block( 'jstpl_rr_counter_block', {
                        "rr": rr,
                        "id": "current_value",
                        "scale": 2
                    }), share_value_display);
                    var scv_counter = new ebg.counter();
                    scv_counter.create(rr+'_shares_counter_current_value');
                    scv_counter.setValue($curr_share_vals[s]);
                    this.currentShareValues[rr] = scv_counter;
                    this.addTooltip(rr+'_counter_icon_current_value', dojo.string.substitute(_("${rr} current share value"), {rr: RAILROADS[rri]}), '');
                }
            } else {
                document.getElementById("share_value_wrap").style['display'] = "none";
            }
        },

        /**
         * Check whether this is the last turn of the game.
         */
        isLastTurn: function() {
            return this.game_length == this.turn_number;
        },

        /**
         * Check whether this player should autoplay a card if possible.
         * @returns true if autoplay
         */
        isAutopick: function() {
            return this.prefs[102].value == 3 || (this.prefs[102].value == 2 && this.isLastTurn());
        },

        /**
         * Set value for current share value.
         * @param {int} rr
         * @param {int} sv
         */
        updateShareValue: function(rr, sv) {
            if (this.prefs[101].value == 2) {
                const rw = RR_PREFIXES[rr-1];
                this.currentShareValues[rw].setValue(sv);
            }
        },

        /**
         * Initialize preference values.
         */
         setupPreference: function() {
            // set preference for autoplay
            this.onPreferenceChanged(PREF_AUTO_PLAY, this.prefs[PREF_AUTO_PLAY].value);

            dojo.query('.preference_control').on('change', (e) => {
                // debugger;
                var match = e.target.id.match(/^preference_control_(\d+)$/);
                if (match) {
                    var pref = match[1];
                    var newValue = e.target.value;
                    this.prefs[pref].value = newValue;
                    this.onPreferenceChanged(pref, newValue);
                }
            });
        },

        /**
         * 
         * @param {*} backPrefs 
         */
        checkPreferencesConsistency: function(backPrefs) {
            Object.keys(backPrefs).forEach(pref => {
                if (this.prefs[pref].value != backPrefs[pref]) {
                    this.onPreferenceChanged(PREF_AUTO_PLAY, this.prefs[pref].value);
                }
            })
        },

        /*
        * Preference polyfill
        */
        setPreferenceValue: function(number, newValue) {
            var optionSel = 'option[value="' + newValue + '"]';
            dojo.query('#preference_control_' + number + ' > ' + optionSel + ', #preference_fontrol_' + number + ' > ' + optionSel).attr('selected', true);
            var select = $('preference_control_' + number);
            if (dojo.isIE) {
                select.fireEvent('onchange');
            } else {
                var event = document.createEvent('HTMLEvents');
                event.initEvent('change', false, true);
                select.dispatchEvent(event);
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
                case 'newTrick':
                    this.turn_number++;
                    this.round_type = (this.round_type == "operating") ? "stock" : "operating";
                    break;
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
            switch( stateName ) {
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
        onUpdateActionButtons: function( stateName, args ) {
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
            railroad.onItemCreate = dojo.hitch(this, this.setUpRailwayCard);
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
            shares.onItemCreate = dojo.hitch(this, this.setUpPlayerSharesCard);
            return shares;
        },


        /**
         * Convenience function for hitching to cards played
         * @param {*} card_div 
         * @param {*} card_type 
         * @param {*} myhand_item 
         */
        setUpRailwayCard: function(card_div, card_type, myhand_item) {
            this.setUpCard(card_div, card_type, myhand_item, LOCATION.RAILWAY);
        },

        /**
         * Convenience function for hitching to cards played
         * @param {*} card_div 
         * @param {*} card_type 
         * @param {*} myhand_item 
         */
        setUpCurrentTrickCard: function(card_div, card_type, myhand_item) {
            this.setUpCard(card_div, card_type, myhand_item, LOCATION.CURRENT_TRICK);
        },

        /**
         * Convenience function for hitching to player hand cards
         * @param {*} card_div 
         * @param {*} card_type 
         * @param {*} myhand_item 
         */
        setUpPlayerHandCard: function(card_div, card_type, myhand_item) {
            this.setUpCard(card_div, card_type, myhand_item, LOCATION.PLAYER_HAND);
        },

        /**
         * Convenience function for hitching to player shares
         * @param {*} card_div 
         * @param {*} card_type 
         * @param {*} myhand_item 
         */
        setUpPlayerSharesCard: function(card_div, card_type, myhand_item) {
            this.setUpCard(card_div, card_type, myhand_item, LOCATION.SHARE_PILE);
        },

        /**
         * Adds tooltips to card.
         * @param {string} card_div
         * @param {string} card_type 
         * @param {string} myhand_item
         * @param {enum} location optional
         */
        setUpCard: function(card_div, card_type, myhand_item, location) {
            this.addTooltipToCard(card_div.id, card_type, location);
        },

        /**
         * Create tooltips.
         * @param {string} card_div id
         * @param {int} card_type type of card
         * @param {enum} location where card is going to be placed
         */
        addTooltipToCard: function(card_div, card_type, location) {
            var [type, type_arg] = this.getTypeAndValue(card_type);
            var rri = type-1;
            var lbl;
            var lbl_val = '';
            var card_text = '';
            var hdr_color_type = RR_PREFIXES[rri];
            var hdr_class = 'totr_tt_hdr_val';
            var icon_type = '';
            var station_value = 0;
            const CITY_CARD_TEXT = _("Trick winner places this City at either end of any railway");
            var swap_action = this.existsReservationCard() ? _("winning card replaces leftmost Reservation Card") : _("winning card is discarded");
            const SWAP_TEXT = _("Trick winner takes this card as a company share; ") + swap_action;
            if (type == ROWS) {
                switch (type_arg) {
                    case 1:
                    case 2:
                    case 3:
                    case 4:
                    case 5:
                        lbl = "Locomotive";
                        lbl_val = this.getLocomotiveLabel(type_arg);
                        hdr_color_type = 'locomotive';
                        hdr_class = 'totr_tt_hdr_loc_val';
                        icon_type = 'locomotive';
                        station_value = STATION_VALUES[rri][type_arg-1];
                        if (type_arg == 5) {
                            if (this.gamedatas.expert) {
                                // for expert variant
                                card_text = _("After trick winner places Locomotive [6], Locomotive [∞] may immediately be placed on any other available railway");
                            } else {
                                card_text = _("After trick winner places Locomotive [6], Locomotive [∞] is automatically placed on last remaining railway");
                            }
                            
                            card_text = card_text.replace("[6]", this.format_block('jstpl_tooltip_loc_val', {val: '6'}));
                            card_text = card_text.replace("[∞]", this.format_block('jstpl_tooltip_loc_val', {val: '∞'}));
                        } else {
                            card_text = _("Trick winner places this Locomotive on any railway that does not yet have one");
                        }
                        break;
                    case 6:
                        lbl = _("City (Pittsburgh)");
                        card_text = CITY_CARD_TEXT;
                        hdr_color_type = 'city';
                        icon_type = 'railroad';
                        station_value = STATION_VALUES[rri][type_arg-1];
                        break;
                    case 7:
                        lbl = _("City (Baltimore)");
                        card_text = CITY_CARD_TEXT;
                        hdr_color_type = 'city';
                        icon_type = 'railroad';
                        station_value = STATION_VALUES[rri][type_arg-1];
                        break;
                    case 8:
                        lbl = _("City (New York)");
                        card_text = CITY_CARD_TEXT;
                        hdr_color_type = 'city';
                        icon_type = 'railroad';
                        station_value = STATION_VALUES[rri][type_arg-1];
                        break;
                    case 9:
                        lbl = _("Reservation Card");
                        card_text = _("Leftmost Reservation Card is replaced with winning card during next Stock Round");
                        hdr_color_type = 'reservation';
                        icon_type = 'reservation';
                        break;
                    default:
                        throw new Error("Unknown Card: type="+type+", type_arg="+type_arg+")");// NOI18N
                }
            } else if (type_arg == STATION) {
                lbl = dojo.string.substitute(_("${rr} Station"), {rr: RAILROADS[rri]});
                icon_type = 'station';
            } else if (type_arg == EXCHANGE) {
                lbl = dojo.string.substitute(_("${rr} Exchange Card"), {rr: RAILROADS[rri]});
                icon_type = 'exchange';
                card_text = SWAP_TEXT;
            } else {
                lbl = RAILROADS[rri];
                lbl_val = type_arg;
                icon_type = 'railroad';
                card_text = SWAP_TEXT;
            }
            if (location == LOCATION.SHARE_PILE) {
                card_text = "";
                icon_type = 'share';
            } else if (!(location == LOCATION.TRICK_LANE || type_arg == EXCHANGE)) {
                station_value = STATION_VALUES[rri][type_arg-1];
                card_text = '';
                if (location == LOCATION.CURRENT_TRICK) {
                    if (this.round_type == 'operating') {
                        icon_type = 'railroad';
                    } else {
                        icon_type = 'share';
                    }
                } else if (location == LOCATION.PLAYER_HAND) {
                    icon_type = '';
                } else {
                    icon_type = 'railroad';
                }
            }
            var tooltip = this.format_block('jstpl_tooltip_text', {
                "label": lbl,
                "text": card_text,
                "hdr_bgcolor": hdr_color_type,
            });
            tooltip = this.decorateTooltipHdr(tooltip, lbl_val, hdr_class, hdr_color_type, icon_type, station_value);
            this.addTooltipHtml(card_div, tooltip, 0);
        },

        /**
         * Create a Station Values icon
         * @param {string} txt
         * @param {int} sv 
         * @returns span with SV icon
         */
        stationValuesIcon: function(txt, sv) {
            var x = 0;
            var y = 0;
            if (sv > 0) {
                x = ((sv/10)-1)*-50;
                y = -50;
            } else {
                x = ((sv/-10)-4)*-50;
                y = 0;
            }
            var sv_span = this.format_block('jstpl_tooltip_sv', {text: txt, xpos: x, ypos: y});

            return sv_span;
        },

        /**
         * Add icons and things to tooltip Header
         * @param {string} tooltip 
         * @param {string} val 
         * @param {string} clz 
         * @param {string} clr
         * @param {string} icon
         * @param {int} sv
         * @returns modified tooltip
         */
        decorateTooltipHdr: function(tooltip, val, clz, clr, icon, sv) {
            if (val == '') {
                tooltip = tooltip.replace("_VAL_", '');
            } else {
                var lbl_span = this.format_block('jstpl_tootip_hdr_val', {val: val, cls: clz});
                tooltip = tooltip.replace("_VAL_", lbl_span);
            }
            if (RR_PREFIXES.includes(clr)) {
                var rr_icon = this.format_block('jstpl_rr_icon', {rrname: clr});
                tooltip = tooltip.replace("_RR_", rr_icon);
            } else {
                tooltip = tooltip.replace("_RR_", '');
            }
            if (icon) {
                var icon_class = '';
                if (icon == 'locomotive') {
                    icon_class = "totr_locomotive_card_icon";
                } else if (icon == 'share') {
                    icon_class = "totr_share_icon";
                } else if (icon == 'station') {
                    icon_class = "totr_railhouse";
                } else if (icon == 'railroad') {
                    icon_class = "totr_rail_icon";
                } else if (icon == 'reservation') {
                    icon_class = "totr_reservation_icon";
                } else if (icon == 'exchange') {
                    icon_class = "totr_exchange_icon";
                }
                var icon_span = this.format_block('jstpl_tooltip_icon', {cls: icon_class});
                tooltip = tooltip.replace("_ICON_", icon_span);
            } else {
                tooltip = tooltip.replace("_ICON_", '');
            }
            if (sv == 0) {
                tooltip = tooltip.replace("_SV_", '');
            } else {
                var txt = clz == "totr_tt_hdr_loc_val" ? _("Profits") : _("Station Value");
                var svicon = this.stationValuesIcon(txt, sv);
                tooltip = tooltip.replace("_SV_", svicon);
            }

            return tooltip;
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
                    label = "3";
                    break;
                case 2:
                    label = "4";
                    break;
                case 3:
                    label = "5";
                    break;
                case 4:
                    label = "6";
                    break;
                case 5:
                    label = "∞";
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
            var rri = rr-1;
            // the id of the locomotive slot
            var loconode = RR_PREFIXES[rri]+'_locomotive';
            var x = -1 * (loc-1) * this.cardwidth;
            var y = -5 * this.cardheight;

            dojo.style(loconode, {
                "width": this.cardwidth + "px",
                "height": this.cardheight+"px",
                "background": "url("+g_gamethemeurl+CARD_SPRITES+") "+x+"px "+y +"px",
                "z-index": 1,
            });

            dojo.addClass( loconode, RAILROADS[rri]+" totr_nice_card");
            dojo.style(loconode, "margin", "5px");
            dojo.removeClass(loconode, "totr_locomotive_slot");
            dojo.removeAttr(loconode, "title");
            var tooltip = this.format_block('jstpl_tooltip_text', {
                "label": "Locomotive",
                "text": '',
                "hdr_bgcolor": 'locomotive',
            });
            tooltip = this.decorateTooltipHdr(tooltip, this.getLocomotiveLabel(loc), "totr_tt_hdr_loc_val", "locomotive", "locomotive", STATION_VALUES[5][loc-1]);
            this.addTooltipHtml(loconode, tooltip, 0);
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

        /**
         * 
         * @param {*} pref 
         * @param {*} val 
         */
        onPreferenceChanged: function(pref, val) {
            if (pref == PREF_AUTO_PLAY) {
                this.ajaxcall( "/trickoftherails/trickoftherails/actChangePref.html", { 
                    pref: PREF_AUTO_PLAY,
                    value: val,
                    lock: true 
                }, this, function( result ) {  }, function( is_error) { } );                        
            }
        },

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
            // somehow this gets called sometimes on endgame animations?
            if (this.checkAction('placeLocomotive', true)) {
                var loc_id = event.target.id;
                dojo.removeClass(loc_id, "totr_locomotive_slot_active");
            }
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
            var sharedisplay = dojo.getStyle("shares_wrap", "display");
            // toggle display
            sharedisplay = (sharedisplay == 'none') ? 'block' : 'none';
            var button_text = (sharedisplay == 'none') ? _("Show Player Shares") : _("Hide Player Shares");
            dojo.setStyle($('shares_wrap'), 'display', sharedisplay);
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
                    showMessage("ERROR: Unknown Railhouse Button mode: " + mode + " for " + railhouse_id + ": " + rr, "error");
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
            this.notifqueue.setSynchronous( 'discardedShare', 1000 );
            dojo.subscribe('reservationSwapped', this, "notif_reservationSwapped");
            this.notifqueue.setSynchronous( 'reservationSwapped', 1000 );
            dojo.subscribe('shareAdded', this, "notif_shareAdded");
            this.notifqueue.setSynchronous( 'shareAdded', 1000 );
            dojo.subscribe('locomotivePlaced', this, "notif_locomotivePlaced");
            dojo.subscribe('railwayCardAdded', this, "notif_railwayCardAdded");
            dojo.subscribe('cityAdded', this, "notif_cityAdded");
            dojo.subscribe('railroadScored', this, "notif_railroadScored");
            this.notifqueue.setSynchronous( 'railroadScored', SCORING_DELAY );
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
            this.addPlayerLabel(card_id, notif.args.player_id);
            this.addTooltipToCard('cards_played_'+card_type, card_type, LOCATION.CURRENT_TRICK);
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
            this.trickLane.item_type[card_type].weight = parseInt(notif.args.reservation_loc);
            // move the (winning) trick card from the play area to the Trick Lane
            this.trickLane.addToStockWithId(card_type, card_id, trick_div);
            this.cardsPlayed.removeFromStockById(card_id, reserve_div);
            // now refresh TrickLane tooltips
            this.reservation_cards--;
            var tricklanecards = this.trickLane.getAllItems();
            for (t of tricklanecards) {
                var id = t.id;
                var new_card_divid = this.trickLane.getItemDivId(id);
                this.addTooltipToCard(new_card_divid, t.type, LOCATION.TRICK_LANE);
            }
        },

        /**
         * A share was discarded (automatically) by the winner.
         * @param {Object} notif 
         */
        notif_discardedShare : function(notif) {
            var card_id = parseInt(notif.args.card_id);
            var rr = parseInt(notif.args.rr);
            var val = parseInt(notif.args.card_value);
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
            // add to counter
            this.shareCounters[player_id][rr-1].incValue(1);
        },

        /**
         * A Locomotive was placed.
         * @param {Object} notif
         */
        notif_locomotivePlaced : function(notif) {
            var card_id = parseInt(notif.args.card_id);
            var rr = parseInt(notif.args.rr);
            var loc_div = RR_PREFIXES[rr-1]+'_locomotive';
            this.placeLocomotiveCard(parseInt(notif.args.loc_num), rr);
            // remove locomotive from Trick Lane, move to Railroad
            this.trickLane.removeFromStockById(card_id, loc_div);
            var share_val = parseInt(notif.args.share_value);
            this.updateShareValue(rr, share_val);
        },

        /**
         * Card was moved from trick area to railway line.
         * @param {Object} notif 
         */
        notif_railwayCardAdded : function(notif) {
            var card_id = parseInt(notif.args.card_id);
            var rr = parseInt(notif.args.rr);
            var v = parseInt(notif.args.card_value);
            // will be -1 for start, 1 for end
            var wt = parseInt(notif.args.weight);
            this.cardsPlayed.removeFromStockById(card_id);
            var card_type = this.getUniqueTypeForCard(rr, v);
            var card_div = this.cardsPlayed.getItemDivId(card_id);

            // have to explicitly set weight while sliding into place or it goes into wrong order before refresh from Db
            // We add increasingly negative weights when inserted in front, because otherwise 0 wts get unordered
            var weight = wt*this.railWays[rr-1].count();
            this.railWays[rr-1].item_type[card_type].weight = weight;

            this.railWays[rr-1].addToStockWithId(card_type, card_id, card_div);
            var share_val = parseInt(notif.args.share_value);
            this.updateShareValue(rr, share_val);
        },

        /**
         * A City card was added to a railway line.
         * @param {Object} notif 
         */
        notif_cityAdded : function(notif) {
            var card_id = parseInt(notif.args.card_id);
            var type_arg = parseInt(notif.args.city_type);
            var card_type = this.getUniqueTypeForCard(ROWS, type_arg);
            var wt = parseInt(notif.args.weight);

            var rr = parseInt(notif.args.rr);
            var trick_div = this.trickLane.getItemDivId(card_id);

            // remove City from Trick Lane
            this.trickLane.removeFromStockById(card_id);
            // move it to the chosen Railroad lane
            // have to explicitly set weight while sliding into place or it goes into wrong order before refresh from Db
            // We add increasingly negative weights when inserted in front, because otherwise 0 wts get unordered
            var weight = wt*this.railWays[rr-1].count();
            this.railWays[rr-1].item_type[card_type].weight = weight;

            this.railWays[rr-1].addToStockWithId(card_type, card_id, trick_div);
            var share_val = parseInt(notif.args.share_value);
            this.updateShareValue(rr, share_val);
        },

        /**
         * Does the animation for scoring.
         * @param {Object} notif 
         */
        notif_railroadScored : function(notif) {
            var rr = parseInt(notif.args.rr);
            var loco = notif.args.train;
            // trainless railway?
            var trainno = (loco == 0) ? 0 : parseInt(loco['type_arg']);
            var loco_value = (loco == 0) ? 0 : STATION_VALUES[5][trainno-1];
            var stations = notif.args.stations;
            var rr_score = 0;
            var rr_color = RR_COLORS[rr-1];

            var animation_duration = SCORING_DELAY * (6-rr);
            var scored_ids = [];
            for (let i = 0; i < stations.length; i++) {
                var st = stations[i];
                var type = parseInt(st['type']);
                var type_arg = parseInt(st['type_arg']);
                var sv = STATION_VALUES[type-1][type_arg-1];
                var card_id = parseInt(st['id']);
                var scored_div = this.railWays[rr-1].getItemDivId(card_id);
                dojo.addClass(scored_div, "totr_scored_card");
                this.displayScoring( scored_div, rr_color, sv, animation_duration, 0, 0 );
                rr_score += sv;
                scored_ids.push(card_id);
            }
            // fade the unscored cards
            for (const rrc of this.railWays[rr-1].getAllItems()) {
                if (!scored_ids.includes(parseInt(rrc.id))) {
                    var card_div = this.railWays[rr-1].getItemDivId(rrc.id);
                    dojo.style(card_div, "opacity", "0.5");
                }
            }
            var rh_end_div = RR_PREFIXES[rr-1]+"_end";
            if (loco == 0) {
                this.displayScoring( rh_end_div, rr_color, 0, animation_duration, 100, 0 );
            } else {
                // display the locomotive scoring
                var loco_id = parseInt(loco['id']);
                var loco_div = RR_PREFIXES[rr-1]+'_locomotive';
                this.displayScoring( loco_div, 'ff0000', loco_value, animation_duration, 0, 0 );
                // total at end of line
                rr_score += loco_value;
                rr_score = Math.max(rr_score, 0);
                this.displayScoring( rh_end_div, rr_color, rr_score, animation_duration, 100, 0 );
            }
        },

        // notif_loadBug: function (n) {
        //     function fetchNextUrl() {
        //       var url = n.args.urls.shift();
        //       console.log('Fetching URL', url);
        //       dojo.xhrGet({
        //         url: url,
        //         load: function (success) {
        //           // This could be improved, I don't check the response for errors
        //           console.log('Success for URL', url, success);
        //           if (n.args.urls.length > 0) {
        //             fetchNextUrl();
        //           } else {
        //             console.log('Done, reloading page');
        //             window.location.reload();
        //           }
        //         }
        //       });
        //     }
          
        //     console.log('Notif: load bug', n.args);
        //     fetchNextUrl();
        //   },

    });
});
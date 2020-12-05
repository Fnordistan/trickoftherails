{OVERALL_GAME_HEADER}

<!-- 
--------
-- BGA framework: © Gregory Isabelli <gisabelli@boardgamearena.com> & Emmanuel Colin <ecolin@boardgamearena.com>
-- TrickOfTheRails implementation : @ David Edelstein <davidedelstein@gmail.com>
-- 
-- This code has been produced on the BGA studio platform for use on http://boardgamearena.com.
-- See http://en.boardgamearena.com/#!doc/Studio for more information.
-------

    trickoftherails_trickoftherails.tpl
    
    This is the HTML template of your game.
    
    Everything you are writing in this file will be displayed in the HTML page of your game user interface,
    in the "main game zone" of the screen.
    
    You can use in this template:
    _ variables, with the format {MY_VARIABLE_ELEMENT}.
    _ HTML block, with the BEGIN/END format
    
    See your "view" PHP file to check how to set variables and control blocks
    
    Please REMOVE this comment before publishing your game on BGA
-->


<div id="myhand_wrap" class="whiteblock">
    <h3>My Hand</h3>
    <div id="myhand">
        <div class="playertablecard"></div>
    </div>
</div>

<div id="trickarea" class="whiteblock cardlane">
    <h3>Trick Area</h3>
</div>

<div id="tricklane" class="whiteblock cardlane">
    <h3>Trick Lane</h3>
</div>

<h3>Railroads</h3>
<div id="b_and_o_lane" class="cardlane whiteblock">
    <div id="b_and_o_logo" class="rr_lane_logo"></div>
    <div id="b_and_o_station" class="playertablecard"></div>
</div>

<div id="c_and_o_lane" class="cardlane whiteblock">
    <div id="c_and_o_logo" class="rr_lane_logo"></div>
    <div id="c_and_o_station" class="playertablecard"></div>
</div>

<div id="erie_lane" class="cardlane whiteblock">
    <div id="erie_logo" class="rr_lane_logo"></div>
    <div id="erie_station" class="playertablecard"></div>
</div>

<div id="nyc_lane" class="cardlane whiteblock">
    <div id="nyc_logo" class="rr_lane_logo"></div>
    <div id="nyc_station" class="playertablecard"></div>
</div>

<div id="prr_lane" class="cardlane whiteblock">
    <div id="prr_logo" class="rr_lane_logo"></div>
    <div id="prr_station" class="playertablecard"></div>
</div>


<script type="text/javascript">

// Javascript HTML templates

/*
// Example:
var jstpl_some_game_item='<div class="my_game_item" id="my_game_item_${MY_ITEM_ID}"></div>';

*/

</script>  

{OVERALL_GAME_FOOTER}

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
    <h3>{MY_HAND}</h3>
    <div id="myhand"></div>
</div>

<div id="button_wrapper" style="text-align: center;">
    <a href="#" id="shares_button" class="bgabutton bgabutton_blue"><span>{SHOW_SHARES_TEXT}</span></a>
</div>

<div id="shares_wrapper" class="shares_block">
    <div id="shares_area" class="shares_lane">
        <!-- BEGIN SHARES -->
        <div id="{PLAYER}_shares" class="whiteblock player_shares">
            <h1 class="player_shares_heading">{PLAYER_NAME}</h1>
            <div id="{PLAYER}_b_and_o_shares" class="shares"></div>
            <div id="{PLAYER}_c_and_o_shares" class="shares"></div>
            <div id="{PLAYER}_erie_shares" class="shares"></div>
            <div id="{PLAYER}_nyc_shares" class="shares"></div>
            <div id="{PLAYER}_prr_shares" class="shares"></div>
        </div>
        <!-- END SHARES -->
    </div>
</div>

<div id="currenttrick_wrap" class="whiteblock">
    <h3>Trick Lead</h3>
    <div id="currenttrick"></div>
</div>

<div id="tricklane_wrap" class="whiteblock">
    <h3>Trick Lane</h3>
    <div id="tricklane"></div>
</div>

<div id="rr_lanes_container">
    <h3>Railroads</h3>

    <!-- BEGIN RAILROAD -->
    <div id="{RR}_lane" class="whiteblock rr_lane">
        <div id="{RR}_logo" class="rr_lane_logo"></div>
        <div id="{RR}_locomotive" class="locomotive_slot"></div>
        <div id="{RR}_start" class="railway_endpoint"></div>
        <div id="{RR}_railway"></div>
        <div id="{RR}_end" class="railway_endpoint"></div>
    </div>
    <!-- END RAILROAD -->
</div>


<script type="text/javascript">

// Javascript HTML templates

// var jstpl_cardontable = '<div class="cardontable nice_card" style="background-position:-${x}px -${y}px">\
//                         </div>';
// </script>  

{OVERALL_GAME_FOOTER}

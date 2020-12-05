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
    <div id="myhand">

    </div>
</div>

<div id="biddinglane">
    <h3>Trick Lead</h3>
    <div id="cardsplayed" class="cardlane whiteblock">
        <div id="trick_lead" class="openslot"></div>
    </div>
</div>

<div id="tricklane">
    <h3>Trick Lane</h3>
    <div id="trickrewards" class="cardlane whiteblock">

    </div>
</div>

<div id="rr_lanes">
    <h3>Railroads</h3>

    <!-- BEGIN RAILROAD -->
    <div id="{RR}_lane" class="cardlane whiteblock">
        <div id="{RR}_logo" class="rr_lane_logo"></div>
        <div id="{RR}_lslot" class="openslot whitebock"></div>
        <div id="{RR}_station" class="rr_station nice_card"></div>
    </div>
    <!-- END RAILROAD -->

</div>


<script type="text/javascript">

// Javascript HTML templates

var jstpl_cardontable = '<div class="cardontable nice_card" style="background-position:-${x}px -${y}px">\
                        </div>';
</script>  

{OVERALL_GAME_FOOTER}

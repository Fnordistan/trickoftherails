{OVERALL_GAME_HEADER}

<div id="myhand_wrap" class="whiteblock">
    <div class="lane_header">{MY_HAND}</div>
    <div id="myhand"></div>
</div>

<div id="button_wrapper" style="text-align: center;">
    <a href="#" id="shares_button" class="bgabutton bgabutton_blue"><span>{SHOW_SHARES_TEXT}</span></a>
</div>

<div id="shares_wrapper" class="shares_container">
    <div id="shares_area" class="shares_lane">
        <!-- BEGIN PLAYERS -->
        <div id="{PLAYER}_shares" class="whiteblock player_shares">
            <div class="lane_header">{PLAYER_NAME}</div>
            <!-- BEGIN SHARES -->
            <div id="{PLAYER}_{RR}_shares" class="shares"></div>
            <!-- END SHARES -->
        </div>
        <!-- END PLAYERS -->
    </div>
</div>

<div id="currenttrick_wrap" class="whiteblock">
    <div class="lane_header">Lead</div>
    <div id="currenttrick"></div>
</div>

<div id="tricklane_wrap" class="whiteblock">
    <div class="lane_header">Trick Lane</div>
    <div id="tricklane"></div>
</div>

<div id="rr_lanes_container">
    <div class="lane_header">Railway Lines</div>

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
// 
</script>  

{OVERALL_GAME_FOOTER}

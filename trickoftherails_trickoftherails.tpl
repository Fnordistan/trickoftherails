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
            <div id="{PLAYER}_share_label" class="lane_header"">{PLAYER_NAME}</div>
            <!-- BEGIN SHARES -->
            <div id="{PLAYER}_{RR}_shares" class="shares"></div>
            <!-- END SHARES -->
        </div>
        <!-- END PLAYERS -->
        <div id="discarded_shares" class="whiteblock player_shares">
            <div id="discard_shares_header">Discarded Shares</div>
            <!-- BEGIN DISCARDED_SHARES -->
            <div id="discarded_shares_{RR}_shares" class="shares"></div>
            <!-- END DISCARDED_SHARES -->
        </div>
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
        <div id="{RR}_start" class="railhouse"></div>
        <div id="{RR}_railway"></div>
        <div id="{RR}_end" class="railhouse"></div>
    </div>
    <!-- END RAILROAD -->
</div>


<script type="text/javascript">

// Javascript HTML templates
var jstpl_rr_icon = '<span class="rr_lane_logo ${railway}_icon" style="display: inline-block; float: none;"></span>';

var jstpl_rr_name = '<span style="color: ${rr_color}; font-weight: bold;">${company}</span>';

</script>  

{OVERALL_GAME_FOOTER}

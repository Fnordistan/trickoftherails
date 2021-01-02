{OVERALL_GAME_HEADER}

<div id="myhand_wrap" class="whiteblock">
    <div class="totr_lane_header">{MY_HAND}</div>
    <div id="myhand"></div>
</div>

<div id="button_wrapper" style="display: flex; align-items: center; justify-content: center;">
    <a href="#" id="shares_button" class="bgabutton bgabutton_blue"><span>{SHOW_SHARES_TEXT}</span></a>
    <div id="station_values" class="totr_small_station_values_card"></div>
</div>

<div id="shares_wrapper" class="totr_shares_container">
    <div id="shares_area" class="totr_shares_lane">
        <!-- BEGIN PLAYERS -->
        <div id="{PLAYER}_shares" class="whiteblock totr_player_shares">
            <div id="{PLAYER}_share_label" class="totr_lane_header"">{PLAYER_NAME}</div>
            <!-- BEGIN SHARES -->
            <div id="{PLAYER}_{RR}_shares" class="shares"></div>
            <!-- END SHARES -->
        </div>
        <!-- END PLAYERS -->
        <div id="discarded_shares" class="whiteblock totr_player_shares">
            <div id="discard_shares_header">{DISCARDED_SHARES}</div>
            <!-- BEGIN DISCARDED_SHARES -->
            <div id="discarded_shares_{RR}_shares" class="shares"></div>
            <!-- END DISCARDED_SHARES -->
        </div>
    </div>
</div>

<div id="cardsplayed_wrap" class="whiteblock">
    <div id="cardsplayed"></div>
</div>

<div id="tricklane_wrap" class="whiteblock">
    <div class="totr_lane_header">{TRICK_LANE}</div>
    <div id="tricklane" class="totr_flex_lane"></div>
</div>

<div id="rr_lanes_container">
    <div class="totr_lane_header">{RAILWAY_LINES}</div>

    <!-- BEGIN RAILROAD -->
    <div id="{RR}_lane" class="whiteblock totr_flex_lane">
        <div id="{RR}_logo" class="totr_rr_logo"></div>
        <div id="{RR}_locomotive" class="totr_locomotive_slot"></div>
        <div id="{RR}_start" class="totr_railhouse"></div>
        <div id="{RR}_railway"></div>
        <div id="{RR}_end" class="totr_railhouse"></div>
    </div>
    <!-- END RAILROAD -->
</div>


<script type="text/javascript">

// Javascript HTML templates
var jstpl_rr_icon = '<span class="totr_rr_logo totr_${rr}_icon" style="display: inline-block; vertical-align: -10px;"></span>';

var jstpl_rr_name = '<span style="color: ${rr_color}; font-weight: bold;">${company}</span>';

var jstpl_card_value_label = '<span class="totr_card_value" style="background-color: ${rr_color};">${card_value_label}</span>';

// same as jstpl_rr_icon, but id added
var jstpl_rr_counter_icon = '<span id="${rr}_counter_icon_${id}" class="totr_rr_logo totr_${rr}_icon" style="display: inline-block; vertical-align: -10px;"></span>';

var jstpl_rr_counter = '<span id="${rr}_shares_counter_${id}"></span>';

</script>  

{OVERALL_GAME_FOOTER}

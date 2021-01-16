{OVERALL_GAME_HEADER}

<div id="myhand_wrap" class="whiteblock">
    <div class="totr_lane_header">{MY_HAND}</div>
    <div id="myhand"></div>
</div>

<div id="help_wrap" class="totr_help_display">
    <a href="#" id="shares_button" class="bgabutton bgabutton_blue"><span>{SHARES_BUTTON}</span></a>
    <div id="station_values" class="totr_small_station_values_card"></div>
</div>

<div id="shares_wrap" class="totr_shares_display">
    <div id="shares_area" class="totr_shares_lane">
        <!-- BEGIN PLAYERS -->
        <div id="{PLAYER}_shares" class="whiteblock totr_player_shares">
            <div id="{PLAYER}_share_label" class="totr_lane_header"">{PLAYER_NAME}</div>
            <!-- BEGIN SHARES -->
            <div id="{PLAYER}_{RR}_shares"></div>
            <!-- END SHARES -->
        </div>
        <!-- END PLAYERS -->
        <div id="discarded_shares" class="whiteblock totr_player_shares">
            <div id="discard_shares_header">{DISCARDS}</div>
            <!-- BEGIN DISCARDED_SHARES -->
            <div id="discarded_shares_{RR}_shares" class="shares"></div>
            <!-- END DISCARDED_SHARES -->
        </div>
    </div>
</div>

<div id="card_rows">
    <div id="cardsplayed_wrap" class="whiteblock">
        <div class="totr_lane_header">{CURRENT_TRICK}</div>
        <div id="cardsplayed"></div>
    </div>
    
    <div id="tricklane_wrap" class="whiteblock">
        <div class="totr_lane_header">{TRICK_LANE}</div>
        <div id="tricklane" class="totr_flex_lane"></div>
    </div>
    
</div>

<div id="rr_lanes_wrap">
    <div class="totr_lane_header">{RAILWAY_LINES}</div>

    <!-- BEGIN RAILROAD -->
    <div id="{RR}_lane" class="whiteblock totr_flex_lane">
        <div id="{RR}_logo" class="totr_rr_logo totr_rr_icon totr_{RR}_icon" style="--scale: 3;" title="{COMPANY} Railway"></div>
        <div id="{RR}_locomotive" class="totr_locomotive_slot" title="{COMPANY} locomotive space"></div>
        <div id="{RR}_start" class="totr_railhouse" title="{COMPANY} railway start"></div>
        <div id="{RR}_railway"></div>
        <div id="{RR}_end" class="totr_railhouse" title="{COMPANY} railway end"></div>
    </div>
    <!-- END RAILROAD -->
</div>


<script type="text/javascript">

// Javascript HTML templates

var jstpl_rr_name = '<span style="color: var(--color_${rrname}); font-weight: bold;">${company}</span>';

var jstpl_card_value_label = '<span class="totr_card_value" style="background-color: var(--color_${rrname});">${card_value_label}</span>';

var jstpl_rr_icon = '<span class="totr_rr_logo totr_rr_icon totr_${rrname}_icon"></span>';

var jstpl_tooltip_text = '<div><h3>${label}</h3><span>${text}</span></div>';

var jstpl_rr_counter_block = '<div id="${rr}_counter_block" class="totr_rr_counter_container">\
        <span id="${rr}_counter_icon_${id}" class="totr_rr_logo totr_rr_icon totr_${rr}_icon" style="--scale: 2;"></span>\
        <span id="${rr}_shares_counter_${id}" class="totr_shares_ctr totr_${rr}_shares_ctr" style="color: var(--color_${rr});"></span>\
    </div>'

</script>  

{OVERALL_GAME_FOOTER}

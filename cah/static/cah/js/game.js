
$(document).ready(function () {
    document.getElementById("board").oncontextmenu = function(e){ e.preventDefault();}
    document.getElementById("hand").oncontextmenu = function(e){ e.preventDefault();}

    var observer;
    observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            for (var i = 0; i < mutation.addedNodes.length; i++) {
                adjust_hand_sizing();
            }
        });
    });
    observer.observe($("#hand")[0], {childList: true});
    $(window).resize(adjust_hand_sizing);


    pid = $("#pid")[0].innerHTML;

    var ws_scheme = window.location.protocol == "https:" ? "wss" : "ws";
    game_socket = new ReconnectingWebSocket(ws_scheme + '://' + window.location.host + "/game/" + sessionKey);
    game_socket.onmessage = function(message) {
        on_board_state(message.data);
    };

    request_board_state();

    add_card_to_hand(0, "Monkies flinging their own shit.");
    add_card_to_hand(1, "A butt pooping upwards an egg.");
    add_card_to_hand(2, "A beef swarm.");
    add_card_to_hand(3, "LOOK AT THIS PHOTOGRAPH!");
    add_card_to_hand(4, "Applying your obscure, unrealistic fetishes to 90's cartoon characters.");
    // add_card_to_hand(5, "That one guy with snails.");
    add_card_to_hand(6, "Overcompensating with a huge horse penis.");
    // add_card_to_hand(7, "Two lonely neckbeards playing out futa together because nobody else will.");
});

function adjust_hand_sizing() {
    var cards = $("#hand > .card");
    if (cards.length == 0)
        return;
    var hand_margin = 15;
    var card_length = cards[0].offsetWidth;
    var hand_length = $("#hand")[0].offsetWidth - hand_margin * 2;
    var card_spacing = (hand_length - card_length) / (cards.length-1);
    if (card_length * cards.length < hand_length) {
        hand_length = card_length * cards.length;
        hand_margin = $("#hand")[0].offsetWidth / 2 - hand_length / 2;
        card_spacing = card_length;
    }
    var base_left = $("#hand")[0].offsetLeft + hand_margin;
    for (var i = 0; i < cards.length; i++) {
        $(cards[i]).css('margin-top', '0px');
        $(cards[i]).css('left', (i*card_spacing+base_left)+'px');
        $(cards[i]).css('z-index', i + 1);
    }
}

function add_card_to_hand(id, text) {
    $("#hand").append($("<div class='card noselect' id='card-"+id+"'>"+text+"</div>"));
    $("#card-"+id).hover(function () {
        $(this).css('margin-top', '-20px');
        $(this).css('z-index', 1000);
    }, function () {
        adjust_hand_sizing();
    });
}


function request_board_state(re) {
    $.get("/cah/board_state", {
        "pid": pid,
    }, function(state) {
        on_board_state(state);
        if (re)
            setTimeout(request_board_state(re), re);
    });
}

function on_board_state(state) {
    state = JSON.parse(state);
    if (state.error == "ok") {

    } else {
        console.log(state.error);
        console.log(state);
    }
}

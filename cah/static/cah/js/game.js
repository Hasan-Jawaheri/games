
var latest_state = {};
var cur_selection = [];
var locked_cards = false;
var judge_selection = "";

String.prototype.replaceAll = function(search, replacement) {
    var target = this;
    return target.replace(new RegExp(search, 'g'), replacement);
};

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
        request_board_state();
        //on_board_state(message.data);
    };

    request_board_state(5000);
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

function clear_hand() {
    $("#hand")[0].innerHTML = "";
}

function add_card_to_hand(id, text) {
    $("#hand").append($("<div class='card noselect' id='card-"+id+"'>"+text+"</div>"));
    $("#card-"+id).hover(function () {
        $(this).css('margin-top', '-20px');
        $(this).css('z-index', 1000);
    }, function () {
        adjust_hand_sizing();
    });
    $("#card-"+id).click(function() {
        if (locked_cards)
            return;

        if (cur_selection.indexOf(id) >= 0) {
            cur_selection.splice(cur_selection.indexOf(id), 1);
            $("#card-"+id).removeClass('selected-card');
            $("#card-"+id).css('background-color', '#fafafa');
        } else {
            if (cur_selection.length < latest_state.takes) {
                cur_selection.push(id);
                $("#card-"+id).addClass('selected-card');
                $("#card-"+id).css('background-color', '#627894');
            }
        }

        $("#current-play-card-top")[0].innerHTML = latest_state.black_card;
        update_current_play($("#current-play-card-top"), cur_selection);
    });
}

function update_hand(hand) {
    var cards_jq = $("#hand > .card");
    var card_ids = [];

    // remove cards that aren't supposed to be there
    for (var i = 0; i < cards_jq.length; i++) {
        var id = parseInt(cards_jq[i].id.slice("card-".length));
        var found = false;
        for (var j = 0; j < hand.length; j++)
            if (id == hand[j].id)
                found = true;
        if (!found) {
            $(cards_jq[i]).remove();
            if (cur_selection.indexOf(id) >= 0)
                cur_selection.splice(cur_selection.indexOf(id), 1);
        } else
            card_ids.push(id);
    }

    // add cards that aren't already in hand
    for (var i = 0; i < hand.length; i++)
        if (card_ids.indexOf(hand[i].id) == -1)
            add_card_to_hand(hand[i].id, hand[i].text);

    adjust_hand_sizing();
}

function update_scoreboard(scoreboard, myname, judge) {
    var sb_list = $("#scoreboard-list > ul");
    sb_list[0].innerHTML = "";
    for (var i = 0; i < scoreboard.length; i++) {
        var status = i == judge ? "glyphicon glyphicon-eye-open" : ((scoreboard[i].locked.length > 0 || scoreboard[i].locked > 0) ? "glyphicon glyphicon-ok" : "glyphicon glyphicon-remove");
        var judge = i == judge ? "list-group-item-danger" : "";
        if (scoreboard[i].name == myname)
            judge += " play-inline";
        var code = "<li class='list-group-item "+judge+"'>"+"<span class='"+status+"'/> "+scoreboard[i].name+" <span class='badge badge-info'>"+scoreboard[i].score+"</span></li>";
        sb_list.append(code);
    }
}

function set_player_state(black_card, takes) {
    $("#current-play").css("display", "block");
    $("#judge-board").css("display", "none");

    judge_selection = "";
    $("#card-in-play")[0].innerHTML = black_card;
    $("#current-play-card-top")[0].innerHTML = black_card;
    update_current_play($("#current-play-card-top"), cur_selection);
}

function update_current_play(playcard, selection, texts = undefined) {
    var html = $(playcard)[0].innerHTML;
    var num_dashes = (html.match(/_____/g) || []).length;
    var cur_sel = JSON.parse(JSON.stringify(selection));

    if (!texts) {
        texts = {};
        for (var i = 0; i < cur_sel.length; i++)
            texts[cur_sel[i]] = $("#card-"+cur_sel[i])[0].innerHTML
        }

    while (num_dashes > 0 && cur_sel.length > 0) {
        var card_text = texts[cur_sel[0]];
        if (card_text.search("<b>") >= 0) {
            card_text = card_text.slice(3, card_text.search("</b>"));
        }
        var code = "<span class='play-inline'>" + card_text + "</span>";
        html = html.replace("_____", code);
        cur_sel.splice(0, 1);
        var num_dashes = (html.match(/_____/g) || []).length;
    }

    for (var i = 0; i < cur_sel.length; i++) {
        html += "<p>" + texts[cur_sel[i]] + "</p>";
    }

    $(playcard)[0].innerHTML = html;
}

function set_judge_state(black_card, players, myname) {
    $("#judge-board").css("display", "block");
    $("#current-play").css("display", "none");

    $("#card-in-play")[0].innerHTML = black_card;

    var all_players_finished = true;
    for (var i = 0; i < players.length; i++) {
        if (players[i].locked.length == 0 && players[i].name != myname)
            all_players_finished = false;
    }

    if (!all_players_finished) {
        $("#judge-card-top")[0].innerHTML = "Waiting for all players to lock in their cards...";
    } else {
        $("#judge-card-top")[0].innerHTML = "";
        for (var i = 0; i < players.length; i++) {
            if (players[i].name != myname) {
                var button_code =
                    "<button class='btn btn-default btn-block judge-button'>" +
                        players[i].name +
                    "</button>";
                var button = $(button_code);
                var player = players[i];
                button.click(function () {
                    var player = undefined;
                    for (var p = 0; p < latest_state.players.length; p++)
                        if (latest_state.players[p].name == this.innerText)
                            player = latest_state.players[p];
                    judge_selection = player.name;
                    $("#card-in-play")[0].innerHTML = latest_state.black_card;
                    var texts = {};
                    for (var j = 0; j < player.locked.length; j++) {
                        texts[player.locked[j].id] = player.locked[j].text;
                    }
                    update_current_play($("#card-in-play"), Object.keys(texts), texts);
                    $(".judge-button").removeClass('active');
                    $(this).addClass('active');
                });
                $("#judge-card-top").append(button);
                if (judge_selection == player.name)
                    button.trigger('click');
            }
        }
    }
}

function unlock_cards() {
    locked_cards = false;
    $("#current-play-card-bottom").removeAttr("disabled");
    $("#current-play-card-bottom")[0].innerHTML = "Lock cards!";
}

function lock_cards() {
    if (cur_selection.length == latest_state.takes) {
        locked_cards = true;
        $("#current-play-card-bottom")[0].disabled = "disabled";
        $("#current-play-card-bottom")[0].innerHTML = "Waiting for judge...";
        $.get("/cah/submit_play", {
            "pid": pid,
            "play": JSON.stringify(cur_selection),
        }, function (resp) {
            resp = JSON.parse(resp);
            if (resp.status != "mmkay") {
                unlock_cards();
                alert(resp);
            } else {
                // successfully played this turn..
            }
        });
    }
}

function select_winner() {
    var selected = $("button.judge-button.active");
    if (selected.length == 0) {
        return;
    }

    $.get("/cah/select_winner", {
        "pid": pid,
        "winner": selected[0].innerText
    }, function () {
    });
}

function request_board_state(re) {
    $.get("/cah/board_state", {
        "pid": pid,
    }, function(state) {
        on_board_state(state);
        if (re) {
            setTimeout(function () {request_board_state(re)}, re);
        }
    });
}

function on_board_state(state) {
    var board = JSON.parse(state);
    if (board.status == "ok") {
        board.black_card = board.black_card.replaceAll("_", "_____");
        if (board.judge != latest_state.judge)
            unlock_cards();
        latest_state = board;
        update_hand(board.hand);
        update_scoreboard(board.players, board.you, board.judge);
        if (board.you == board.players[board.judge].name) { // I'm the judge...
            set_judge_state(board.black_card, board.players, board.you);
        } else { // I'm not the judge...
            set_player_state(board.black_card, board.takes);
        }
    } else {
        console.log(board);
    }
}

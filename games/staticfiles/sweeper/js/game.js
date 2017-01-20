var board_x = 20;
var board_y = 20;
var board_state = [];
var myturn = false;
var is_over = false;
var losername = "";
var pid = 0;
var game_socket;

$(document).ready(function () {
    document.getElementById("board").oncontextmenu = function(e){ e.preventDefault();}

    var elems = "";
    for (var y = 0; y < board_y; y++) {
        elems += "<div id='row_" + y + "' class='board_row'>";
        for (var x = 0; x < board_x; x++) {
            elems += "<div id='sq_" + x + "_" + y + "' class='box' onclick='check_box("+x+","+y+")' oncontextmenu='flag_box("+x+","+y+")'></div>";
            board_state.push(0);
        }
        elems += "</div>";
    }
    $("#board")[0].innerHTML += elems;

    pid = $("#pid")[0].innerHTML;


    var ws_scheme = window.location.protocol == "https:" ? "wss" : "ws";
    game_socket = new ReconnectingWebSocket(ws_scheme + '://' + window.location.host + "/game/" + sessionKey);
    game_socket.onmessage = function(message) {
        on_board_state(message.data);
    };

    request_board_state();
});

function check_box(x, y) {
    var state = board_state[y*board_x+x];
    if (state == 0 && myturn) {
        myturn = false;
        $("#sq_"+x+"_"+y).removeClass("flagged");
        $.get('/sweeper/check_box',
        {
            "x": x,
            "y": y,
            "pid": pid
        }, function(state) {
            myturn = true;
            on_board_state(state);
        });
    }
}

function flag_box(x, y) {
    if (is_over)
        return true;

    if (board_state[y*board_x+x] == 0)
        $("#sq_"+x+"_"+y).toggleClass("flagged");

    return false;
}

function request_board_state(re) {
    if (is_over) {
        if (losername.length > 0)
            $("#turn")[0].innerHTML = losername + " lost!";
        else
            $("#turn")[0].innerHTML = "The bombs have been found!";
        $("#turn").removeClass('yourturn');
        $("#turn").removeClass('someonelost');
        $("#turn").addClass('stabilized');
        return;
    }
    $.get("/sweeper/board_state", {
            "pid": pid,
        }, function(state) {
            on_board_state(state);
            if (re) {
                setTimeout(request_board_state(re), re);
            }
        });
}

function on_board_state(state) {
    if (state == "ok")
        return;

    try {
        state = JSON.parse(state);
    } catch(err) {
        console.log(err.message);
        return;
    }

    if (state["error"] != 0) {
        console.log("Server error: " + state["error"]);
        return;
    }

    if (state["turn"] == myName) {
        $("#turn")[0].innerHTML = "Your turn!";
        $("#turn").addClass('yourturn');
        myturn = true;
    } else {
        $("#turn")[0].innerHTML = state["turn"] + "'s turn";
        $("#turn").removeClass('yourturn');
        myturn = false;
    }

    for (var y = 0; y < board_y; y++) {
        for (var x = 0; x < board_x; x++) {
            var s = state["board"][y*board_x+x];
            board_state[y*board_x+x] = 0;
            if (s != "x") {
                board_state[y*board_x+x] = 1;
                $("#sq_"+x+"_"+y).addClass("empty");
                $("#sq_"+x+"_"+y).removeClass("flagged");
                if (parseInt(s) > 0) {
                    $("#sq_"+x+"_"+y)[0].innerHTML = s;
                }
            }
        }
    }

    if (state["bombs"] != "") {
        is_over = true;
        losername = state["loser"];
        for (var y = 0; y < board_y; y++) {
            for (var x = 0; x < board_x; x++) {
                var s = state["bombs"][y*board_x+x];
                if (s == "1") {
                    $("#sq_"+x+"_"+y).addClass("bomb");
                    $("#sq_"+x+"_"+y).removeClass("flagged");
                }
            }
        }
    }

    if (state["over"] == 1) {
        is_over = true;
        losername = "";
    }
}

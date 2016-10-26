var board_x = 20;
var board_y = 20;
var board_state = [];
var myturn = false;
var is_over = false;
var losername = "";
var pid = 0;

$(document).ready(function () {
    document.getElementById("board").oncontextmenu = function(e){ e.preventDefault();}
    // Ajax setup to forward the CSRF token
    $.ajaxSetup({
        beforeSend: function (xhr, settings) {
            // generate CSRF token using jQuery
            var csrftoken = $.cookie('csrftoken');
            if (!(/^http:.*/.test(settings.url) || /^https:.*/.test(settings.url))) {
                // Only send the token to relative URLs i.e. locally.
                xhr.setRequestHeader("X-CSRFToken", csrftoken);
            }
        }
    });

    $('#signInModal').on('shown.bs.modal', function () {
        $('#login_text').focus();
    });

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
    setInterval(function() {
        if (is_over) {
            $("#turn")[0].innerHTML = losername + " lost!";
            $("#turn").removeClass('yourturn');
            $("#turn").addClass('someonelost');
            return;
        }
        $.get("/sweeper/board_state",
            {
                "pid": pid,
            }, function(state) {
                state = JSON.parse(state);
                if (state["turn"] == "") {
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
                        if (s != "x") {
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
            });
    }, 2000);
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
        }, function(data) {
            if (data[0] == "/") {
                if (data[1] == "0") {
                    // not a bomb!
                    $("#sq_"+x+"_"+y).addClass("empty");
                } else {
                    // found a bomb!
                    $("#sq_"+x+"_"+y).addClass("bomb");
                }
            }
        });
    }
}

function flag_box(x, y) {
    if (is_over)
        return true;

    $("#sq_"+x+"_"+y).toggleClass("flagged");

    return false;
}

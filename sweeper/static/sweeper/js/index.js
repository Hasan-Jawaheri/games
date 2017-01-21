
$(document).ready(function () {
    $('#signInModal').on('shown.bs.modal', function () {
        $('#login_text').focus();
    });
});


function new_game(url) {
    var name = $("#name")[0].value;
    if (name == "") {
        alert("Please enter your name!");
        return;
    }

    $.get('/sweeper/new_game',
    {
        "name": name,
    }, function (data) {
        location.href = data;
    });
}

function join_game(url) {
    var name = $("#name")[0].value;
    var session = $("#session")[0].value;

    if (name == "") {
        alert("Please enter your name!");
        return;
    }

    if (session == "") {
        alert("Please enter the session key!");
        return;
    }

    $.get('/sweeper/join_game',
    {
        "name": name,
        "session": session
    }, function (data) {
        location.href = data;
    });
}

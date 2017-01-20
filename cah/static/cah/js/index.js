
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

    $.get(url,
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

    $.get(url,
    {
        "name": name,
        "session": session
    }, function (data) {
        location.href = data;
    });
}

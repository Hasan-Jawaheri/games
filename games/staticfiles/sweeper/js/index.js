
$(document).ready(function () {
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
});


function new_game() {
    var name = $("#name")[0].value;
    if (name == "") {
        alert("Please enter your name!");
        return;
    }

    $.get('/sweeper/new_game/',
    {
        "name": name,
    }, function (data) {
        location.href = data;
    });
}

function join_game() {
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


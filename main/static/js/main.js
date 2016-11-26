var chat_socket;
var sessionKey;
var myName = "Layla";

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

  var sessionObj = $("#session-key");
  if (sessionObj) {
    sessionKey = sessionObj[0].innerHTML;
    var ws_scheme = window.location.protocol == "https:" ? "wss" : "ws";
    chat_socket = new ReconnectingWebSocket(ws_scheme + '://' + window.location.host + "/chat/" + sessionKey);
    chat_socket.onmessage = function(message) {
      var msg = JSON.parse(message.data);
      var html = "<div class='msg'><span class='sendername'>"+msg['sender']+": </span>"+msg['message']+"</div>";
      $("#chat-texts").append(html);
    };

    $("#chat-message").on('keyup', function (e) {
      if (e.keyCode == 13)
        send_chat_msg();
    });
  }
  var playerObj = $("#pname");
  if (playerObj) {
    myName = playerObj[0].innerHTML;
  }
});

function send_chat_msg() {
    console.log(chat_socket);
  var msg = $("#chat-message")[0].value;
  $("#chat-message")[0].value = "";

  if (chat_socket) {
    console.log("sending " + msg);
    chat_socket.send(JSON.stringify({
      'sender': myName,
      'handle': sessionKey,
      'message': msg
    }));
  }
}

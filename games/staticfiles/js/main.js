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
  if (sessionObj.length) {
    sessionKey = sessionObj[0].innerHTML;
    var ws_scheme = window.location.protocol == "https:" ? "wss" : "ws";
    chat_socket = new ReconnectingWebSocket(ws_scheme + '://' + window.location.host + "/chat/" + sessionKey);
    chat_socket.onmessage = function(message) {
      var msg = JSON.parse(message.data);
      var html = "<div class='msg'><span class='sendername'>"+msg['sender']+": </span>"+msg['message']+"</div>";
      var chattexts = $("#chat-texts");
      chattexts.append(html);
      chattexts[0].scrollTop = chattexts[0].scrollHeight;
    };

    $("#chat-message").on('keyup', function (e) {
      if (e.keyCode == 13)
        send_chat_msg();
    });
  }
  var playerObj = $("#pname");
  if (playerObj.length) {
    myName = playerObj[0].innerHTML;
  }
});

function send_chat_msg() {
  var msg = $("#chat-message")[0].value;
  $("#chat-message")[0].value = "";

  if (chat_socket && msg.length > 0 ) {
    chat_socket.send(JSON.stringify({
      'sender': myName,
      'session': sessionKey,
      'message': msg
    }));
  }
}

chrome.runtime.onConnect.addListener(
  function(port) {
    console.log("Script connected: " + port.name);
    port.onMessage.addListener(function(msg) {
        console.log("Message received from "+ port.name);
        if (msg.length > 0) {
          console.log(msg);
          har = buildHar(msg);
          console.log(har);
        }
        else {
          console.log("empty message");
          return;
        }
        var bytes = [];
        for (var i = 0; i < har.length; i++) {
          bytes.push(har.charAt(i));
        }
        var blob = new Blob(bytes, {type: 'application/json'});
        var objectURL = URL.createObjectURL(blob);
        var link = document.createElement("a");
        link.download = "capture.har";
        link.href = objectURL;
        link.click();
        port.postMessage("Response from background");
    });
  });

function buildHar(packets) {
  var har = {};
  har.log = {
    "version": "1.2",
    "creator": {"name": "VASTly", "version":"1.0.0"},
    "browser": {"name": "Chrome", "version":"38"}
    };
  var entries = [];
  $.each(packets, function(index, object) {
    var packet = object.packet;
    console.log(object.datetime);
    packet.startedDateTime = object.datetime;
    entries.push(packet);
  });
  har.log.entries = entries;
  return JSON.stringify(har);
}
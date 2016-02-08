chrome.runtime.onConnect.addListener(
  function(port) {
    console.log("Script connected: " + port.name);
    port.onMessage.addListener(function(msg) {
        console.log("Message received from "+ port.name);
        console.log(msg);
        port.postMessage("Response from background");
    });
  });
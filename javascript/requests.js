(function() {

function listen() {
  var reloadButton = document.querySelector('.mybutton');
  chrome.devtools.inspectedWindow.eval('console.log("Page listener called...")');
  reloadButton.addEventListener('click', function() {tree(); chrome.devtools.inspectedWindow.eval('console.log("'+reloadButton.innerHTML+'")'); reloadButton.innerHTML ="Test"; chrome.devtools.inspectedWindow.eval('console.log("'+reloadButton.innerHTML+'")');});
}

window.addEventListener('load', listen);
chrome.devtools.inspectedWindow.eval('console.log("Listener added...")');
})();

function tree() {
  console.log("Tree called");

  $('#jstree_demo').jstree({
    "core" : {
      "animation" : 0,
      "check_callback" : true,
      "themes" : { "stripes" : true },
      'data' : {
	    "url" : "./root.json",
		"dataType" : "json" // needed only if you do not supply JSON headers
	  }
    }
  });
}
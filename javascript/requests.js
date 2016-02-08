var count = 1;

var port = chrome.runtime.connect({name: "requests"});

port.onMessage.addListener(function(msg) {
  console.log("Listener on request: " + msg);
});


var total_width = window.innerWidth;
$( document ).ready(function() {
  console.log("Doc is ready");
  $("#leftpane").resizable({
      handles: "e",
      create: function( event, ui ) {
      // Prefers an another cursor with two arrows
        $(".ui-resizable-e").css("cursor","ew-resize");
        $(".ui-resizable-e").css("width","15px");
      }
  }).bind( "resize", resize_other);
});

function resize_other(event, ui) {
    var width = $("#leftpane").width();
    
    if(width > total_width) {
        width = total_width;
        
        $('#leftpane').css('width', width);
    }
    
    $('#rightpane').css('width', (total_width - width));
}

(function() {

function listen() {
  
  var reloadButton = document.querySelector('.mybutton');
  console.log("Page listener called...");
  reloadButton.addEventListener('click', function() {tree();});
  
  var backgroundButton = document.querySelector('.backgroundButton');
  backgroundButton.addEventListener('click', function() {
    console.log("Background clicked");
    port.postMessage({joke: "Knock knock"});
  });
  
  var treeButton = document.querySelector('.addTreeButton');
  treeButton.addEventListener('click', function() {
      console.log("Clear button clicked");
      var the_tree = $('#jstree_demo').jstree(true);
      var nodes = the_tree.get_children_dom ("1");
      jQuery.each(nodes, function(i, val) {the_tree.delete_node(val);});
      count = 1;
    });
  
  chrome.devtools.network.onRequestFinished.addListener(
    function(request) {
      var the_tree = $('#jstree_demo').jstree(true);
      console.log("Tree: " + the_tree);
      count++;
      node_id = the_tree.create_node("1",{'id':count, 'text':(count-1)+' '+request.request.url});
      //the_tree.get_node(node_id).css("color","red");
      the_tree.open_node("1");
    }
  );
}

window.addEventListener('load', listen);
console.log("Listener added...")
})();

function tree() {
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
  console.log("Tree created");
}
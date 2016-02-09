var count = 1;
var total_width;

var port = chrome.runtime.connect({name: "requests"});
port.onMessage.addListener(function(msg) {
  console.log("Listener on request: " + msg);
});

$( window ).resize(function() {
  if (total_width != window.innerWidth) {
    console.log("Window resizing to " + window.innerWidth)
    total_width = window.innerWidth;
  }
});

$( document ).ready(function() {
  console.log("Doc is ready");
  total_width = window.innerWidth;
  
  $("#leftpane").resizable({
      handles: "e",
      create: function( event, ui ) {
      // Prefers an another cursor with two arrows
        $(".ui-resizable-e").css("cursor","ew-resize");
        $(".ui-resizable-e").css("width","15px");
      }
  }).bind( "resize", resize_other);
  
  tree();
  $('#jstree').on("select_node.jstree", function (e, data) { $('#rightpane').show(); $('#numfield').text(data.node.id-1); $('#urlfield').text(data.node.text); });
  $('#tabs').tabs();
  
  $('.addTreeButton').click(function() {
    console.log("Clear button clicked");
    var the_tree = $('#jstree').jstree(true);
    var nodes = the_tree.get_children_dom ("1");
    jQuery.each(nodes, function(i, val) {the_tree.delete_node(val);});
    count = 1;
  });
  
  $('.header').click(function(event) {
    console.log("expanding " + $(this));
    $('#collapsed').toggle();
    $(this).toggleClass('open');
  });
  
  var backgroundButton = document.querySelector('.backgroundButton');
  $('.backgroundButton').click(function() {
    console.log("Background clicked");
    port.postMessage({joke: "Knock knock"});
  });
});

$(window).load(function() {
  chrome.devtools.network.onRequestFinished.addListener(function(request) {
    var the_tree = $('#jstree').jstree(true);
    console.log("Tree: " + the_tree);
    count++;
    node_id = the_tree.create_node("1",{'id':count, 'text':(count-1)+' '+request.request.url});
    //the_tree.get_node(node_id).css("color","red");
    the_tree.open_node("1");
  });  
});



function resize_other(event, ui) {
    var width = $("#leftpane").width();
    
    if(width > total_width) {
        width = total_width;
        
        $('#leftpane').css('width', width);
    }
    
    $('#rightpane').css('width', (total_width - width));
}

function tree() {
  $('#jstree').jstree({
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
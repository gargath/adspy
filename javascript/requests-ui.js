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
  $('#jstree').on("select_node.jstree", function (e, data) {
    if (data.node.id != 1) {
      var req = findRequestById(data.node.id).raw_request;
      console.log("Request is:");
      console.log(req);
      $('#rightpane').show();
      $('#numfield').text(req.id);
      $('#urlfield').text(req.request.url);
      req.getContent(function(content, encoding) {
        if (!encoding) {
          console.log("Setting new codemirror content");
          myCodeMirror.swapDoc(CodeMirror.Doc(content, req.response.content.mimeType));
        }
        else {
          console.log("Content is encoded. Clearing codemirror document.");
          myCodeMirror.swapDoc(CodeMirror.Doc(""));
        }
      });
    }
  });

  var myCodeMirror = CodeMirror(document.getElementById("tabs-2"), {
    value: "function myScript(){return 100;}\nreturn;\n",
    mode:  "javascript",
    lineNumbers: true,
    lineWrapping: true,
    readOnly: true,
    styleActiveLine: true,
  });

  $('#tabs').tabs({
    activate: function(event, ui) {
      console.log(event);
      if (event.currentTarget.hash == "#tabs-2") {
        myCodeMirror.refresh();
      }
    }
  });
  
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
    port.postMessage({joke: "Knock knock"});;
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
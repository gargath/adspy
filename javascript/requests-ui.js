// Global Variables
var total_width;
var port;
var codemirrorPane;

//Set up Background Page connection
port = chrome.runtime.connect({name: "requests"});
port.onMessage.addListener(function(msg) {
  console.log("Listener on request: " + msg);
});

//Update total_width on widnow resize
$( window ).resize(function() {
  if (total_width != window.innerWidth) {
    total_width = window.innerWidth;
    $("body").css('height', window.innerHeight-20);
  }
});


//Doc Ready
$( document ).ready(function() {
  total_width = window.innerWidth;
  $("body").css('height', window.innerHeight-20);
      
  //Make pane resizable
  $("#leftpane").resizable({
      handles: "e",
      create: function( event, ui ) {
      // Prefers an another cursor with two arrows
        $(".ui-resizable-e").css("cursor","ew-resize");
        $(".ui-resizable-e").css("width","15px");
      }
  }).bind( "resize", resize_other);
  
  //Build initial tree
  tree();
  
  //Add click handler to tree node elements
  $('#jstree').on("select_node.jstree", function (e, data) {
    var req = findRequestById(data.node.id);
    console.log("Request is:");
    console.log(req);
    if ($( "#rightpane" ).is( ":hidden" )) {
      $('#rightpane').show();
      $('#tabs').tabs({active: 1});
    }
    
    $('#urlfield').text(req.raw_request.request.url);
    $('#methfield').text(req.raw_request.request.method);
    $('#statusfield').text(req.raw_request.response.status + " " + req.raw_request.response.statusText);
    if (req.warning) {
      $("#warning_label").show();
      $("#warning_field").show();
      $("#warning_field").text(req.warning);
    }
    else {
      $("#warning_label").hide();
      $("#warning_field").hide();
    }
    
    $("#responseheaders").empty();
    $("#requestheaders").empty();
    $.each(req.raw_request.response.headers, function(index, header) {
      $("#responseheaders").append(
        "<span class=\"fieldlabel\">"+header.name+"</span> <span class=\"datafield\" id=\"header_"+index+"_field\">"+header.value+"</span><br/>"
      )
    });
    $.each(req.raw_request.request.headers, function(index, header) {
      $("#requestheaders").append(
        "<span class=\"fieldlabel\">"+header.name+"</span> <span class=\"datafield\" id=\"header_"+index+"_field\">"+header.value+"</span><br/>"
      )
    });
    
    req.raw_request.getContent(function(content, encoding) {
      if (!encoding) {
        //TODO: Check for supported mime type before setting up document
        console.log("Setting new codemirror content");
        codemirrorPane.swapDoc(CodeMirror.Doc(content, req.raw_request.response.content.mimeType));
      }
      else {
        console.log("Content is encoded. Clearing codemirror document.");
        codemirrorPane.swapDoc(CodeMirror.Doc(""));
      }
      codemirrorPane.refresh();
    });
  });

  //Set up codemirror for response view
  codemirrorPane = CodeMirror(document.getElementById("tabs-2"), {
    value: "empty\n",
    mode:  "javascript",
    lineNumbers: true,
    lineWrapping: true,
    readOnly: true,
    styleActiveLine: true,
    scrollbarStyle: "overlay"
  });

  //Create tabs for right pane
  $('#tabs').tabs({
    active: 1,
    activate: function(event, ui) {
      if ((event.currentTarget) && (event.currentTarget.hash == "#tabs-2")) {
        codemirrorPane.refresh();
      }
      else if ((event.currentTarget) && (event.currentTarget.hash == "#tabs-0")) {
        $('#rightpane').hide();
      }
    }
  });
  
  //Add click handler to button
  $('#clearbutton').click(function() {
    console.log("Clear button clicked");
    var the_tree = $('#jstree').jstree(true);
    var nodes = the_tree.get_children_dom ("#");
    jQuery.each(nodes, function(i, val) {the_tree.delete_node(val);});
    traffic.length = 0;
    preliminary.length = 0;
    watchlist.length = 0;
    the_tree.create_node("#",{'id':'prelim', 'text':'Pending Requests', 'state':{'opened':'true'}});
  });
  
  $('#dumpbutton').click(function() {
    console.log("Traffic Dump!");
    console.log(traffic);
  });
  
  //Add click handler to expandable header
  $('.header').click(function(event) {
    console.log("expanding " + $(this));
    $('.collapsed', $(this).parent()).toggle();
    $(this).toggleClass('open');
  });
  
  //TEMP: Background button
  var backgroundButton = document.querySelector('.backgroundButton');
  $('.backgroundButton').click(function() {
    console.log("Background clicked");
    port.postMessage({joke: "Knock knock"});
    var node = $('#jstree').jstree(true).get_node("3", true);
    console.log($(node));
    $(node).addClass("redtext");
    $('#jstree').jstree(true).get_node(node).li_attr["class"] += " redtext";
    $('#jstree').jstree(true).redraw();
  });
  
});

//Helper function for pane resize
function resize_other(event, ui) {
    var width = $("#leftpane").width();
    
    if(width > total_width) {
        width = total_width;
        
        $('#leftpane').css('width', width);
    }
    
    $('#rightpane').css('width', (total_width - width));
}

//Helper function for building initial tree
function tree() {
  $('#jstree').jstree({
    "core" : {
      "animation" : 0,
      "check_callback" : true,
      "themes" : { "stripes" : true }
    },
    "types" : {
      "warn" : {
        "icon" : "fa fa-exclamation-triangle adspy_warn"
      },
      "okay" : {
        "icon" : "fa fa-check-circle adspy_ok"
      }
    },
    "plugins" : [ "types" ]
  });
  $('#jstree').jstree(true).create_node("#",{'id':'prelim', 'text':'Pending Requests', 'state':{'opened':'true'}, "type" : "warn"});
}
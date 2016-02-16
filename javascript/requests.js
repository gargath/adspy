var count = 1;

var traffic = [];
var watchlist = [];

var the_tree;

$(window).load(function() {

  the_tree = $('#jstree').jstree(true);
      
  chrome.devtools.network.onRequestFinished.addListener(function(request) {
    
    if (request.request.httpVersion == "unknown") {
      //preliminary request. will handle later.
        return;
    }
              
    var wl_index = findWatchlistIndexByURL(request.request.url);
    if (wl_index) {
      if (watchlist[wl_index].status == "okay") {
        //TODO: Handle dupes properly, according to type
        console.log("Duplicate request spotted: " + request.request.url);
      }
      else if (request.response.status == 200) {        //style
        the_tree.get_node(watchlist[wl_index].treenode, true).addClass("adspy_ok");
        the_tree.get_node(watchlist[wl_index].treenode).li_attr["class"] = the_tree.get_node(watchlist[wl_index].treenode).li_attr["class"].replace(/ adspy_.*\b/g," ");
        the_tree.get_node(watchlist[wl_index].treenode).li_attr["class"] += " adspy_ok";
        watchlist[wl_index] = {treenode: watchlist[wl_index].treenode, url: watchlist[wl_index].url, status: "okay"};
        traffic.push({id: watchlist[wl_index].treenode, raw_request: request});
      }
      else {
        console.log("Failed request?");
        //TODO: Handle failures
        console.log(request);
      }
    }
    
    var content_type = getContentType(request);
    if (content_type && content_type.indexOf("text/xml") >= 0) {
      console.log(request);
      request.getContent(function(content, encoding) {
        try {
          parsedXML = $.parseXML(content);
        }
        catch (err) {
          console.log("Invalid XML in text/xml response.");
          return;
        }
        if ($(parsedXML.children[0]).prop("tagName") == "VAST") {
          vast_node_id = the_tree.create_node("#",{'text':'[VAST] '+request.request.url, 'state':{'opened':'true'}});
          traffic.push({id: vast_node_id, raw_request: request});
          the_tree.get_node(vast_node_id, true).addClass("adspy_ok");
          the_tree.get_node(vast_node_id).li_attr["class"] += " adspy_ok";
          handleVAST($(parsedXML.children), "#");
        }
        console.log(watchlist);
        console.log(traffic);
      });
    }
  });  
});


function findWatchlistIndexByURL(url) {
  var ret;
  $.each(watchlist, function(index, entry) {
    if (entry.url == url) {
        ret = index;
    }
  });
  return ret;
}

function findRequestById(key) {
    return traffic.filter(function(element) {return element.id == key;})[0];
}

function getContentType(request) {
  var obj = request.response.headers.filter(function(element, index, array) {
      if (element.name.toLowerCase() == "content-type") { return true; }
      else { return false; }
  })[0];
  if (obj) { return obj.value }
  else { return undefined; }
}

function handleVAST(nodeSet, parent_node_id) {
  nodeSet.each(function(i) {
    tagname = $(nodeSet[i]).prop("tagName").toUpperCase();
    if ((tagname == "CREATIVES") || (tagname == "MEDIAFILES") || (tagname == "TRACKINGEVENTS") || (tagname == "VIDEOCLICKS")) {
      node_id = the_tree.create_node(parent_node_id,{ 'text':'['+tagname+']', 'state':{'opened':'true'}});
    }
    else if (tagname == "ERROR" || tagname == "IMPRESSION") {
      error_node_id = the_tree.create_node(parent_node_id, {'text':'['+tagname+']'});
      node_id = the_tree.create_node(error_node_id,{ 'text':$(nodeSet[i]).text()});
      the_tree.open_node(the_tree.get_parent(node_id));
      expectURL(node_id, $(nodeSet[i]).text());
    }
    else if (tagname == "TRACKING") {
      node_id = the_tree.create_node(parent_node_id,{ 'text':'['+$(nodeSet[i]).attr("event")+'] '+$(nodeSet[i]).text()});
      expectURL(node_id, $(nodeSet[i]).text());
    }
    else if (tagname == "CLICKTHROUGH") {
      node_id = the_tree.create_node(parent_node_id,{ 'text':'[CLICKTHROUGH] '+$(nodeSet[i]).text()});
      expectURL(node_id, $(nodeSet[i]).text());
    }
    else if (tagname == "MEDIAFILE") {
      var type = ($(nodeSet[i]).attr("type")) ? $(nodeSet[i]).attr("type") : "unknown";
      node_id = the_tree.create_node(parent_node_id,{ 'text':'['+type+'] '+$(nodeSet[i]).text()});
      expectURL(node_id, $(nodeSet[i]).text());
    }
    else {
      node_id = parent_node_id;
    }
    handleVAST($(nodeSet[i].children), node_id);
  });
}

function expectURL(tree_node_id, url) {
    watchlist.push({treenode: node_id, url: url, status: "expect"});
    $('#jstree').jstree(true).get_node(tree_node_id, true).addClass("adspy_expect");
    $('#jstree').jstree(true).get_node(tree_node_id).li_attr["class"] += " adspy_expect";
}

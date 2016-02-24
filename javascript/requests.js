var count = 1;

var traffic = [];
var watchlist = [];
var preliminary = [];

Array.observe(traffic, function(update) {
  for (var i = 0; i < update[0].addedCount; i++) {
    var req = update[0].object[update[0].index+i].raw_request.request;
    var res = update[0].object[update[0].index+i].raw_request.response;
    $('#timeline_table').append("<tr id=\"tb_"+update[0].object[update[0].index+i].id+"\"><td class=\"url_td\">"+req.url+"</td><td>"+res.status+"</td><td>"+req.method+"</td></tr>");
  }

});

var the_tree;

$(window).load(function() {

  the_tree = $('#jstree').jstree(true);
      
  chrome.devtools.network.onRequestFinished.addListener(function(request) {
    
    if (request.response.status == 0) {
      node_id = the_tree.create_node('prelim', {'text':request.request.url});
      preliminary.push({id: node_id, raw_request: request});
      return;
      
    }
    else {
      var prelim_index = findListIndexByURL(preliminary, request.request.url);
      if (prelim_index > -1) {
        the_tree.delete_node(preliminary[prelim_index].id);
        preliminary.splice(prelim_index, 1);
      }
    }
    
    var wl_index = findListIndexByURL(watchlist, request.request.url);
    if (wl_index > -1) {
      if (watchlist[wl_index].status == "okay") {
        //TODO: Handle dupes properly, according to type
        console.log("Duplicate request spotted: " + request.request.url);
      }
      else if (request.response.status >= 200 && request.response.status < 400) {
        $.each(watchlist[wl_index].treenode, function(nodeindex, node) {
          the_tree.get_node(node, true).removeClass("adspy_expect");        
          the_tree.get_node(node).li_attr["class"] = the_tree.get_node(node).li_attr["class"].replace(/ adspy_.*\b/g," ");
        });
        if (request.request.url == watchlist[wl_index].url) {
          $.each(watchlist[wl_index].treenode, function(nodeindex, node) {
            the_tree.get_node(node, true).addClass("adspy_ok");
            the_tree.get_node(node).li_attr["class"] += " adspy_ok";
          });
          watchlist[wl_index].status =  "okay";
          traffic.push({id: watchlist[wl_index].treenode, raw_request: request});
        }
        else {
          var additional_params = request.request.url.replace(watchlist[wl_index].url, "");
          $.each(watchlist[wl_index].treenode, function(nodeindex, node) {
            the_tree.get_node(node, true).addClass("adspy_warn");
            the_tree.get_node(node).li_attr["class"] += " adspy_warn";
            the_tree.set_type(the_tree.get_node(node), "warn");
          });
          watchlist[wl_index].statut = "warn";
          traffic.push({id: watchlist[wl_index].treenode, raw_request: request, warning: "Request was executed with additional query parameters: " + additional_params});
        }
        
      }
      else {
        console.log("Failed request?");
        console.log(request);
        $.each(watchlist[wl_index].treenode, function(nodeindex, node) {        
          the_tree.get_node(node, true).removeClass("adspy_expect");
          the_tree.get_node(node, true).addClass("adspy_error");
          the_tree.get_node(node).li_attr["class"] = the_tree.get_node(node).li_attr["class"].replace(/ adspy_.*\b/g," ");
          the_tree.get_node(node).li_attr["class"] += " adspy_error";
        });
        watchlist[wl_index].status = "error";
        traffic.push({id: watchlist[wl_index].treenode, raw_request: request});
      }
      $.each(watchlist[wl_index].treenode, function(nodeindex,node) {
        var opening_node_id = the_tree.get_parent(node);
        while (the_tree.get_parent(opening_node_id) != '#') {
          the_tree.open_node(opening_node_id);
          opening_node_id = the_tree.get_parent(opening_node_id);
        }
      });
    }
    else if (request.response.status >= 400) {
      console.log("Failed request?");
      console.log(request);
      node_id = the_tree.create_node('prelim', {'text':request.request.url});
      the_tree.get_node(node_id, true).addClass("adspy_error");
      the_tree.get_node(node_id).li_attr["class"] += " adspy_error";
      traffic.push({id: node_id, raw_request: request});
    }
    
    var content_type = getContentType(request);
    if (content_type && content_type.indexOf("text/xml") >= 0) {
      request.getContent(function(content, encoding) {
        if (encoding) {
            console.log("Base64 response. Will handle later...");
            return;
        }
        var parsedXML;
        try {
          parsedXML = $.parseXML(content);
        }
        catch (err) {
          console.log("Invalid XML in text/xml response.");
          return;
        }
        if ($(parsedXML.children[0]).prop("tagName") == "VAST") {
          vast_node_id = the_tree.create_node("#",{'text':'[VAST] '+request.request.url, 'state':{'opened':'true'}, 'type' : 'okay'});
          the_tree.move_node(the_tree.get_node('prelim'), '#', 'last');
          traffic.push({id: vast_node_id, raw_request: request});
          handleVAST($(parsedXML.children), vast_node_id);
        }
      });
    }
    else if (content_type && content_type.indexOf("application/json") >=0) {
      request.getContent(function(content, encoding) {
        var vptp;
        try {
          vptp = JSON.parse(content);
        }
        catch (err) {
          console.log("Invalid JSON in application/json response.");
          return;
        }
        if (vptp.insertionPoint) {
          console.log("Parsed response:");
          console.log(vptp);
          vptp_node_id = the_tree.create_node("#",{'text':'[VPTP] '+request.request.url, 'state':{'opened':'true'}, 'type' : 'okay'});
          traffic.push({id: vptp_node_id, raw_request: request});
          handleVPTP(vptp, vptp_node_id);
        }
      });
    }
  });  
});


function findListIndexByURL(list, inurl) {
  var ret = -1;
  if (inurl.indexOf("rnd=") > -1) {
    inurl = inurl.replace(/(\?|&)rnd=[^&]*($|&)/, function(match, g1, g2) {
      if (g1 == "&") {
        return g2;
      }
      else {
        return g1;
      }
    });
  }
  $.each(list, function(index, entry) {
    if (inurl.indexOf(entry.url) > -1) {
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

function handleVPTP(vptp, node_id) {
  if (vptp.insertionPoint) {
    $.each(vptp.insertionPoint, function(index,point) {
      condition = point.conditions.condition[0].name;
      ip_node_id = the_tree.create_node(node_id,{ 'text':'[INSERTION POINT '+index+']'});
      $.each(point.slot, function(sindex,slot) {
        slot_node_id = the_tree.create_node(ip_node_id,{ 'text':'[SLOT '+sindex+']'});
        //slot vast
        $.each(slot.vast.ad, function(aindex,ad) {
          var adobj;
          if (ad.inLine.creatives) {
            try {
              adobj = JSON.parse(ad.inLine.creatives.creative[0].linear.adParameters.value);
            }
            catch (err) {
              console.log("Invalid JSON inside ad object. This should not happen...");
              console.log(err);
              return;
            }
            console.log("Parsed ad object:");
            console.log(adobj);
            $.each(adobj.ad, function(idx, ad) {
              var adtype;
              if (condition == 'OnBeforeContent') {
                adtype = 'preroll';
              }
              else if (condition == 'OnContentEnd') {
                adtype = 'postroll';
              }
              else {
                //midroll?
                adtype = 'midroll';
              }
              ad_node_id = the_tree.create_node(slot_node_id,{ 'text': condition+' ad', 'type' : adtype});
              if (adobj.ad[idx].inLine) {
                error_node_id = the_tree.create_node(ad_node_id,{ 'text': '[ERROR] ' + adobj.ad[idx].inLine.error});
                expectURL(error_node_id, adobj.ad[idx].inLine.error);
    
                impression_node_id = the_tree.create_node(ad_node_id,{'text': '[IMPRESSIONS]'});
                if (adobj.ad[idx].inLine.impressions) {
                    $.each(adobj.ad[idx].inLine.impressions, function(index, imp) {
                      imp_node_id = the_tree.create_node(impression_node_id, {'text': imp.value});
                      expectURL(imp_node_id, imp.value);
                    });
                }
                if (adobj.ad[idx].inLine.creatives.creative) {
                  $.each(adobj.ad[idx].inLine.creatives.creative, function(index,creative) {
                    creatives_node_id = the_tree.create_node(ad_node_id,{'text': '[CREATIVES]'});
                    $.each(creative.linear.mediaFiles.mediaFile, function(index, mediafile) {
                      creative_node_id = the_tree.create_node(creatives_node_id,{'text': '['+ mediafile.type +'] ' + mediafile.value});
                      expectURL(creative_node_id, mediafile.value);
                    });
                    tracking_node_id = the_tree.create_node(ad_node_id,{'text': '[TRACKINGEVENTS]'});
                    $.each(creative.linear.trackingEvents.tracking, function(index, event) {
                      event_node_id = the_tree.create_node(tracking_node_id,{'text': '['+ event.event +'] ' + event.value});
                      expectURL(event_node_id, event.value);
                    });
                  });
                }
              }
            });
          }
        });
        
        //slot tracking
        st_node_id = the_tree.create_node(ip_node_id,{ 'text':'[SLOT TRACKING]'});
        console.log("Slot is currently:");
        console.log(slot);
        if (slot.trackingEvents) {
          $.each(slot.trackingEvents.tracking, function(tindex,event) {
            t_node_id = the_tree.create_node(st_node_id,{ 'text':'['+event.event+'] '+ event.value});
            expectURL(t_node_id, event.value);
          });
        }
      });
    });
  }
  if (vptp.trackingEvents) {
    tracking_node_id = the_tree.create_node(node_id,{ 'text':'[GLOBAL TRACKING]'});
    $.each(vptp.trackingEvents.tracking, function(index,obj) {
      event_node_id = the_tree.create_node(tracking_node_id,{ 'text':'['+obj.event+'] '+obj.value, });
      expectURL(event_node_id, obj.value);
    });
  }

}

function handleVAST(nodeSet, parent_node_id) {
  nodeSet.each(function(i) {
    tagname = $(nodeSet[i]).prop("tagName").toUpperCase();
    
    //if (tagname == "AD") { //Handle Multiple Ads in same response }
    
    if ((tagname == "CREATIVES") || (tagname == "MEDIAFILES") || (tagname == "TRACKINGEVENTS") || (tagname == "VIDEOCLICKS") || (tagname == "AD")) {
      node_id = the_tree.create_node(parent_node_id,{ 'text':'['+tagname+']'});
    }
    else if (tagname == "ERROR" || tagname == "IMPRESSION") {
      console.log("In error/impressions");
      //This is breaking VAST right now
      if ($(nodeSet[i]).text() != "") {
        error_node_id = the_tree.create_node(parent_node_id, {'text':'['+tagname+']'});
        node_id = the_tree.create_node(error_node_id,{ 'text':$(nodeSet[i]).text()});
        the_tree.open_node(the_tree.get_parent(node_id));
        expectURL(node_id, $(nodeSet[i]).text());        
      }
      else {
        console.log("node text was empty: " + $(nodeSet[i]).text());
        node_id = parent_node_id;
      }
      //for some reason
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
  if (url == "") {
    console.log("Refusing to watch for emtpy URL");
    return;
  }
  if (url.indexOf("rnd=") > -1) {
    url = url.replace(/(\?|&)rnd=[^&]*($|&)/, function(match, g1, g2) {
      if (g1 == "&") {
        return g2;
      }
      else {
        return g1;
      }
    });    
  }
  list_index = findListIndexByURL(watchlist, url);
  if (list_index == -1) {
    watchlist.push({treenode: [tree_node_id], url: url, status: "expect"});
  }
  else {
    entry = watchlist[list_index];
    entry.treenode.push(tree_node_id);
  }
  $('#jstree').jstree(true).get_node(tree_node_id, true).addClass("adspy_expect");
  $('#jstree').jstree(true).get_node(tree_node_id).li_attr["class"] += " adspy_expect";
}

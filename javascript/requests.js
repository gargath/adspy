var count = 1;

var traffic = [];

$(window).load(function() {
  chrome.devtools.network.onRequestFinished.addListener(function(request) {
    
    traffic.push({id: count, raw_request: request});
    
    var the_tree = $('#jstree').jstree(true);
    count++;
    node_id = the_tree.create_node("1",{'id':count, 'text':(count-1)+' '+request.request.url});
  });  
});


function findRequestById(key) {
    return traffic.filter(function(element) {return element.id == key;})[0];
}
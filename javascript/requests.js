var count = 1;

(function() {

function listen() {
  var reloadButton = document.querySelector('.mybutton');
  console.log("Page listener called...");
  reloadButton.addEventListener('click', function() {tree();});
  
  var treeButton = document.querySelector('.addTreeButton');
  treeButton.addEventListener('click', function() {
      console.log("Clear button clicked");
      var the_tree = $('#jstree_demo').jstree(true);
      var nodes = the_tree.get_children_dom ("1");
      jQuery.each(nodes, function(i, val) {the_tree.delete_node(val);});
    });
  
  chrome.devtools.network.onRequestFinished.addListener(
    function(request) {
      console.log("Request URL: "+request.request.url);
      var the_tree = $('#jstree_demo').jstree(true);
      count++;
      the_tree.create_node("1",{'id':count, 'text':count+' '+request.request.url});
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
chrome.devtools.panels.create(
    'AdSpy',
    null, // No icon path
    '/panels/requests.html',
    null // no callback needed
);
chrome.devtools.inspectedWindow.eval('console.log("Created...")');
console.log("Good old log");

var main_menu = { "items" : [
    { "title":"Tasks" , "url":"/get?tasks" },
    { "title":"Hue" , "url":"/get?hue" },
    { "title":"Pioneer" , "url":"/get?pioneer" }
	]
};

var items = main_menu.items;

function sendAppMsgToPebble(dict) {
  Pebble.sendAppMessage(
      dict,
      function(e) {
				console.log("Sending message.");
      },
      function(e) {
        console.log("Failed to send message!");
      }
  );
}

// Listen for when the watchapp is opened
Pebble.addEventListener('ready',
  function(e) {
		var dictionary = {
			"KEY_MENU_ITEMS": items.length
		};
    sendAppMsgToPebble(dictionary);

    for(var i = 0; i < items.length; i++) {
      var dictionary2 = {
        "KEY_MENU_TITLE": items[i].title,
        "KEY_MENU_URL": items[i].url
      };
      sendAppMsgToPebble(dictionary2);
		}
  }
);

// Show configuration page
Pebble.addEventListener('showConfiguration', function(e) {
  Pebble.openURL('http://pebble.mrkunkel.com/settings.php');
});

// Handle the settings update
Pebble.addEventListener('webviewclosed', function(e) {
  console.log('Configuration window returned: ' + e.response);
  var configuration;
  try {
    configuration = JSON.parse(decodeURIComponent(e.response));
		
		//https://github.com/mcongrove/PebbleBigBlocks/blob/master/src/js/pebble-js-app.js
		
    //localStorage.clear();
    //localStorage.setItem("pat", configuration.pat);
    //localStorage.setItem("pid", configuration.pid);
  } catch(err) {
    configuration = false;
    console.log("No JSON response or received Cancel event");
  }
});
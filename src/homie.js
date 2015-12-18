/*
var accesstoken = localStorage.getItem("sparkat");
var deviceid = localStorage.getItem("sparkdd");

var xhrRequest = function (url, type, callback) {
  var xhr = new XMLHttpRequest();
  xhr.onload = function () {
    callback(this.responseText);
  };
  xhr.open(type, url);
  xhr.send();
};

function getDeviceStatus() {
  // Construct URL
	var url = 'https://api.spark.io/v1/devices?access_token=' + accesstoken;

  // Send request to Spark Cloud
  xhrRequest(url, 'GET', 
    function(responseText) {
      // responseText contains a JSON object with device info
      var json = JSON.parse(responseText);

      // Get First Device Name
      var spark_name = json[0].name;

      // Last Application
			var spark_app = (json[0].last_app === null) ? "Null" : json[0].last_app;

			// Is Connected?
			var spark_on = (json[0].connected) ? "Yes" : "No";

			// Last heard from
			var spark_heard = (json[0].last_heard === null) ? "Unknown" : json[0].last_heard.substring(11,19);

      // Assemble dictionary using our keys
      var dictionary = {
        "KEY_NAME": spark_name,
        "KEY_APP": spark_app,
        "KEY_CONNECTED": spark_on,
        "KEY_HEARD": spark_heard
      };

      // Send to Pebble
      Pebble.sendAppMessage(dictionary,
        function(e) {
          //console.log("Device info sent to Pebble successfully!");
        },
        function(e) {
          //console.log("Error sending device info to Pebble!");
        }
      );
    }      
  );
}

var xhrPost = function (url, type, params, callback) {
  var xhp = new XMLHttpRequest();
  xhp.onload = function () {
    callback(this.responseText);
  };
  xhp.open(type, url);
  xhp.setRequestHeader("Content-type","application/x-www-form-urlencoded; charset=UTF-8");
  xhp.send(params);
};

function setLED(state) {
	var params = 'access_token=' + accesstoken + '&params=' + state;
	var url = "https://api.spark.io/v1/devices/" + deviceid + "/led";
	
  // Send request to Spark Cloud
  xhrPost(url, 'POST', params,
    function(responseText) {
      // responseText contains a JSON object with device info
      var json = JSON.parse(responseText);

      // Get First Device Name
			var spark_result = ((json.return_value == 1) && (state == 1)) ? "On" : "Off";

      // Assemble dictionary using our keys
      var dictionary = {
        "KEY_APP": spark_result
      };

      // Send to Pebble
      Pebble.sendAppMessage(dictionary,
        function(e) {
          //console.log("Spark Command Response sent to Pebble successfully!");
        },
        function(e) {
          //console.log("Error sending Spark Command Response to Pebble!");
        }
      );
    }      
  );
}

function notifySpark(state) {
	var params = 'access_token=' + accesstoken + '&params=' + state;
	var url = "https://api.spark.io/v1/devices/" + deviceid + "/notify";
	
  // Send request to Spark Cloud
  xhrPost(url, 'POST', params,
    function(responseText) {
      // responseText contains a JSON object with device info
    }      
  );
}

*/
//var url = "https://api.spark.io/v1/devices/";

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
				//console.log("Sending message.");
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
  Pebble.openURL('http://headrest.mrkunkel.com/config.php');
});

	
/*

// Listen for when the watchapp is opened
Pebble.addEventListener('ready',
  function(e) {
    getDeviceStatus();

		//Register EventSource listener
    var core = new EventSource("https://api.spark.io/v1/devices/" + deviceid +
                               "/events/?access_token=" + accesstoken);
		core.addEventListener('open',
      function(e) {
        //Send the payload
        var dictionary = {
          "KEY_APP": "Listening"
        };
        Pebble.sendAppMessage(
            dictionary,
            function(e) {
                console.log("Listening to Spark.");
            },
            function(e) {
                console.log("Failed to Listen to Spark!");
            }
        );
		});

    core.addEventListener('error',
      function(e) {
        console.log("Spark Listener Errored!"); 
      },false);
		
    core.addEventListener("SSEvent", 
      function(response) {
        //Interpret response as JSON
        var rawData = JSON.parse(response.data);
				var parsedData = JSON.parse(rawData.data);
 
				if (parsedData.hasOwnProperty('state')) {
          var dictionary = {
            "KEY_APP": parsedData.state
          };
				
          //Send the payload
          Pebble.sendAppMessage(
            dictionary,
            function(e) {
                //console.log("Sent '" + parsedData.state + "' to Pebble.");
            },
            function(e) {
                //console.log("Failed to send data to Pebble!");
            }
          );
						
					}
				else if (parsedData.hasOwnProperty('info')) {
          Pebble.showSimpleNotificationOnPebble("Hello",parsedData.info);
				}
      }, 
      false
    );
  }
);

// Listen for when an AppMessage is received
Pebble.addEventListener('appmessage',
  function(e) {
    if ('KEY_LED' in e.payload) {
			setLED((e.payload.KEY_LED == '5')? 1 : 0);
		}
		else if ('KEY_NOTIFY' in e.payload){
			notifySpark(e.payload.KEY_NOTIFY);
		}
  }                     
);

// Show configuration page
Pebble.addEventListener('showConfiguration', function(e) {
  Pebble.openURL('http://headrest.mrkunkel.com/config.php');
});

// Handle the settings update
Pebble.addEventListener('webviewclosed', function(e) {
  console.log('Configuration window returned: ' + e.response);
  var configuration;
  try {
    configuration = JSON.parse(decodeURIComponent(e.response));
    //localStorage.clear();
    localStorage.setItem("sparkat", configuration.sparkat);
    localStorage.setItem("sparkdd", configuration.sparkdd);
  } catch(err) {
    configuration = false;
    console.log("No JSON response or received Cancel event");
  }
});
*/
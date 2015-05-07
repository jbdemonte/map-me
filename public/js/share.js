/**
 * return number of ms since first call
 **/
function timer() {
    var start = (new Date()).getTime();
    return function () {
        return (new Date()).getTime() - start;
    }
}

/**
 *  Class Client
 *  Manage the connection with the server
 */
function Client(callbacks) {
    var channel,
        cache = {},
        socket = io();

    callbacks = callbacks || {};

    function connect() {
        socket.emit("channel", function (result) {
            if (result) {
                channel = result;
                if (callbacks.channel) {
                    callbacks.channel(channel);
                }
            }
        });
    }

    socket.on("reconnect", function () {
        socket.emit("reuse", channel, function (result) {
            if (!result) {
                channel = "";
                connect();
            }
        });
    });

    connect();

    this.latlng = function (lat, lng) {
        if (cache.lat !== lat || cache.lng !== lng) {
            var elapsed = timer();
            cache.lat = lat;
            cache.lng = lng;
            socket.emit("latlng", {lat: lat, lng: lng}, function () {
                if (callbacks.timer) {
                    callbacks.timer(elapsed());
                }
            });
        }
    };

    this.heading = function (heading) {
        if (cache.heading !== heading) {
            var elapsed = timer();
            cache.lat = heading;
            socket.emit("heading", {heading: heading}, function () {
                if (callbacks.timer) {
                    callbacks.timer(elapsed());
                }
            });
        }
    };
}

/**
 * Bind device latLng and heading, send it to the server and update display
 * @param client {Client}
 */
function bind(client) {

    // Bind device orientation to get heading (in degree)
    if (window.DeviceOrientationEvent) {
        window.addEventListener("deviceorientation", function (event) {
            var heading = -1;
            if (event.hasOwnProperty("compassHeading")) {
                heading = Math.round(event.compassHeading);
            } else if (event.hasOwnProperty("webkitCompassHeading")) {
                heading = Math.round(event.webkitCompassHeading);
            }
            if (heading !== -1) {
                $("#compass").css({
                    transform: 'rotate(-' + heading + 'deg)',
                    webkitTransform: 'rotate(-' + heading + 'deg)'
                });
                client.heading(heading);
            }
        }, true);
    } else {
        // All devices does not provide heading feature
        $("#compass").remove();
    }

    // Bind device global position and send it to the server
    navigator.geolocation.watchPosition(
        function (pos) {
            client.latlng(pos.coords.latitude, pos.coords.longitude);
        },
        function () {},
        {
            enableHighAccuracy: true,
            timeout: 250,
            maximumAge: 500
        }
    );

}

$(function () {
    if (!window.navigator) {
        $("#message").html("your browser doesn't support geolocation");
    } else {
        var client = new Client({
            channel: function (channel) {
                channel = channel.toString().split("");

                channel.splice(6, 0, " ");
                channel.splice(3, 0, " ");

                $("#currentId").html(channel.join(''));
                $("body").removeClass("init");

                bind(client);
            },
            timer: function (time) {
                $("#latency .value").html(time);
            }
        });
    }
});
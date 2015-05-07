$(function () {

    var init = false,
        locked = false,
        cache = {},
        socket = io(),
        pos = [-28.643387, 153.612224],
        $map = $("#map").gmap3({
            map: {
                options: {
                    center: pos,
                    zoom: 12,
                    disableDefaultUI: false,
                    streetViewControl: false,
                    zoomControlOptions: {
                        style: google.maps.ZoomControlStyle.LARGE,
                        position: google.maps.ControlPosition.LEFT_TOP
                    }
                }
            },
            marker: {
                latLng: pos
            },
            streetviewpanorama: {
                divId: "streetview",
                latLng: pos
            }
        });

    function latLng(data) {
        var pos = new google.maps.LatLng(data.lat, data.lng),
            marker = $map.gmap3({get: "marker"}),
            panorama = $map.gmap3({get: "streetviewpanorama"});

        cache.lat = data.lat;
        cache.lng = data.lng;

        if (!init) {
            init = true;
            $map.gmap3("get").setCenter(pos);

        }

        if (marker) {
            marker.setPosition(pos);
        }

        if (panorama && !locked) {
            panorama.setPosition(pos);
        }

    }

    function heading(data) {
        var panorama = $map.gmap3({get: "streetviewpanorama"});
        cache.heading = data.heading;
        if (panorama && !locked) {
            panorama.setPov({
                heading: data.heading,
                pitch: 0
            });
        }
    }

    socket.on("latlng", latLng);
    socket.on("heading", heading);

    function lock() {
        locked = true;
    }

    function unlock() {
        var marker = $map.gmap3({get: "marker"}),
            panorama = $map.gmap3({get: "streetviewpanorama"});
        locked = false;
        if (cache.hasOwnProperty("lat") && marker) {
            marker.setPosition(new google.maps.LatLng(cache.lat, cache.lng));
            if (panorama) {
                panorama.setPosition(marker.getPosition());
            }
        }
        if (cache.hasOwnProperty("heading") && panorama) {
            panorama.setPov({
                heading: cache.heading,
                pitch: 0
            });
        }
    }

    $("body")
        .on("mousedown", lock)
        .on("mouseup", unlock)
        .on("mousedown", lock)
        .on("touchstop", unlock);


    $("form").submit(function () {
        var start = null,
            channel = $("#target").val().replace(/[^0-9]+/g, ""),
            position = $map.gmap3({get: "marker"}).getPosition(),
            requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;



        function step(timestamp) {
            var progress, pct,
                maxTime = 300;
            if (start === null) start = timestamp;
            progress = timestamp - start;
            pct = Math.min(50, 50 * progress / maxTime); // 50% to achieve in maxTime
            $map.css({
                height: (100 - pct) + "%"
            });
            $map.gmap3({trigger: "resize"}).gmap3("get").setCenter(position);
            if (progress < maxTime) {
                requestAnimationFrame(step);
            }
        }
        socket.emit("join", channel, function (result, data) {
            if (!result) {
                $("#error").html("Unknown partner id");
            } else {
                if (data) {
                    if (data.hasOwnProperty("lat")) {
                        position = new google.maps.LatLng(data.lat, data.lng);
                        latLng(data);
                    }
                    if (data.hasOwnProperty("heading")) {
                        heading(data);
                    }
                }

                $("#menu").remove();

                if (requestAnimationFrame) {
                    requestAnimationFrame(step);
                } else {
                    $map.animate({height: "50%"}, function () {
                        $map
                            .gmap3({trigger: "resize"})
                            .gmap3("get").panTo($map.gmap3({get: "marker"}).getPosition());
                    });
                }
            }
        });

        return false;
    });

});

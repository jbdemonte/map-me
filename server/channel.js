var events = require("events");

function Channel(channelName) {
    var timer = 0,
        data = {};

    events.EventEmitter.call(this);

    this.latLng = function (lat, lng) {
        data.lat = lat;
        data.lng = lng;
    };

    this.heading = function (heading) {
        data.heading = heading;
    };

    this.data = function () {
        return data;
    };

    this.destroy = function () {
        var self = this;
        timer = timer || setTimeout(function () {
            self.emit("destroy", channelName);
        }, 10 * 60 * 1000); // 10mn
    };

    this.reuse = function () {
        if (timer) {
            clearTimeout(timer);
            timer = 0;
        }
    };

    this.name = function () {
        return channelName;
    };

}

Channel.prototype.__proto__ = events.EventEmitter.prototype;

module.exports = Channel;
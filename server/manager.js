var Channel = require('./channel');

function random (low, high) {
    return Math.floor(Math.random() * (high - low) + low);
}

function
    Manager() {

    if (!(this instanceof Manager)) return new Manager();

    var channels = {};

    function destroy(name) {
        delete channels[name];

    }

    this.create = function () {
        var name = 0,
            n = 100;

        while (n && (!name || channels.hasOwnProperty(name))) {
            name = random(100000000, 999999999);
            n--;
        }

        if (channels.hasOwnProperty(name)) {
            name = 0;
        } else {
            channels[name] = new Channel(name);
            channels[name].on("destroy", destroy);
        }
        return channels[name];
    };

    this.get = function (name) {
        return channels[name];
    };

    this.destroy = function (name) {
        if (channels.hasOwnProperty(name)) {
            delete channels[name];
        }
    }
}


module.exports = Manager;
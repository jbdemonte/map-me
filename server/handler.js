var manager = require('./manager')();

function run(callback) {
    return callback && typeof callback === "function" ? callback : function () {};
}

function Handler(socket) {
    var channel, creator;

    socket.on("channel", function (callback) {
        channel = channel || manager.create();
        creator = true;
        socket.join(channel.name());
        run(callback)(channel.name());
    });

    socket.on("reuse", function (name, callback) {
        channel = manager.get(name);
        if (channel) {
            channel.reuse();
            socket.join(channel.name());
        }
        run(callback)(!!channel);
    });

    socket.on("join", function (name, callback) {
        channel = manager.get(name);
        if (channel) {
            socket.join(channel.name());
        }
        run(callback)(!!channel, channel ? channel.data() : null);
    });

    socket.on("latlng", function (data, callback) {
        if (channel) {
            channel.latLng(data.lat, data.lng);
            socket.broadcast.to(channel.name()).emit("latlng", data);
            run(callback)();
        }
    });

    socket.on("heading", function (data, callback) {
        if (channel) {
            channel.heading(data.heading);
            socket.broadcast.to(channel.name()).emit("heading", data);
            run(callback)();
        }
    });

    socket.on('disconnect', function () {
        if (channel && creator) {
            channel.destroy();
        }
    });
}

module.exports = Handler;
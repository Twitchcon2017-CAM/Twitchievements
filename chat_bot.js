var tmi = require('tmi.js');
var fs = require('fs');

var options = {
    options: {
        debug: true
    },
    connection: {
        cluster: "aws",
        reconnect: true
    },
    identity: {
        username: "lenny_face_bot",
        password: //PUT KEY HERE` 
    },
    channels: ["cmonte905"]
};

var client = new tmi.client(options);
client.connect();


client.on('chat', function(channel, user, message, self) {
    var user_string = user["username"];
    var message_return = user_string + " " + message + "\n";
    fs.appendFileSync('message.txt', message_return);
});

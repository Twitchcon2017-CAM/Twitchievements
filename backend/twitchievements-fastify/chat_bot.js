var tmi = require('tmi.js');
var msg_count = 0; //the number of messages sent during the stream

class twitch_chat_reader {
    constructor(channel) {
        this.msg_count = 0;
        this.client = new tmi.client({
            options: {
                debug: false
            },
            connection: {
                cluster: "aws",
                reconnect: true
            },
            identity: {
                username: "lenny_face_bot",
                password: 'oauth:lfdh5h0dzjvg4vyfdin2hb1web1ky7'
            },
            channels: [channel]
        });
        this.wordDictionary = {};
    }

    getEmojiDictionary() {
        //TODO: dictionary of emojis
        return { "happyface": 0 };
    }

    parse(user, msg) {
        msg_count++;
        var msg_arr = msg.split(" "); // split the message into array of string by whitespace
        var word_count = msg_arr.length; // get the count, this will be summed to the user's chattiness
        var caps_count = 0; //count of the number of CAPITALIZED words in the message, summed for user
        var emoji_count = 0; //count the number of emojis used, summed for user
        for (var i = 0; i < word_count; i++) {
            var word = msg_arr[i];

            // Add the word to our word dicitonary
            // Be sure to remove dots to avoid dot notation in bracket notation
            let wordHashFriendly = word;
            wordHashFriendly = wordHashFriendly.replace(/\./g, '');
            wordHashFriendly = wordHashFriendly.replace(/\$/g, '');
            if(this.wordDictionary[wordHashFriendly]) {
              this.wordDictionary[wordHashFriendly]++;
            } else {
              this.wordDictionary[wordHashFriendly] = 1;
            }

            // Start our emjoi dictionary
            var emojiDict = this.getEmojiDictionary();
            if (emojiDict[word] != undefined) {
                emoji_count++;
            }
            if (word === word.toUpperCase()) {
                //console.log(word+" "+word.toUpperCase());
                caps_count++;
            }
        }
        const response = {
          msg_count,
          word_count,
          caps_count,
          wordDictionary: this.wordDictionary,
          //emoji_count - No Emoji Count until we get this working
        }
        return response;
    }

    run(chatCallback, context) {
        this.client.connect();

        this.client.on('chat', (channel, user, message) => {
            var user_string = user["username"];
            var message_return = user_string + " " + message;
            chatCallback(user_string, message_return, this.parse(user_string, message_return), context);
        });
    }
};

// Export the thing
module.exports = twitch_chat_reader;

var tmi = require('tmi.js');
var emotes = require('./emotes.json');
var api = require('twitch-api-v5');
api.clientID = 'ktd1tfplvxj65uiba004h8y4jtnm8i';
var msg_count = 0; //the number of messages sent during the stream

class twitch_chat_reader {
    constructor(channel) {

      this.isCurrentlyLive = false;
      this.liveListener = false;
      this.channel = channel;

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
        this.emojiDictionary = {};
        this.colorDictionary = {};
    }

    getEmojiDictionary() {
        return emotes;
    }

    isChannelLive(channelName) {
      return new Promise((resolve, reject) => {
        api.streams.live({channel: ""},function(err, res) {
          if (err) console.log("Error" + err);
          else {
            var stream_list = res['streams'];
            for(var i = 0; i < stream_list.length; i++) {
              var stream = stream_list[i];
              var channel = stream['channel'];
              var url = channel['url'];
              url = url.replace("https://www.twitch.tv/", "");
              //console.log(url+" "+channelName);
              if(url === channelName) resolve("hurrah");
            }
            reject("sad");
          }
        });
      });
    }

    updateOnlineStatus() {

      this.isChannelLive(this.channel).then(() => {

        this.isCurrentlyLive = true;

        this.liveListener = setTimeout(() => {
          // continues listening
          this.updateOnlineStatus();
        }, 300000);
        // Runs once every 5 minutes
      }).catch(() => {

        this.isCurrentlyLive = false;

        this.liveListener = setTimeout(() => {
          // continues listening
          this.updateOnlineStatus();
        }, 300000);
        // Runs once every 5 minutes
      });
    }

    parse(user, msg, color) {
        msg_count++;
        var msg_arr = msg.split(" "); // split the message into array of string by whitespace
        var word_count = msg_arr.length; // get the count, this will be summed to the user's chattiness
        var caps_count = 0; //count of the number of CAPITALIZED words in the message, summed for user
        var emoji_count = 0; //count the number of emojis used, summed for user
        var color_count = 0; //counts user's most common color

        for (var i = 0; i < word_count; i++) {
            var word = msg_arr[i].trim();
            var bad_word = ['a', 'the', 'in', 'or', 'of', 'to', 'on', 'at', 'as', 'an']
            var bad = false;
            for(var j = 0; j < bad_word.length; j++){
              if(bad_word[j] === word){
                bad = true;
                break;
              }
            }
            if(bad)
              continue;

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

            //Adding in colors into the dict
            if (color) {
              if(this.colorDictionary[color]){
                  this.colorDictionary[color]++;
              } else {
                  this.colorDictionary[color] = 1;
              }
            }

            // Start our emjoi dictionary
            var emojiDict = this.getEmojiDictionary();
            // Check if it is an emoji
            if(emojiDict[word]) {
              if (this.emojiDictionary[word] != undefined) {
                  this.emojiDictionary[word]++;
              } else {
                this.emojiDictionary[word] = 1;
              }
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
          emoji_count,
          wordDictionary: this.wordDictionary,
          emojiDictionary: this.emojiDictionary,
          colorDictionary: this.colorDictionary
        }
        return response;
    }

    run(chatCallback, context) {
        this.client.connect();

        if(!this.liveListener) {
          this.updateOnlineStatus();
        }

        this.client.on('chat', (channel, user, message) => {
          if(this.isCurrentlyLive) {
            var user_string = user["username"];
            var user_color = user['color'];
            var message_return =  message;
            chatCallback(user_string, message_return, this.parse(user_string, message_return, user_color), context);
          }
        });
    }
};

// Export the thing
module.exports = twitch_chat_reader;

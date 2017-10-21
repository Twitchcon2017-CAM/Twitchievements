var tmi = require('tmi.js');
var fs = require('fs');
var msg_count = 0; //the number of messages sent during the stream

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
        password: 'oauth:lfdh5h0dzjvg4vyfdin2hb1web1ky7'
    },
    channels: ["cmonte905"]
};

var client = new tmi.client(options);
client.connect();


client.on('chat', function(channel, user, message, self) {
    var user_string = user["username"];
    var message_return = user_string + " " + message + "\n";
    parse(user, msg)
    fs.appendFileSync('message.txt', message_return);
});

function getWordDictionary(){
  //TODO: get the dictionary of word usage which should be contained in the stream log level of the JSON
  return {"twitch":0, "bloody":0, "con":0};
}

function getEmojiDictionary(){
  //TODO: dictionary of emojis
  return {"happyface":0};
}

function parse(user, msg){
    msg_count++;
    var msg_arr = msg.split(" "); //split the message into array of string by whitespace
    word_count = msg_arr.length; //get the count, this will be summed to the user's chattiness
    caps_count = 0;              //count of the number of CAPITALIZED words in the message, summed for user
    emoji_count = 0;             //count the number of emojis used, summed for user
    for(word in msg_arr){
      var dict = getWordDictionary(); //access word frequency dict for this session or streamer? unclear at this point
      var emojiDict = getEmojiDictionary();
      if(emojiDict[word] != undefined){
        emoji_count++;
      }
      if(dict[word] != undefined){
        dict[word]++;
      }
      else {
        dict[word] = 1;
      }
      if(word === word.toUppercase()){
        caps_count++;
      }
    }
    Console.log(msg_count+" "+word_count+" "+caps_count+" "+emojiDict);


}

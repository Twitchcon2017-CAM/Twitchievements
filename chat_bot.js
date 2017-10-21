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
        password: ''
    },
    channels: ["cmonte905"]
};

var client = new tmi.client(options);
var api = require('twitch-api-v5');
function isChannelLive(channelName){
  return new Promise((resolve, reject) => {
    api.streams.live({channel:""},function(err, res){
      if(err)
        console.log("Error" + err);
      else
        {
            var stream_list = res['streams'];
            for(var i = 0; i < stream_list.length; i++){
              var stream = stream_list[i];
              var channel = stream['channel'];
              var url = channel['url'];
              url = url.replace("https://www.twitch.tv/", "");
              //console.log(url+" "+channelName);
              if(url === channelName)
                resolve("hurrah");

          }
          reject("sad");
        }
    });
  });


}
var live = isChannelLive('dreamhackcs');
live.then((res)=>{
  console.log(res);
});
console.log(live);


client.connect();

client.on('chat', function(channel, user, message, self) {
    var user_string = user["username"];
    var message_return = user_string + " " + message + "\n";
    parse(user_string, message_return);

    fs.appendFileSync('message.txt', message_return);
});

function getWordDictionary(){
  //TODO: get the dictionary of word usage which should be contained in the stream log level of the JSON
  return {"twitch":0, "bloody":0, "co":0};
}

function getEmojiDictionary(){
  //TODO: dictionary of emojis
  return {"happyface":0};
}

function CheckOnlineStatus(name)
{
  client.on("unhost", function(channel, viewers){
    console.log("JS shits")
  });
}


function parse(user, msg){
    //console.log(msg);
    msg_count++;
    var msg_arr = msg.split(" "); //split the message into array of string by whitespace
    word_count = msg_arr.length; //get the count, this will be summed to the user's chattiness
    caps_count = 0;              //count of the number of CAPITALIZED words in the message, summed for user
    emoji_count = 0;             //count the number of emojis used, summed for user
    for(var i = 0; i < word_count; i++){
      var word = msg_arr[i];
    //for(word in msg_arr){
      var dict = getWordDictionary(); //access word frequency dict for this session or streamer? unclear at this point
      var emojiDict = getEmojiDictionary();
      if(emojiDict[word] != undefined){
        emoji_count++;
      }
      if(dict[word] != undefined){
        //console.log(word);
        dict[word]++;
      }
      else {
        dict[word] = 1;
      }
      if(word === word.toUpperCase()){
        //console.log(word+" "+word.toUpperCase());
        caps_count++;
      }
    }
    //console.log(msg_count+" "+word_count+" "+caps_count+" "+emoji_count);


}

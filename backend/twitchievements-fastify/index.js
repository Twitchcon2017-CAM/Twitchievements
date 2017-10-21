// Require the framework and instantiate it
const fastify = require('fastify')();

// Import our chat bot
const twitchChatReader = require('./chat_bot');
const chatReaders = {};

// CORS
fastify.use(require('cors')());

// Get passwords
const securePassword = require('secure-password');
// Initialise our password policy
const pwd = securePassword();

// Initialize JWTs
const tokenSecret = 'supersecretfortwitchievements';
fastify.register(require('fastify-jwt'), { secret: tokenSecret }, err => {
  if (err) throw err
});

// Define Our categories
const twitchievementCategories = [
  {
    twitchievement: 'msg_count',
    displayName: 'Talkative',
    description: 'These users always have something to say. Measured by how many individual messages a user sends'
  },
  {
    twitchievement: 'word_count',
    displayName: 'Chattiest',
    description: 'Short isn\'t always sweet. Counts the number of words in each message sent by a user.'
  },
  {
    twitchievement: 'caps_count',
    displayName: 'LOUDEST',
    description: 'EVERYONE CAN HEAR YOU IF YOU YELL IN ALL CAPS! Measures how many words a user yells.'
  },
  {
    twitchievement: 'emoji_count',
    displayName: 'I ❤️ Emoji',
    description: 'If you not speaking emoji, 🤐. Measures users who most frequently use emoji'
  },
  {
    twitchievement: 'wordDictionary',
    displayName: 'Most Frequent Word',
    description: 'A trending word appears! Measures the most frequent word amongst the communitty.',
    valueBased: true
  },
  {
    twitchievement: 'emojiDictionary',
    displayName: 'Most Frequent Emoji',
    description: 'An emoji is worth a thousand words. Most frequent emojis in the chat.',
    valueBased: true
  },
  {
    twitchievement: 'colorDictionary',
    displayName: 'Most Used Color',
    description: 'Color says a lot about your personality. Most assigned color to users',
    valueBased: true
  },
  // {
  //   twitchievement: 'emoji_count',
  //   displayName: 'Emojiest',
  //   description: ''
  // }
];

// Initialize mongo, fs for testing
const collectionName = 'streamers';
var fs = require('fs');
fastify.register(require('fastify-mongodb'), {
  url: 'mongodb://localhost/twitchievements'
}, err => {
  if (err) throw err

  // Now that we have mongo, let's watch our user's streams
  const { db } = fastify.mongo;
  getCollection(db, collectionName, (collectionErr, collection) => {
    if (collectionErr) throw collectionErr;

    // Iterate all of our streamers
    // https://stackoverflow.com/questions/24215021/how-do-i-iterate-over-an-entire-mongodb-collection-using-mongojs

    const cursor = collection.find();
    // Execute the each command, triggers for each document
    cursor.each(function(err, item) {
      // If the item is null then the cursor is exhausted/empty and closed
      if(item == null) {
        return;
      }

      // Start a chat bot reader for our streamer
      const chatReader = new twitchChatReader(item.twitchUsername);
      chatReader.run(chatReaderRunHandler, {
        email: item.email,
        collection
      });
      // Add the chat reader to our readers
      chatReaders[item.twitchUsername] = chatReader;
    });
  });
});


// Run handler for chat.run objects.
// COntext must conatin email and collection
function chatReaderRunHandler(user, fullMessage, parseResult, context) {

  // Break out our ocntext
  const email = context.email;
  const collection = context.collection;

  // Save to the specified user in streamer object
  collection.findOne({ email }, (streamerFindErr, streamer) => {
    if (streamerFindErr) {
      throw err;
    }

    const users = streamer.users;

    // First check if the user exists
    if (!users[user]) {
      users[user] = parseResult;
    } else {
      // Update the values on the user
      Object.keys(parseResult).forEach(parseKey => {
        // if the key exists on the user, add, else set
        if(users[user][parseKey]) {
          users[user][parseKey] += parseResult[parseKey];
        } else {
          users[user][parseKey] += parseResult[parseKey];
        }
      });
    }

    // Get our word dictionary
    let wordDictionary = {};
    if (parseResult.wordDictionary) {
      wordDictionary = Object.assign(wordDictionary, parseResult.wordDictionary);
    }
    if (streamer.wordDictionary) {
      wordDictionary = Object.assign(wordDictionary, streamer.wordDictionary);
    }

    // Get our emoji dictionary
    let emojiDictionary = {};
    if (parseResult.emojiDictionary) {
      emojiDictionary = Object.assign(emojiDictionary, parseResult.emojiDictionary);
    }
    if (streamer.emojiDictionary) {
      emojiDictionary = Object.assign(emojiDictionary, streamer.emojiDictionary);
    }

    // Get our emoji dictionary
    let colorDictionary = {};
    if (parseResult.colorDictionary) {
      colorDictionary = Object.assign(colorDictionary, parseResult.colorDictionary);
    }
    if (streamer.colorDictionary) {
      colorDictionary = Object.assign(colorDictionary, streamer.colorDictionary);
    }

    collection.updateOne({ email }, {$set: {
      users,
      wordDictionary,
      emojiDictionary,
      colorDictionary
    }});
  });
}

// Function to get our collection
// Pass our db, the collection we are getting, and a callback for when it is found
function getCollection(db, collectionKey, callback) {
  db.collection(collectionKey, (err, collection) => {
    if(err) {
      callback(err);
      return;
    }

    if (!collection) {
      db.createCollection(collectionKey, (createErr, newCollection) => {
        if (createErr) {
          callback(createErr);
          return;
        }

        callback(undefined, newCollection);
        return;
      });
    }

    callback(undefined, collection);
  });
}

function getStatsForUser(username, reply, returnAwards) {
  const { db } = fastify.mongo;

  getCollection(db, collectionName, (err, collection) => {
    if (err) {
      reply.send(err);
      return;
    }

    // Find the streamer
    collection.findOne({ twitchUsername: username }, (findErr, streamer) => {
      if (findErr) {
        reply
        .code(500)
        .send('Error finding the specified User');
      }

      if (!streamer) {
        reply
        .code(404)
        .send('Streamer Not registered with twitchievements');
        return;
      }

      if (Object.keys(streamer.users).length < 5 &&
        (!streamer.awards ||
        Object.keys(streamer.awards).length <= 0)
      ) {
        reply
        .code(503)
        .send('Please hang tight while we start monitoring the chat!');
        return;
      }

      const chatTwitchievements = {};

      // Find Top 5 of each key
      twitchievementCategories.forEach(twitchievementObject => {
        const twitchievement = twitchievementObject.twitchievement;
        chatTwitchievements[twitchievement] = {
          displayName: twitchievementObject.displayName,
          description: twitchievementObject.description,
        };
        // Handle Value Based twitchievements
        if(twitchievementObject.valueBased) {
          chatTwitchievements[twitchievement].values = [];

          // Find and sort the object on the streamer
          if(streamer[twitchievement]) {
            const valueKeys = Object.keys(streamer[twitchievement]);
            valueKeys.sort((a, b) => {
              if(streamer[twitchievement][a] > streamer[twitchievement][b]) {
                return -1;
              }
              if(streamer[twitchievement][a] < streamer[twitchievement][b]) {
                return 1;
              }
              return 0;
            });

            valueKeys.slice(0, 10).forEach(valueKey => {
              chatTwitchievements[twitchievement].values.push({
                key: valueKey,
                amount: streamer[twitchievement][valueKey]
              });
            });
          }
        } else {
          // Handle User based Twitcheivements
          chatTwitchievements[twitchievement].users = [];
          // Iterate through all of the streamers users and sort by the category
          // Getting the keys of all the users, and then comparing them to the specified category on the user
          // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort
          const userKeys = Object.keys(streamer.users);
          userKeys.sort((a, b) => {
            if(!streamer.users[b][twitchievement] ||
              streamer.users[b][twitchievement] < streamer.users[a][twitchievement]) {
              return -1;
            }
            if(streamer.users[b][twitchievement] > streamer.users[a][twitchievement]) {
              return 1;
            }

            return 0;
          });

          // Pop the top 10 onto the twitchievement, and populate the user value for the twitchievement
          const userKeySlice = userKeys.slice(0, 10)
          userKeySlice.forEach((userKey, index) => {
            chatTwitchievements[twitchievement].users.push({
              username: userKey,
              value: streamer.users[userKey][twitchievement]
            });
          });

          // Try to add the award to the first user
          collection.findOne({ twitchUsername: userKeySlice[0] }, (awardFindErr, awardUser) => {
            if (awardFindErr) {
              // Just skip awards
              return;
            }

            if(awardUser) {
              userHasAward = false;
              // Look through the user's awards. Going to use dates as keys
              if(awardUser.awards) {
                Object.keys(awardUser.awards).forEach((awardKey) => {
                  if(awardUser.awards[awardKey].stream === streamer.twitchUsername &&
                  awardUser.awards[awardKey].twitchievement &&
                  awardUser.awards[awardKey].twitchievement.twitchievementKey === twitchievement) {
                    // They've already gotten this award
                    userHasAward = true;
                  }
                });
              } else {
                awardUser.awards = {};
              }

              if(!userHasAward) {
                // Give the user the award because it was not found Already
                const dateNow = new Date();
                awardUser.awards[dateNow.toString()] = {
                  stream: streamer.twitchUsername,
                  twitchievement: {
                    twitchievementKey: twitchievement,
                    displayName: twitchievementObject.displayName,
                    description: twitchievementObject.description
                  }
                }

                // Update the award user
                collection.updateOne({ twitchUsername: userKeySlice[0] }, {$set: {
                  awards: awardUser.awards
                }});
              }
            }
          });
        }
      });

      // Finally respond with our twitchievements
      const responseTwitchievements = {
        streamTwitchievements: chatTwitchievements
      }
      if(returnAwards) {
        responseTwitchievements.userTwitchievements = streamer.awards;
      }

      reply
      .code(200)
      .send(responseTwitchievements);
    });
  });
}


// Declare a route
fastify.post('/api/join', (request, reply) => {
  const { db } = fastify.mongo;

  // Check for the Email existing
  if (!request.body.email || !request.body.password || !request.body.twitchUsername) {
    reply
    .code(400)
    .send('Not enough params');
    return;
  }

  // Get our streamers collection
  getCollection(db, collectionName, (err, collection) => {
    if (err) {
      reply.send(err);
      return;
    }

    collection.findOne({$or:[
      { email: request.body.email },
      { twitchUsername:  request.body.twitchUsername }
    ]}, (findErr, user) => {
      if (user) {
        let errMsg = '';
        if(user.email === request.body.email) {
          errMsg = 'Email Already Exists';
        } else {
          errMsg = 'Twitch username Already Exists';
        }
        reply
        .code(409)
        .send(errMsg);
        return;
      }

      // Email does not exist, create the user
      pwd.hash(Buffer.from(request.body.password), (hashErr, hash) => {
        collection.insert({
          email: request.body.email,
          securePassword: hash,
          twitchUsername: request.body.twitchUsername,
          users: {},
          awards: {},
          wordDictionary: {}
        }, (insertErr, result) => {
          if (insertErr) {
            reply
            .code(500)
            .send('Could not create user');
            return;
          }

          // Start a chat bot reader for our streamer
          const chatReader = new twitchChatReader(request.body.twitchUsername);
          chatReader.run(chatReaderRunHandler, {
            email: request.body.email,
            collection
          });
          // Add the chat reader to our readers
          chatReaders[request.body.twitchUsername] = chatReader;

          // Generate a JWT for the user
          const token = fastify.jwt.sign({
            email: request.body.email,
            twitchUsername: request.body.twitchUsername
          });

          reply
          .code(200)
          .send({
            token,
            email: request.body.email,
            twitchUsername: request.body.twitchUsername
          });
        });
      });
    });
  });
});

fastify.post('/api/login', (request, reply) => {
  const { db } = fastify.mongo;

  // Check for the Email existing
  if (!request.body.email || !request.body.password) {
    reply
    .code(400)
    .send('Not enough params');
    return;
  }

  // Get our collection
  getCollection(db, collectionName, (err, collection) => {
    collection.findOne({ email: request.body.email },  (err, user) => {
      if (err) {
        reply
        .code(500)
        .send('Server error finding user');
        return;
      }

      if (!user) {
        reply
        .code(404)
        .send('Email not found');
        return;
      }

      // Verify the password with the hash stored int he DB
      pwd.verify(Buffer.from(request.body.password), user.securePassword.buffer, (passErr, result) => {
        if (passErr) {
          reply
          .code(500)
          .send('Server error verifying password');
          return;
        }

        if (result === securePassword.INVALID_UNRECOGNIZED_HASH) {
            reply
            .code(500)
            .send('This hash was not made with secure-password. Attempt legacy algorithm');
            return;
        }
        if (result === securePassword.INVALID) {
            reply
            .code(401)
            .send('Imma call the cops');
            return;
        }
        if (result === securePassword.VALID) {
            // Generate a JWT for the user
            const token = fastify.jwt.sign({
              email: request.body.email,
              twitchUsername: user.twitchUsername
            });

            reply
            .code(200)
            .send({
              token,
              email: request.body.email,
              twitchUsername: user.twitchUsername
            });
            return;
        }
        if (result === securePassword.VALID_NEEDS_REHASH) {
          console.log('Yay you made it, wait for us to improve your safety');

          pwd.hash(userPassword, function (err, improvedHash) {
            if (err) {
                console.error('You are authenticated, but we could not improve your safety this time around');

                // Generate a JWT for the user
                const token = fastify.jwt.sign({
                  email: request.body.email,
                  twitchUsername: user.twitchUsername
                });

                reply
                .code(200)
                .send({ token });
                return;
            }

            // TODO: Save improvedHash somewhere

            // Generate a JWT for the user
            const token = fastify.jwt.sign({
              email: request.body.email,
              twitchUsername: user.twitchUsername
            });

            reply
            .code(200)
            .send({ token });
            return;
          })
        }
      });
    });
  });
});

// Get Stats for the current user
fastify.get('/api/stats', (request, reply) => {
  // Error if no token
  if(!request.headers.token) {
    reply
    .code(400)
    .send('No Free wristbands');
    return;
  }

  // Get the token
  fastify.jwt.verify(request.headers.token, tokenSecret, function(err, tokenDecoded) {
    if (err) {
      reply
      .code(401)
      .send('Unauthorized. Imma call the cops');
      return;
    }

    // Get the stats for the user
    getStatsForUser(tokenDecoded.twitchUsername, reply, true);
  });
});

// Get Stats for the passed user
fastify.get('/api/stats/:params', (request, reply) => {
  // Get the stats for the user
  getStatsForUser(request.params.params, reply);
});

// Run the server!
fastify.listen(8000, function (err) {
  if (err) throw err
  console.log(`server listening on ${fastify.server.address().port}`)
});

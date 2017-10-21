// Require the framework and instantiate it
const fastify = require('fastify')();

// Import our chat bot
const twitchChatReader = require('./chat_bot');
const chatReaders = [];

// CORS
fastify.use(require('cors')());

// Get passwords
const securePassword = require('secure-password');
// Initialise our password policy
const pwd = securePassword();

// Initialize JWTs
fastify.register(require('fastify-jwt'), { secret: 'supersecretfortwitchievements' }, err => {
  if (err) throw err
});

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
    if (collectionErr) throw colelctionErr;

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
      chatReader.run((user, fullMessage, parseResult) => {
        //console.log(`${user} / ${fullMessage} / ${JSON.stringify(parseResult, null, 4)}`);
        //fs.appendFileSync('message.txt', `${user} / ${fullMessage} / ${parseResult}`);

        // Save to the specified user in streamer object
        collection.findOne({ email: item.email }, (streamerFindErr, streamer) => {
          if (streamerFindErr) {
            throw err;
          }

          // First check if the user exists
          if (!streamer.users[user]) {
            streamer.users[user] = parseResult;
            console.log(streamer.users);
          } else {
            // Update the values on the user
            Object.keys(parseResult).forEach(parseKey => {
              //if the key exists on the user, add, else set
              if(streamer.users[user][parseKey]) {
                streamer.users[user][parseKey] += parseResult[parseKey];
              } else {
                streamer.users[user][parseKey] += parseResult[parseKey];
              }
            });
          }

          collection.updateOne({ email: item.email }, streamer, (updateErr) => {
            if (updateErr) {
              throw err;
            }
            //console.log(user);
            console.log(JSON.stringify(streamer.users, null, 4));
            //console.log(JSON.stringify(parseResult, null, 4));
          });
        });
      });

      // Add the chat reader to our readers
      chatReaders.push(chatReader);
    });
  });
});

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

  // Check for the Email existing
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
          users: []
        }, (insertErr, result) => {
          if (insertErr) {
            reply
            .code(500)
            .send('Could not create user');
            return;
          }

          // Generate a JWT for the user
          const token = fastify.jwt.sign({
            email: request.body.email,
            twitchUsername: request.body.twitchUsername
          });

          reply
          .code(200)
          .send({token});
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
              twitchUsername: request.body.twitchUsername
            });

            reply
            .code(200)
            .send({ token });
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
                  twitchUsername: request.body.twitchUsername
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
              twitchUsername: request.body.twitchUsername
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

// Run the server!
fastify.listen(8000, function (err) {
  if (err) throw err
  console.log(`server listening on ${fastify.server.address().port}`)
});

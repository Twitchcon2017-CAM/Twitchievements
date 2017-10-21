// Require the framework and instantiate it
const fastify = require('fastify')();

// Get passwords
const securePassword = require('secure-password');
// Initialise our password policy
const pwd = securePassword();

// Initialize JWTs
fastify.register(require('fastify-jwt'), { secret: 'supersecretfortwitchievements' }, err => {
  if (err) throw err
});

// Initialize mongo
fastify.register(require('fastify-mongodb'), {
  url: 'mongodb://localhost/twitcheivements'
}, err => {
  if (err) throw err
});
const collectionName = 'streamers';

// Function to get our collection
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
fastify.post('/signup', (request, reply) => {
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

fastify.post('/login', (request, reply) => {
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

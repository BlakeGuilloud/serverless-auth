'use strict';

const mongoose = require('mongoose');
const bluebird = require('bluebird');
mongoose.Promise = bluebird;

const mongoString = process.env.MONGODB_URI;
const db = mongoose.connect(mongoString).connection;

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const Resolver = require('./utils/Resolver');
const User = require('./User.model');

module.exports.register = (event, context, callback) => {
  const data = event.body;
  // const data = JSON.parse(event.body);

  const newUser = new User(data);
  
  newUser.hash_password = bcrypt.hashSync(data.password, 10);

  return new Resolver(newUser.save(newUser), db, callback);
};

module.exports.login = (event, context, callback) => {
  const data = event.body;
  // const data = JSON.parse(event.body);

  bluebird.resolve(User.findOne({ email: data.email }))
    .then(user => {
      if (!user) {
        const response = {
          statusCode: 403,
          error: 'Incorrect username',
        };
      
        callback(null, response); 
      } else if (!user.comparePassword(data.password)) {
        const response = {
          statusCode: 403,
          error: 'Incorrect password',
        };
      
        callback(null, response); 
      } else {
        const response = {
          statusCode: 200,
          auth: jwt.sign({
            email: user.email,
            fullName: user.fullName,
            _id: user._id
          }, process.env.JWT_SECRET),
        };
      
        callback(null, response);
      }
    })
    .catch(err => callback(null, { status: 500, err }))
    .finally(() => db.close());
}

module.exports.getUser = (event, context, callback) => {
  try {
    const decoded = jwt.verify(event.headers.Authorization, process.env.JWT_SECRET);
    
    callback(null, {
      statusCode: 200,
      body: JSON.stringify(decoded),
    })
  } catch(err) {
    const response = {
      statusCode: 500,
      error: err,
    };
  
    callback(null, response);
  } finally {
    db.close();
  }
}

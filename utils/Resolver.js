function sendSuccess(body, callback) {
  const response = {
    statusCode: 200,
    body: JSON.stringify(body),
  };

  callback(null, response);
}

function sendError(err, callback) {
  const response = {
    statusCode: 500,
    error: err,
  };

  // callback(response, null);
  callback(null, response); // Todo: decide how to properly send errors.
}

function Resolver(bbPromise, database, callback) {
  return bbPromise
    .then(user => sendSuccess(user, callback))
    .catch(err => sendError(err, callback))
    .finally(() => database.close());
}

module.exports = Resolver;
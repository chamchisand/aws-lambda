'use strict';

exports.handler = (event, context, callback) => {
  var async = require("async");
  var redis = require("redis");
  var client = redis.createClient({
    host: 'XXX'
  });

  client.on("error", function (err) {
    callback(err);
  });

  client.keys('httpcache:*', function(err, keys) {
    if (err) {
      return callback(err);
    }

    async.eachSeries((keys || []), function(key, callback) {
      client.del(key, callback);
    }, function(err) {
      client.quit();
      callback(err, "httpcache cleared");
    });
  });
};

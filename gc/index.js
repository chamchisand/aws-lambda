'use strict';

var async = require('async');
var AWS = require('aws-sdk');

AWS.config.update({
	region: "us-west-2",
	apiVersion: '2012-08-10'
});

var dynamodb = new AWS.DynamoDB();
var client = new AWS.DynamoDB.DocumentClient();

function cleanup(now, env, callback) {
  var tableName = 'session-' + env;
  var run = true;
	var total = 0;
	var params = {
    TableName: tableName,
    ProjectionExpression: 'id, expires',
    FilterExpression: '#expires < :expires',
    ExpressionAttributeNames: {
      '#expires': 'expires',
    },
    ExpressionAttributeValues: {
      ':expires': +now
    },
    Limit: 25
	};

  async.whilst(
    function() {
      return run === true;
    },
    function(callback) {
      client.scan(params, (err, data) => {
        if (err) {
          return callback(err);
        }

        if (!data.Items || data.Items.length === 0) {
          run = false;
          return callback();
        }

        if (!data.LastEvaluatedKey) {
          run = false;
        } else {
          params.ExclusiveStartKey = data.LastEvaluatedKey;
        }

        var items = [];
        for (let item of data.Items) {
          total++;
          items.push({DeleteRequest: {Key: {id: {S: item.id}}}});
        }

        var RequestItems = {};
        RequestItems[tableName] = items;

        dynamodb.batchWriteItem({
          RequestItems: RequestItems,
          ReturnConsumedCapacity: 'NONE',
          ReturnItemCollectionMetrics: 'NONE'
        }, function(err) {
          callback(err);
        });
      });
    },
    function(err) {
      callback(err, total);
    }
  );
}

exports.handler = (event, context, callback) => {
  var now = Math.floor(new Date() / 1000);
  var totals = {};

  async.eachSeries([
    'production',
    'development'
  ], function(env, callback) {
    cleanup(now, env, function(err, total) {
      totals[env] = total;
      callback();
    });
  }, function(err) {
    callback(err, totals);
  });
};

var mongodb = require('mongodb');
var csv = require('csv-parser');
var fs = require('fs');

var MongoClient = mongodb.MongoClient;
var mongoUrl = 'mongodb://localhost:27017/911-calls';

var nullifyEmptyValues = function(str) {
  return (str !== undefined && str.trim() !== "") ? str.trim() : null;
}

var createCall = function(data) {
  const lat = nullifyEmptyValues(data["lat"]);
  const lng = nullifyEmptyValues(data["lng"]);
  var location = null;
  if (lat && lng) {
    location = [parseFloat(lng), parseFloat(lat)];
  }

  var category = null;
  var description = null;
  if (data["title"] !== undefined) {
    category = data["title"].split(":")[0].trim();
    description = data["title"].split(":")[1].trim();
  }

  return {
	"location": location,
	"zip": parseFloat(data["zip"]),
	"category" : category,
	"description" : description,
	"@timestamp": new Date(data["timeStamp"]),
	"quarter": nullifyEmptyValues(data["twp"]),
	"address": nullifyEmptyValues(data["addr"])
    };
}

var insertCalls = function(db, callback) {
    var collection = db.collection('calls');

    var calls = [];
    fs.createReadStream('../911.csv')
        .pipe(csv())
        .on('data', data => {
            var call = createCall(data);
            calls.push(call);
        })
        .on('end', () => {
          collection.insertMany(calls, (err, result) => {
            callback(result)
          });
        });
}

MongoClient.connect(mongoUrl, (err, db) => {
    insertCalls(db, result => {
        console.log(`${result.insertedCount} calls inserted`);
        db.close();
    });
});

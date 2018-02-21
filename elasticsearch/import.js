var elasticsearch = require('elasticsearch');
var csv = require('csv-parser');
var fs = require('fs');

var esClient = new elasticsearch.Client({
  host: 'localhost:9200',
  log: 'error',
  requestTimeout: Infinity,
  keepAlive: false
});

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

let callsList = [];
fs.createReadStream('../911.csv')
  .pipe(csv())
  .on('data', data => {
    callsList.push({ "index" : { "_index" : "call", "_type" : "call" } });
    callsList.push(createCall(data));
  })
  .on('end', () => {
    esClient.bulk({
      body: callsList
    });
  });

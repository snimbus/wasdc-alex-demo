// simple test script

var nforce = require('./nforce');
var _ = require('./lodash');
var moment = require('./moment-timezone');
var pluralize = require('./pluralize');

var org = nforce.createConnection({
  clientId: '3MVG9i1HRpGLXp.qpyCPMgKpCHiSklniascbjECxcIklObZXndWoR6pFOeQ.ODzGCGocz79OoNcVKJGZ341Y2',
  clientSecret: '701192384342238285',
  redirectUri: 'http://localhost:4300/_callback',
  mode: 'single'
});

var username = 'kalyan@snimbus.com.alexa';
var password = 'Google1233GuCaQCInqqR2sEPN5l211Jg';

var opportunityName = 'Jones';

var query = "select name, stagename, probability, amount from Opportunity where Name = '" + opportunityName + "'";
// auth and run query
org.authenticate({ username: username, password: password }).then(function(){
  return org.query({ query: query })
}).then(function(results) {
  var speechOutput = 'Sorry, I could not find Opportunity ' + opportunityName;
  if (results.records.length > 0) {
    var opp = results.records[0];
    speechOutput = 'I found Opportunity ' + opportunityName + ' for $' + opp.get('Amount') + ', the stage is ' + opp.get('StageName') + ' and the probability is ' + opp.get('Probability') + '%';
  }
  console.log(speechOutput);
}).error(function(err) {
  console.log(err);
});

/**
 * App ID for the skill to restrict access
 */
var APP_ID = 'amzn1.ask.skill.cf2a8308-b89f-4030-8ef7-3dd1406e4348'; //replace with "amzn1.echo-sdk-ams.app.[your-unique-value-here]";nod

var CLIENT_ID = '3MVG9i1HRpGLXp.qpyCPMgKpCHiSklniascbjECxcIklObZXndWoR6pFOeQ.ODzGCGocz79OoNcVKJGZ341Y2';
var CLIENT_SECRET = '701192384342238285';
var USERNAME = 'kalyan@snimbus.com.alexa';
var PASSWORD = 'Google1233GuCaQCInqqR2sEPN5l211Jg';
var CALLBACK_URL = 'http://localhost:4300/_callback';

/**
 * The AlexaSkill prototype and helper functions
 */
var AlexaSkill = require('./AlexaSkill');
var nforce = require('nforce');
var _ = require('lodash');
var moment = require('moment-timezone');
var pluralize = require('pluralize');

/**
 * Salesforce is a child of AlexaSkill.
 * To read more about inheritance in JavaScript, see the link below.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Introduction_to_Object-Oriented_JavaScript#Inheritance
 */
var Salesforce = function () {
    AlexaSkill.call(this, APP_ID);
};

var org = nforce.createConnection({
  clientId: CLIENT_ID,
  clientSecret: CLIENT_SECRET,
  redirectUri: CALLBACK_URL,
  mode: 'single'
});

// Extend AlexaSkill
Salesforce.prototype = Object.create(AlexaSkill.prototype);
Salesforce.prototype.constructor = Salesforce;

Salesforce.prototype.eventHandlers.onSessionStarted = function (sessionStartedRequest, session) {
    console.log("Salesforce onSessionStarted requestId: " + sessionStartedRequest.requestId
        + ", sessionId: " + session.sessionId);
    // any initialization logic goes here
};

Salesforce.prototype.eventHandlers.onLaunch = function (launchRequest, session, response) {
    console.log("Salesforce onLaunch requestId: " + launchRequest.requestId + ", sessionId: " + session.sessionId);
};

/**
 * Overridden to show that a subclass can override this function to teardown session state.
 */
Salesforce.prototype.eventHandlers.onSessionEnded = function (sessionEndedRequest, session) {
    console.log("Salesforce onSessionEnded requestId: " + sessionEndedRequest.requestId
        + ", sessionId: " + session.sessionId);
    // any cleanup logic goes here
};

Salesforce.prototype.intentHandlers = {

  // start the Location process
  LocationStatusEvent: function (intent, session, response) {
      handleLocationStartRequest(session, response);
  },

  // Find the Location
  LocationIntent: function (intent, session, response) {
      handleLocationRequest(intent, session, response);
  },

   // Find the Location
  LocationAppointmentIntent: function (intent, session, response) {
      handleAppointmentRequest(intent, session, response);
  },

  // help with 'Salesforce'
  HelpIntent: function (intent, session, response) {
      response.ask("You can ask Salesforce to check for any new leads, your calendar for today, the status of a specific opportunity or to create a new lead, or, you can say exit... What can I help you with?");
  }
};

// start a new session to ask for Location
function handleLocationStartRequest(session, response) {
  var speechOutput = "OK, What is the location?";
  response.ask(speechOutput);
}


// start a new session to create a lead
function handleLeadStartRequest(session, response) {
  var speechOutput = "OK, let's create a new lead., What is the person's first and last name?";
  response.ask(speechOutput);
}

// continue the session, collect the person's name
function handleLeadNameIntent(intent, session, response) {
  var speechOutput = "Got it. the name is, " + intent.slots.Name.value + "., What is the company name?";
  session.attributes.name = intent.slots.Name.value;
  response.ask(speechOutput);
}

// collect the company name and create the actual lead
function handleLeadCompanyIntent(intent, session, response) {
  var speechOutput = "Bingo! I created a new lead for  "
    + session.attributes.name + " with the company name " + intent.slots.Company.value;
  var names = session.attributes.name.split(' ');
  var obj = nforce.createSObject('Lead');
  obj.set('FirstName', names[0]);
  obj.set('LastName', names[1]);
  obj.set('Company', intent.slots.Company.value);

  org.authenticate({ username: USERNAME, password: PASSWORD }).then(function(){
    return org.insert({ sobject: obj })
  }).then(function(results) {
    if (results.success) {
      response.tellWithCard(speechOutput, "Salesforce", speechOutput);
    } else {
      speechOutput = 'Darn, there was a salesforce problem, sorry.';
      response.tellWithCard(speechOutput, "Salesforce", speechOutput);
    }
  }).error(function(err) {
    var errorOutput = 'Darn, there was a Salesforce problem, sorry';
    response.tell(errorOutput, "Salesforce", errorOutput);
  });
}

// fetch an opportunity by name
function handleLocationRequest(intent, session, response) {
  var locationName = intent.slots.LocationName.value;
  console.log('The Location is : ' + locationName);
  session.attributes.locationName = intent.slots.LocationName.value;
  var query = "Select Id, Name, Street__c, City__c, State__c, Zip__c from Location__c where Name = '" + locationName + "'";
  // auth and run query
  console.log('the location query is : ' + query);
  org.authenticate({ username: USERNAME, password: PASSWORD }).then(function(){
    return org.query({ query: query })
  }).then(function(results) {
    var speechOutput = 'Sorry, I could not find a Location named, ' + locationName;
    if (results.records.length > 0) {
      var loc = results.records[0];
      console.log('loc : ' + loc);
      session.attributes.locationID = loc.get('Id');
      console.log('The location ID is : ' + session.attributes.locationID);
      speechOutput = 'I found Location ' + locationName + ' located at ' + loc.get('Street__c') + ', ';
      speechOutput += loc.get('City__c') + ', ' + loc.get('State__c') + ', ' + loc.get('Zip__c');
      speechOutput += '. Do you want to setup an appointment?';
    }
    response.askWithCard(speechOutput);
  }).error(function(err) {
    console.log('err: ' + err);
    var errorOutput = 'Darn, there was a Salesforce problem in finding the location, sorry';
    response.tell(errorOutput, "Salesforce", errorOutput);
  });
}

// fetch an opportunity by name
function handleAppointmentRequest(intent, session, response) {
  console.log('inside appointment intent');
    var speechOutput = "I created a new meeting for  at "
    + session.attributes.locationName + " Branch on February, 18 at 5 PM, will see you soon. Good Bye!";
  
  var yesNoVal = intent.slots.boolYesNo.value;
  console.log('The appointment setup value is : ' + yesNoVal);
  var locationID = session.attributes.locationID;
  console.log('The location ID is : ' + locationID);
  //Create an Event
  var obj = nforce.createSObject('Event');
  //obj.set('AccountId', '00146000002if2lAAA');
  obj.set('WhoId', '00346000001rPkSAAU');
  obj.set('WhatId', locationID);
  obj.set('StartDateTime', '2017-02-22T19:00:00.000Z');
  obj.set('Description','Appointment setup by Alexa for John Smith');
  obj.set('DurationInMinutes',60);

  org.authenticate({ username: USERNAME, password: PASSWORD }).then(function(){
    return org.insert({ sobject: obj })
  }).then(function(results) {
    if (results.success) {
      response.tellWithCard(speechOutput, "Salesforce", speechOutput);
    } else {
      console.log('results : ' + results);
      speechOutput = 'Darn, there was a salesforce problem, sorry.';
      response.tellWithCard(speechOutput, "Salesforce", speechOutput);
    }
  }).error(function(err) {
    console.log('err : ' + err);
    var errorOutput = 'Darn, there was a Salesforce problem, sorry';
    response.tell(errorOutput, "Salesforce", errorOutput);
  });
}

// Create the handler that responds to the Alexa Request.
exports.handler = function (event, context) {
    // Create an instance of the Salesforce skill.
    var salesforce = new Salesforce();
    salesforce.execute(event, context);
};
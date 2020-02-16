'use strict';

const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;

// Imports dependencies and set up http server
const
    express = require('express'),
    bodyParser = require('body-parser'),
    app = express().use(bodyParser.json()); // creates express http server

const request = require('request');

// read in some hard-coded restaurants...
const dataRestaurants = require('./data/restaurants.json').restaurants;

// do a deepcopy, not affect hard-coded data.
var restaurants = JSON.parse(JSON.stringify(dataRestaurants));

function setPayload(restaurants) {
    restaurants.forEach((rest, idx) => {
        rest.buttons[1].payload = 'SEE_DETAILS_' + idx;
        rest.buttons[2].payload = 'REMOVE_IT_' + idx;
        rest.buttons[0].payload = 'SELECT_IT_' + idx;
    })
}

setPayload(restaurants);

// Sets server port and logs message on success
app.listen(process.env.PORT || 1337, () => console.log('webhook is listening'));

// Handles messages events
function handleMessage(sender_psid, received_message) {
    let response;

    // Checks if the message contains text
    if (received_message.text) {
        // Create the payload for a basic text message, which
        // will be added to the body of our request to the Send API
        response = {
            "text": `You sent the message: "${received_message.text}". Here are the recommended restaurants!`
        }
        // Send the response message
        callSendAPI(sender_psid, response);
        
        restaurants = JSON.parse(JSON.stringify(dataRestaurants));
        setPayload(restaurants);
        response = {
            "attachment": {
                "type": "template",
                "payload": {
                    "template_type": "generic",
                    "elements": restaurants
                }
            }
        }
        callSendAPI(sender_psid, response);

    } else if (received_message.attachments) {
        // Get the URL of the message attachment
        let attachment_url = received_message.attachments[0].payload.url;
        response = {
            "attachment": {
                "type": "template",
                "payload": {
                    "template_type": "generic",
                    "elements": [{
                        "title": "Is this the right picture?",
                        "subtitle": "Tap a button to answer.",
                        "image_url": attachment_url,
                        "buttons": [
                            {
                                "type": "postback",
                                "title": "Yes!",
                                "payload": "yes",
                            },
                            {
                                "type": "postback",
                                "title": "No!",
                                "payload": "no",
                            }
                        ],
                    }]
                }
            }
        }
        // Send the response message
        callSendAPI(sender_psid, response);   
    }
}

// Handles messaging_postbacks events
function handlePostback(sender_psid, received_postback) {
    let response;

    // Get the payload for the postback
    let payload = received_postback.payload;

    // Set the response based on the postback payload
    if (payload === 'yes') {
        response = { "text": "Thanks!" }
        callSendAPI(sender_psid, response);
    } else if (payload === 'no') {
        response = { "text": "Oops, try sending another image." }
        callSendAPI(sender_psid, response);
    } else if (payload.startsWith("SEE_DETAILS_")) {
        var idx = parseInt(payload.slice(12));
        response = {'text': restaurants[idx].title + ' is the best restaurant!!!'}
        callSendAPI(sender_psid, response);
    } else if (payload.startsWith("REMOVE_IT_")) {
        if (restaurants.length <= 1) {
            response = { 'text': 'You only have one restaurant on list, cannot remove!' };
            callSendAPI(sender_psid, response);
        } else {
            var idx = parseInt(payload.slice(10));
            response = { 'text': 'Removing ' + restaurants[idx].title + '... New list is below' };
            callSendAPI(sender_psid, response);
            restaurants.splice(idx, 1);
            setPayload(restaurants);
            response = {
                "attachment": {
                    "type": "template",
                    "payload": {
                        "template_type": "generic",
                        "elements": restaurants
                    }
                }
            };
            callSendAPI(sender_psid, response);
        }
    } else if (payload.startsWith("SELECT_IT_")) {
        var idx = parseInt(payload.slice(10));
        response = { 'text': restaurants[idx].title + ' is selected. Bye!' }
        callSendAPI(sender_psid, response);
    }
}

// Sends response messages via the Send API
function callSendAPI(sender_psid, response) {
    // Construct the message body
    let request_body = {
        "recipient": {
            "id": sender_psid
        },
        "message": response
    }

    // Send the HTTP request to the Messenger Platform
    request({
        "uri": "https://graph.facebook.com/v2.6/me/messages",
        "qs": { "access_token": PAGE_ACCESS_TOKEN },
        "method": "POST",
        "json": request_body
    }, (err, res, body) => {
        if (!err) {
            console.log('message sent!')
        } else {
            console.error("Unable to send message:" + err);
        }
    }); 
}

// Creates the endpoint for our webhook 
app.post('/webhook', (req, res) => {

    let body = req.body;

    // Checks this is an event from a page subscription
    if (body.object === 'page') {

        // Iterates over each entry - there may be multiple if batched
        body.entry.forEach(function (entry) {

            // Gets the message. entry.messaging is an array, but 
            // will only ever contain one message, so we get index 0
            let webhook_event = entry.messaging[0];
            console.log(webhook_event);

            // Get the sender PSID
            let sender_psid = webhook_event.sender.id;
            console.log('Sender PSID: ' + sender_psid);

            // Check if the event is a message or postback and
            // pass the event to the appropriate handler function
            if (webhook_event.message) {
                handleMessage(sender_psid, webhook_event.message);
            } else if (webhook_event.postback) {
                handlePostback(sender_psid, webhook_event.postback);
            }
        });

        // Returns a '200 OK' response to all requests
        res.status(200).send('EVENT_RECEIVED');
    } else {
        // Returns a '404 Not Found' if event is not from a page subscription
        res.sendStatus(404);
    }

});

// Adds support for GET requests to our webhook
app.get('/webhook', (req, res) => {

    // Your verify token. Should be a random string.
    let VERIFY_TOKEN = "<YOUR_VERIFY_TOKEN>"

    // Parse the query params
    let mode = req.query['hub.mode'];
    let token = req.query['hub.verify_token'];
    let challenge = req.query['hub.challenge'];

    // Checks if a token and mode is in the query string of the request
    if (mode && token) {

        // Checks the mode and token sent is correct
        if (mode === 'subscribe' && token === VERIFY_TOKEN) {

            // Responds with the challenge token from the request
            console.log('WEBHOOK_VERIFIED');
            res.status(200).send(challenge);

        } else {
            // Responds with '403 Forbidden' if verify tokens do not match
            res.sendStatus(403);
        }
    }
});


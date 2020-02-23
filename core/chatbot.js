const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;

const request = require('request');
const utils = require('../utils/utils.js')
const Api = require('../api/api');
const dataRestaurants = require('../data/restaurants.json').restaurants;
// var restaurants = JSON.parse(JSON.stringify(dataRestaurants));
// utils.setPayload(restaurants);

const yelp = require('yelp-fusion');
const apiKey = process.env.YELP_API_KEY;
const client = yelp.client(apiKey);

// include all APIs.
var api = new Api();

const states = {
    ROOT: 'root',
    FIND: 'find',
    DECIDE: 'decide'
};

module.exports = class Chatbot {
    constructor() {
        // default entry state is called root.
        this.state = states.ROOT;
        this.lastInteractionTime = Date.now();
        this.dataRestaurants = []
        this.restaurants = [];
        utils.setPayload(this.restaurants);
    }

    restart() {
        // return to root state and re-initialize hardcoded data.
        this.state = states.ROOT;
        this.lastInteractionTime = Date.now();
        this.dataRestaurants = dataRestaurants;
        this.restaurants = JSON.parse(JSON.stringify(this.dataRestaurants));
        utils.setPayload(this.restaurants);
    }

    sendRestaurantList(sender_psid) {
        // send the first three restaurants.
        utils.setPayload(this.restaurants);
        var response = {
            "attachment": {
                "type": "template",
                "payload": {
                    "template_type": "generic",
                    "elements": this.restaurants.slice(0, 3)
                }
            }
        };
        this.callSendAPI(sender_psid, response);
    }

    handleMessage(sender_psid, received_message) {
        let response;

        // Checks if the message contains text
        if (received_message.text) {

            response = {
                "text": `You sent the message: "${received_message.text}".`
            }
            // Send the response message
            this.callSendAPI(sender_psid, response);

            var userInput = api.clinc(received_message.text);

            if (this.state === states.ROOT) {
                // if user wants to find restaurant, state -> FIND
                // and displays three restaurants returned by Yelp fusion
                if (userInput.intent === 'find') {
                    var yelpResult = api.yelpFusion(userInput.require)
                    this.dataRestaurants = yelpResult[0];
                    this.restaurants = yelpResult[1]
                    this.sendRestaurantList(sender_psid);
                    // this.yelpFusion(userInput.require, sender_psid);
                    this.state = states.FIND;
                } else {
                    // if user says any other intents, stay in ROOT, ask again
                    response = {
                        "text": 'Please say your requirements'
                    }
                    this.callSendAPI(sender_psid, response);
                }
            } else if (this.state === states.FIND) {
                // if user wants to change search filter, then re-call Yelp,
                // and display new three restaurants
                if (userInput.intent === 'find') {
                    var yelpResult = api.yelpFusion(userInput.require)
                    this.dataRestaurants = yelpResult[0];
                    this.restaurants = yelpResult[1];
                    this.sendRestaurantList(sender_psid);
                } else if (userInput.intent === 'remove') {
                    // if user removes one restaurant, display one new from the ones returned by Yelp API
                    var idx = userInput.position;
                    response = { 'text': 'Removing ' + this.restaurants[idx].title + '... New list is below' };
                    this.callSendAPI(sender_psid, response);
                    this.restaurants.splice(idx, 1);
                    this.dataRestaurants.splice(idx, 1);
                    this.sendRestaurantList(sender_psid);
                } else if (userInput.intent === 'detail') {
                    // if user see details, display details.
                    var idx = userInput.position;
                    // response = { 'text': this.restaurants[idx].title + ' is the best restaurant!!!' };
                    var name = JSON.stringify(this.dataRestaurants[idx].name);
                    var rating = JSON.stringify(this.dataRestaurants[idx].rating);
                    var price = JSON.stringify(this.dataRestaurants[idx].price);
                    var location = JSON.stringify(this.dataRestaurants[idx].location);
                    response = {'text': `Name: ${name}\nRating: ${rating}\nPrice: ${price}\nLocation: ${location}`}
                    this.callSendAPI(sender_psid, response);
                } else if (userInput.intent === 'select') {
                    // if user selects, change state to DECIDE, save what he selects, ask if they need further help.
                    var idx = userInput.position;
                    response = { 'text': this.restaurants[idx].title + ' is selected. Do you need other help?' };
                    this.callSendAPI(sender_psid, response);
                    this.state = states.DECIDE;
                }              
            } else if (this.state === states.DECIDE) {
                // if user requests reservation, etc, then stay in DECIDE
                if (userInput.intent === 'help') {
                    response = { 'text': 'Did some help: ' + userInput.require };
                    this.callSendAPI(sender_psid, response);
                }
                else{
                    // else return ROOT
                    this.state = states.ROOT;
                    response = { 'text': 'ByeBye, return to ROOT.' };
                    this.callSendAPI(sender_psid, response);   
                }
                
            }

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
            this.callSendAPI(sender_psid, response);
        }
    }

    handlePostback(sender_psid, received_postback) {
        let response;

        // Get the payload for the postback
        let payload = received_postback.payload;

        // Set the response based on the postback payload
        if (payload === 'yes') {
            response = { "text": "Thanks!" }
            this.callSendAPI(sender_psid, response);
        } else if (payload === 'no') {
            response = { "text": "Oops, try sending another image." }
            this.callSendAPI(sender_psid, response);
        } else if (payload.startsWith("SEE_DETAILS_")) {
            var idx = parseInt(payload.slice(12));
            response = { 'text': this.restaurants[idx].title + ' is the best restaurant!!!' }
            this.callSendAPI(sender_psid, response);
        } else if (payload.startsWith("REMOVE_IT_")) {
            if (this.restaurants.length <= 1) {
                response = { 'text': 'You only have one restaurant on list, cannot remove!' };
                this.callSendAPI(sender_psid, response);
            } else {
                var idx = parseInt(payload.slice(10));
                response = { 'text': 'Removing ' + this.restaurants[idx].title + '... New list is below' };
                this.callSendAPI(sender_psid, response);
                this.restaurants.splice(idx, 1);
                utils.setPayload(this.restaurants);
                response = {
                    "attachment": {
                        "type": "template",
                        "payload": {
                            "template_type": "generic",
                            "elements": this.restaurants
                        }
                    }
                };
                this.callSendAPI(sender_psid, response);
            }
        } else if (payload.startsWith("SELECT_IT_")) {
            var idx = parseInt(payload.slice(10));
            response = { 'text': this.restaurants[idx].title + ' is selected. Bye!' }
            this.callSendAPI(sender_psid, response);
        }
    }

    callSendAPI(sender_psid, response) {
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

  
}
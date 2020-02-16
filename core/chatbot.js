const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;

const request = require('request');
const utils = require('../utils/utils.js')
const Api = require('../api/api');
const dataRestaurants = require('../data/restaurants.json').restaurants;
// var restaurants = JSON.parse(JSON.stringify(dataRestaurants));
// utils.setPayload(restaurants);

// include all APIs.
var api = new Api();

module.exports = class Chatbot {
    constructor() {
        // default entry state is called root.
        this.state = 'root';
        this.lastInteractionTime = Date.now();
        this.dataRestaurants = dataRestaurants;
        this.restaurants = JSON.parse(JSON.stringify(this.dataRestaurants));
        utils.setPayload(this.restaurants);
    }

    restart() {
        // return to root state and re-initialize hardcoded data.
        this.state = 'root';
        this.lastInteractionTime = Date.now();
        this.dataRestaurants = dataRestaurants;
        this.restaurants = JSON.parse(JSON.stringify(this.dataRestaurants));
        utils.setPayload(this.restaurants);
    }

    handleMessage(sender_psid, received_message) {
        let response;

        // Checks if the message contains text
        if (received_message.text) {
            // Create the payload for a basic text message, which
            // will be added to the body of our request to the Send API
            response = {
                "text": `You sent the message: "${received_message.text}". Here are the recommended restaurants!`
            }
            // Send the response message
            this.callSendAPI(sender_psid, response);

            this.restaurants = JSON.parse(JSON.stringify(this.dataRestaurants));
            utils.setPayload(this.restaurants);
            response = {
                "attachment": {
                    "type": "template",
                    "payload": {
                        "template_type": "generic",
                        "elements": this.restaurants
                    }
                }
            }
            this.callSendAPI(sender_psid, response);

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
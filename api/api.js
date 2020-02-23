const dataRestaurants = require('../data/restaurants.json').restaurants;
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
// const yelp = require('yelp-fusion');
const apiKey = process.env.YELP_API_KEY;
// const client = yelp.client(apiKey);
module.exports = class Api {
    constructor() {

    }

    yelpFormatButton(result) {
        return {
            "title": result.name,
            "image_url": result.image_url,
            "subtitle": '...',
            "default_action": {
                "type": "web_url",
                "url": result.url,
                "webview_height_ratio": "tall"
            },
            "buttons": [
                {
                    "type": "postback",
                    "title": "Select it",
                    "payload": "SELECT_IT"
                },
                {
                    "type": "postback",
                    "title": "See details",
                    "payload": "SEE_DETAILS"
                },
                {
                    "type": "postback",
                    "title": "Remove it",
                    "payload": "REMOVE_IT"
                }
            ]
        };
    }

    yelpFusion(require) {
        // manually send a synchronous GET request to the end point.
        var request = new XMLHttpRequest();
        var yelpUrl = 'https://api.yelp.com/v3/businesses/search';
        const params = {
            term: require,
            location: 'ann arbor, mi',
            limit: 10
        };
        // construct query string
        var queryString = Object.keys(params).map(key => key + '=' + params[key]).join('&');
        yelpUrl += `?${queryString}`;
        console.log(yelpUrl)
        // false means synchronous request
        request.open('GET', yelpUrl, false);
        // set api toekn
        request.setRequestHeader('Authorization', `Bearer ${apiKey}`);
        request.send(null);

        if (request.status === 200) {
            var resp = JSON.parse(request.responseText);
            var dataRestaurants = resp.businesses;
            var restaurants = [];
            dataRestaurants.forEach((result) => {
                restaurants = restaurants.concat([this.yelpFormatButton(result)]);
            });
            return [dataRestaurants, restaurants];
        } else {
            return [[], []];
        }
        // // hard-coded
        // return request.responseText;
    }


    // arguments and return values undecided
    clinc(userInput) {
        if (userInput.startsWith('remove ')) {
            var pos = parseInt(userInput.slice(7));
            return { 'intent': 'remove', 'position': pos }
        } else if (userInput.startsWith('see details ')) {
            var pos = parseInt(userInput.slice(12));
            return { 'intent': 'detail', 'position': pos }
        } else if (userInput.startsWith('find ')) {
            return { 'intent': 'find', 'require': userInput.slice(5) };
        } else if (userInput.startsWith('select ')) {
            var pos = parseInt(userInput.slice(7));
            return { 'intent': 'select', 'position': pos }
        } else if (userInput.startsWith('help ')) {
            return { 'intent': 'help', 'require': userInput.slice(5) };
        } else {
            return { 'intent': 'outofscope' };
        }
    }
}
const dataRestaurants = require('../data/restaurants.json').restaurants;
const yelp = require('yelp-fusion');
const apiKey = process.env.YELP_API_KEY;
const client = yelp.client(apiKey);
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

    // arguments and return values undecided
     yelpFusion(require) {
        // const searchRequest = {
        //     term: require,
        //     location: 'ann arbor, mi',
        //     limit: 10
        // };
        // var restaurants = []
        // // const request = async () => {
        //  client.search(searchRequest).then(response => {
        //      const firstResult = response.jsonBody.businesses;
        //     //  const prettyJson = JSON.parse(JSON.stringify(firstResult));
        //      console.log(firstResult);
        //     //  console.log(Array.from(prettyJson).length);
             
        //      (firstResult).forEach((result) => {
        //         //  console.log('result')
        //         //  console.log(result)
        //         restaurants = restaurants.concat([this.yelpFormatButton(result)]);
        //          console.log(restaurants.length);

        //     });
        //      console.log(restaurants.length);
        //  }).catch(e => {
        //      console.log(e);
        //  });
        //  var count = 0;
        //  console.log(restaurants.length);
        //  while (restaurants.length == 0) {
        //     count += 0.001;
        //     // if (count > 10000) {
        //     //     break;
        //     // }
        //     //  console.log(restaurants.length);
        //     //  console.log(count);
        //  }
        //  console.log(restaurants.length);

        // return restaurants;
        // // }
        // // return request();
        // // await client.search(searchRequest);

        // //     const firstResult = response.jsonBody.businesses[0];
        // //     const prettyJson = JSON.stringify(firstResult, null, 4);
        // //     console.log(prettyJson);
        // //     prettyJson.forEach((result) => {
        // //         restaurants.concat(this.yelpFormatButton(result));
        // //     })
        // //     return restaurants;

        // // var x = await client.search(searchRequest).then(response => {
        // //     const firstResult = response.jsonBody.businesses;
        // //     const prettyJson = JSON.stringify(firstResult);
        // //     console.log(prettyJson);
        // //     // Array.from(prettyJson).forEach((result) => {
        // //     //     restaurants.concat(this.yelpFormatButton(result));
        // //     // });
        // //     return dataRestaurants;
        // // }).catch(e => {
        // //     console.log(e);
        // // })
        // // // var response = await client.search(searchRequest);
        // // await Promise.all(x);
        // hard-coded
        return dataRestaurants;
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
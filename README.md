# Yelp Chatbot frontend & backend
- Can talk on Facebook Messenger now.
- This app is under development mode, to play it, log in our group account on Facebook Messenger: https://www.messenger.com/t/108227134094509.

## For Developers
- The backend core, such as state transition, user message handling, goes in ```core/```
- The APIs (Yelp Fusion, Clinc, etc) are in ```api/```
- Any helpers may go in ```utils/```
- ```app.js``` is running on heroku server, and the webhook is connected to Facebook.
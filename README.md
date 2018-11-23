# Uber_Bot

*This app was built within 24 hours at a hackathon by Ben Elgren, Rohan Rao, Sean Yang and myself. The app was built locally and the final product uploaded to Ben Elgren's github page, where it has been forked from.*

**Demo video:** https://vimeo.com/302388942

- We implemented a **Slack** messenger app that allows user to order **Uber** through a natural conversation with a chat bot.  
- Our intelligent chat bot is powered by **IBM Watson’s** natural language processing, and allows for variation in user input. 
- By accessing the **Google Earth API**, we can convert the street addresses that were extracted from the user’s queries and translate them to exact GPS coordinates. 
- Then, through requests to the **Uber API**, we can find information about different Uber services avaiable near the user's location, and book a ride to the requested destination.  
- We enabled a secure login to Uber accounts using **OAuth**, and by directly accessing Uber’s built in validation.  Our service is linked directly to your Uber account, so once you stand up from your desk after booking your ride and closing Slack, you can track your ride on your mobile Uber app.  So go ahead and open Slack, install our SlackRide, and say hello to Watson!

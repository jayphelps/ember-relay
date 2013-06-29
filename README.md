ember-relay
===========

That whole `Promises` thing without even paying attention.

Makes Promises ***act*** like they're synchronous.

```javascript
App.Profile = Ember.Object.extend({

    // Example using Relay.
    // This code is deceptively simple. Even though we wrote the code as if
    // these calls are synchronous, in reality, Relay knows you can't find the
    // tweets until the User has been loaded because you told it so. Just as
    // you can't display those tweets until they are ready.
    usingRelay: function () {
        var relay = Relay.create(this);

        var user = relay.findUser(1234);
        var tweets = relay.findTweets(user);

        relay.displayTweets(tweets);
        
        // Do something else while they're all loading
    },

    // Example WITHOUT Relay
    withoutRelay: function () {
        var self = this;

        this.findUser(1234).then(function (user) {
            self.findTweets(user).then(function (tweets) {
                self.displayTweets(tweets);
            });
        });
        
        // Do something else while they're all loading
    },

    findUser: function (userId) {
        return App.User.find(userId);
    },

    findTweets: function (user) {
        return App.TweetsByEmail.find(user.get('email'));
    },

    displayTweets: function (tweets) {
        // Do something with the tweets
    }
});
```

Under the hood, Relay wraps your methods and keeps track of the arguments you pass, calling the real implementation only after all dependencies (promises) are resolved.

###Why?
Because I'm working on an app that uses lots of promises that depend on eachother and I'm tired of writing .then(closure).then(closure) etc. I'm also semi-anal about methods vs. spaghetti closures.

###License
MIT Licensed

###Future
In the future I plan to make this work with anything that is Promises/A compliant, not just Ember.

ember-relay
===========

That whole `Promises` thing without even paying attention.

Makes Promises ***act*** like they're synchronous.

```javascript
App.Profile = Ember.Object.extend({

    // Example using Relay.
    // This code is deceptively simple. Even though we wrote the code as if
    // these calls are synchronous, in reality, Relay knows you can't find the
    // tweets until the User has been loaded.
    usingRelay: function () {
        var relay = Relay.create(this);

        var user = relay.findUser(1234);
        var tweets = relay.findTweets(user);

        relay.displayTweets(tweets);
    },

    // Example WITHOUT Relay
    withoutRelay: function () {
        var self = this;

        this.findUser(1234).then(function (user) {
            self.findTweets(user.get('email')).then(function (tweets) {
                self.displayTweets(tweets);
            });
        });
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
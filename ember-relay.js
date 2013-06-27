(function (Ember) {
    var get = Ember.get, set = Ember.set, slice = Array.prototype.slice;

    function MethodWrapper(obj, key, method) {
        var methodWrapper = this;

        this.obj = obj;
        this.key = key;
        this.method = method;

        // Return a replacement method implementation, closures intact
        return function () {
            var arg, arguments = slice.call(arguments),
                argumentCount = arguments.length,
                resolvedArguments = [],
                deferred = methodWrapper.deferred = Relay.Deferred.create({
                    relayContext: this,
                    originalArguments: arguments
                });

            if (argumentCount > 0) {
                for (var i = 0; i < argumentCount; i++) {
                    arg = arguments[i];

                    if (arg && arg.done) {
                        arg.done(methodWrapper.argumentPromiseDidResolve, methodWrapper);
                    } else {
                        resolvedArguments.pushObject(arg);
                    }
                }
            }

            deferred.set('resolvedArguments', resolvedArguments);

            if (deferred.get('argumentPromiseCount') === 0) {
                methodWrapper.callOriginalMethod();
            }

            return deferred;
        };
    }

    MethodWrapper.prototype.argumentPromiseDidResolve = function (fulfillment) {
        this.deferred.get('resolvedArguments').pushObject(fulfillment);
        var countLeft = this.deferred.get('argumentPromiseCount');

        if (countLeft === 0) {
            this.callOriginalMethod();
        }
    };

    /**
     * Internal callback when we're ready to call the actual method, which
     * happens when it's argument's promise has been resolved.
     */
    MethodWrapper.prototype.callOriginalMethod = function () {
        var deferred = this.deferred,
            resolvedArguments = deferred.get('resolvedArguments'),
            ret;

        // Call the real implementation
        ret = this.method.apply(this.obj, resolvedArguments);

        // If it returns a promise, only resolve ourselves once they are.
        if (ret && ret.then) {
            ret.then(function (fulfillment) {
                deferred.resolve(fulfillment);
            }, function (reason) {
                deferred.reject(reason);
            });
        } else {
            deferred.resolve(ret);
        }
    };

    function Relay(obj) {
        var isConstructed = (this instanceof Relay);
        // Force construction if they're missing `new`
        if (!isConstructed) return new Relay(obj);

        for (var key in obj) {
            // Only methods can be relayed
            if (typeof obj[key] === 'function') {
                this[key] = new MethodWrapper(obj, key, obj[key]);
            }
        }
    }

    // Expose to namespace (or window, usually)
    this.Relay = Relay;

    Relay.create = function (context) {
        return new Relay(context);
    };

    Relay.Deferred = Ember.Deferred.extend({
        relayContext: null,
        originalArguments: null,
        resolvedArguments: null,

        argumentPromiseCount: Ember.computed(function () {
            return this.get('originalArguments').length - this.get('resolvedArguments').length;
        }).property('originalArguments.length', 'resolvedArguments.length'),

        always: function (callback, context) {
            this.done(callback, context).fail(callback, context);
            return this;
        },

        done: function (callback, context) {
            this.then(function (fulfillment) {
                callback.call(context || this.get('relayContext'), fulfillment);
            });
            return this;
        },

        fail: function (callback, context) {
            this.then(null, function (reason) {
                callback.call(context || this.get('relayContext'), reason);
            });
            return this;
        },

        complete: function (callback, context) {
            return this.always(callback, context);
        },

        success: function (callback, context) {
            return this.done(callback, context);
        },

        error: function (callback, context) {
            return this.fail(callback, context);
        }
    });

})(Ember);
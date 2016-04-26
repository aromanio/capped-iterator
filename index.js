/**
 * @param maxTimePerFrame {Number}
 * @constructor
 */
function CappedIterator(maxTimePerFrame) {
    var _this = this;

    this.maxTimePerFrame = maxTimePerFrame;

    this.frame = Date.now();
    this.nextFramePromise = null;

    this.skipToNextTick = function() {
        if (Date.now() - _this.frame >= _this.maxTimePerFrame) {
            if (!_this.nextFramePromise) {
                _this.nextFramePromise = new Promise(function(resolve) {
                    setTimeout(function() {
                        _this.nextFramePromise = null;
                        _this.frame = Date.now();
                        console.log('new frame.');
                        resolve();
                    }, 0);
                });
            }

            return _this.nextFramePromise;
        }
    };
}

/**
 * @param array {Array}
 * @param callback {Function<Object, Number>}
 * @returns {Promise}
 */
CappedIterator.prototype.forEachAsync = function(array, callback) {
    var _this = this;

    var promise = new Promise(function(resolve) { resolve(); });

    array.forEach(function(element, index) {
        promise = promise.then(function() {
            return callback(element, index);
        }).then(_this.skipToNextTick);
    });

    return promise;
};

/**
 * @param conditionCallback {Function}
 * @param callback {Function}
 * @returns {Promise}
 */
CappedIterator.prototype.whileAsync = function(conditionCallback, callback) {
    var _this = this;

    return new Promise(function(resolve, reject) {
        var next = function() {
            Promise.resolve(conditionCallback()).then(function(expression) {
                if (!!expression) {
                    return Promise.resolve(callback()).then(_this.skipToNextTick).then(next);
                }

                resolve();
            }).catch(reject);
        };

        next();
    });
};

module.exports = CappedIterator;
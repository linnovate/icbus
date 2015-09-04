'use strict';

var inspect = require('util').inspect;

exports.checkAndHandleError = function (err, res, defaultMessage) {
    if (err) {
        var errMesg = defaultMessage || err.errors || err.message || 'Oops...';
        console.log(inspect(errMesg));
        throw new Error(errMesg);
    }
};

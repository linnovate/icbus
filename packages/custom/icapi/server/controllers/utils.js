exports.checkAndHandleError = function (err, res, defaultMessage) {
    if (err) {
        var errMesg = defaultMessage || err.errors || err.message || 'Oops...';
        throw new Error(errMesg);
    }
};

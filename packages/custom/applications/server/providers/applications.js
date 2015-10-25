

exports.checkApp = function(req, res, next) {
    var mongoose = require('mongoose'),
        Application = mongoose.model('Application');

    Application.findOne({name: req.headers['app-name'], token: req.headers['x-csrf-token']}, function(err, app) {
        if (err || !app) {
            return res.status(500).json({
                error: 'Unrecognized application'
            });

        }

        next();

    });
};
